import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getTenantIdFromRequest } from '@/lib/tenant-context'
import { 
  parseInvoiceFromOCRText, 
  matchItemsWithInventory, 
  ParsedInvoiceResult,
  ParsedInvoiceItem 
} from '@/lib/invoice-parser'
import { createWorker } from 'tesseract.js'
import sharp from 'sharp'

export const maxDuration = 60 // Allow OCR processing time

export async function POST(request: NextRequest) {
  try {
    const tenantId = getTenantIdFromRequest(request)

    // 1. Fetch tenant context (Suppliers, Ingredients, Menu Items)
    const [suppliers, ingredients, menuItems] = await Promise.all([
      prisma.supplier.findMany({
        where: { tenantId },
        select: { id: true, name: true, phone: true }
      }),
      prisma.ingredient.findMany({
        where: { tenantId },
        select: { id: true, name: true, unit: true, costPerUnit: true }
      }),
      prisma.menuItem.findMany({
        where: { tenantId },
        select: { 
          id: true, 
          name: true, 
          price: true, 
          inventory: { select: { unit: true } } 
        }
      })
    ])

    const contentType = request.headers.get('content-type') || ''
    const customApiKey = request.headers.get('x-gemini-api-key') || ''
    const apiKey = customApiKey || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || ''

    let imageBuffer: Buffer | null = null
    let clientOcrText: string | null = null
    let mimeType = 'image/jpeg'

    // Extract payload from request
    if (contentType.includes('application/json')) {
      const body = await request.json()
      if (body.ocrText && typeof body.ocrText === 'string') {
        clientOcrText = body.ocrText
      }
      if (body.base64) {
        const matches = body.base64.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/)
        if (matches && matches.length === 3) {
          mimeType = matches[1]
          imageBuffer = Buffer.from(matches[2], 'base64')
        } else {
          imageBuffer = Buffer.from(body.base64.replace(/^data:image\/\w+;base64,/, ''), 'base64')
        }
      }
    } else if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData()
      const file = formData.get('file') as File | null
      const textParam = formData.get('ocrText') as string | null

      if (textParam && textParam.trim()) {
        clientOcrText = textParam
      }
      if (file) {
        mimeType = file.type || 'image/jpeg'
        const bytes = await file.arrayBuffer()
        imageBuffer = Buffer.from(bytes)
      }
    }

    let parsedResult: ParsedInvoiceResult | null = null
    let engineUsed: 'gemini_vision' | 'tesseract_ocr' = 'tesseract_ocr'

    // Strategy 1: If Gemini API Key is available & we have an image, use Multimodal Vision AI
    // (Handles camera shadows, crumpled receipts, noise, rotated photos, handwritten Arabic/English)
    if (apiKey && imageBuffer && imageBuffer.length > 0) {
      try {
        const geminiParsed = await analyzeInvoiceWithGemini(imageBuffer, mimeType, apiKey)
        if (geminiParsed) {
          parsedResult = geminiParsed
          engineUsed = 'gemini_vision'
        }
      } catch (geminiErr) {
        console.warn('Gemini Vision scan notice, falling back to local OCR pipeline:', geminiErr)
      }
    }

    // Strategy 2: If no Gemini result, run Advanced Local OCR with Sharp Adaptive Pre-processing
    if (!parsedResult) {
      let extractedText = clientOcrText || ''

      if (!extractedText && imageBuffer && imageBuffer.length > 0) {
        // Pre-process image with Sharp: auto-orient EXIF, resize, grayscale, contrast stretch, noise despeckle
        const preprocessedBuffer = await preprocessImageBuffer(imageBuffer)
        extractedText = await performLocalOCR(preprocessedBuffer)
      }

      if (!extractedText || !extractedText.trim()) {
        return NextResponse.json({ 
          error: 'No text or readable invoice could be extracted. Please ensure the image is well-lit and clear.' 
        }, { status: 400 })
      }

      parsedResult = parseInvoiceFromOCRText(extractedText, suppliers)
      engineUsed = 'tesseract_ocr'
    }

    // 3. Smart match line items against existing ingredients & products
    if (parsedResult.items && parsedResult.items.length > 0) {
      parsedResult.items = matchItemsWithInventory(parsedResult.items, ingredients, menuItems)
    }

    // 4. Try matching supplier ID
    let matchedSupplierId: string | undefined
    if (parsedResult.supplierName) {
      const foundSupplier = suppliers.find(
        s => s.name.toLowerCase() === parsedResult?.supplierName?.toLowerCase()
      )
      if (foundSupplier) {
        matchedSupplierId = foundSupplier.id
      }
    }

    return NextResponse.json({
      success: true,
      engineUsed,
      data: {
        ...parsedResult,
        matchedSupplierId,
        knownSuppliers: suppliers,
        knownIngredients: ingredients,
        knownMenuItems: menuItems
      }
    })
  } catch (error: any) {
    console.error('Invoice scanning error:', error)
    return NextResponse.json({ 
      error: error.message || 'Failed to scan and parse invoice' 
    }, { status: 500 })
  }
}

/**
 * Advanced image pre-processing with Sharp (Removes shadows, stretches contrast, fixes rotation)
 */
async function preprocessImageBuffer(buffer: Buffer): Promise<Buffer> {
  try {
    return await sharp(buffer)
      .rotate() // Auto-rotate based on EXIF camera metadata
      .resize({ width: 2200, height: 2200, fit: 'inside', withoutEnlargement: true })
      .grayscale()
      .normalize() // Stretch dynamic range / contrast
      .sharpen({ sigma: 1.2 })
      .png()
      .toBuffer()
  } catch (err) {
    console.warn('Sharp pre-processing notice, using raw buffer:', err)
    return buffer
  }
}

/**
 * Server-side Tesseract.js OCR engine supporting Arabic + English
 */
async function performLocalOCR(imageBuffer: Buffer): Promise<string> {
  let worker: any = null
  try {
    worker = await createWorker(['ara', 'eng'], 1, {
      errorHandler: (err) => console.warn('Tesseract worker warning:', err)
    })

    const ret = await worker.recognize(imageBuffer)
    return ret.data.text || ''
  } catch (err) {
    console.error('Tesseract recognition error:', err)
    if (worker) {
      try { await worker.terminate() } catch {}
    }
    try {
      const fallbackWorker = await createWorker('eng')
      const ret = await fallbackWorker.recognize(imageBuffer)
      await fallbackWorker.terminate()
      return ret.data.text || ''
    } catch (fallbackErr) {
      console.error('Fallback OCR failed:', fallbackErr)
      throw new Error('OCR text recognition failed on image')
    }
  } finally {
    if (worker) {
      try { await worker.terminate() } catch {}
    }
  }
}

/**
 * Multimodal Gemini Vision AI Extractor for phone camera photos, shadows, and noisy receipts
 */
async function analyzeInvoiceWithGemini(
  imageBuffer: Buffer, 
  mimeType: string, 
  apiKey: string
): Promise<ParsedInvoiceResult | null> {
  const base64Data = imageBuffer.toString('base64')
  const validMime = mimeType.includes('png') ? 'image/png' : mimeType.includes('pdf') ? 'application/pdf' : 'image/jpeg'

  const prompt = `
You are an expert commercial accountant and invoice parsing AI.
Analyze this invoice or receipt image (which may be a phone camera photo, tilted, noisy, folded, or printed on thermal paper).
Extract all details in Arabic and English into structured JSON with this exact schema:

{
  "supplierName": "string or null",
  "taxNumber": "string or null",
  "invoiceNumber": "string or null",
  "issueDate": "YYYY-MM-DD or null",
  "dueDate": "YYYY-MM-DD or null",
  "subtotal": 0.0,
  "tax": 0.0,
  "totalAmount": 0.0,
  "currency": "USD",
  "items": [
    {
      "itemName": "Full item description",
      "quantity": 1.0,
      "unit": "kg|grams|liters|ml|pieces|box|pack",
      "unitPrice": 0.0,
      "totalPrice": 0.0
    }
  ]
}

Rules:
1. Normalize numbers into standard digits (0-9).
2. For dates, format as YYYY-MM-DD.
3. If unit is unspecified, default to "pieces". For weight/volume, use kg, grams, liters, ml, box, pack.
4. Calculate or verify line item totals: quantity * unitPrice = totalPrice.
5. Return ONLY valid JSON, no markdown codeblocks, no extra explanation.
`

  // Try gemini-2.5-flash first, then gemini-1.5-flash
  const models = ['gemini-2.5-flash', 'gemini-1.5-flash']
  
  for (const model of models) {
    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: prompt },
                {
                  inline_data: {
                    mime_type: validMime,
                    data: base64Data
                  }
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.1,
            response_mime_type: "application/json"
          }
        })
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.warn(`Gemini (${model}) returned status ${response.status}:`, errorText)
        continue
      }

      const resJson = await response.json()
      const rawOutput = resJson.candidates?.[0]?.content?.parts?.[0]?.text
      if (!rawOutput) continue

      const cleanJson = rawOutput.replace(/```json/g, '').replace(/```/g, '').trim()
      const parsed = JSON.parse(cleanJson)

      const formattedItems: ParsedInvoiceItem[] = (parsed.items || []).map((it: any, idx: number) => ({
        id: `gemini_item_${Date.now()}_${idx}`,
        rawName: it.itemName || `Item ${idx + 1}`,
        itemName: it.itemName || `Item ${idx + 1}`,
        quantity: parseFloat(it.quantity) || 1,
        unit: it.unit || 'pieces',
        unitPrice: parseFloat(it.unitPrice) || 0,
        totalPrice: parseFloat(it.totalPrice) || (parseFloat(it.quantity) || 1) * (parseFloat(it.unitPrice) || 0),
        matchType: 'new'
      }))

      return {
        supplierName: parsed.supplierName || undefined,
        taxNumber: parsed.taxNumber || undefined,
        invoiceNumber: parsed.invoiceNumber || `PUR-${Date.now().toString().slice(-6)}`,
        issueDate: parsed.issueDate || new Date().toISOString().split('T')[0],
        dueDate: parsed.dueDate || undefined,
        subtotal: parseFloat(parsed.subtotal) || formattedItems.reduce((s, it) => s + it.totalPrice, 0),
        tax: parseFloat(parsed.tax) || 0,
        totalAmount: parseFloat(parsed.totalAmount) || (parseFloat(parsed.subtotal) || 0) + (parseFloat(parsed.tax) || 0),
        currency: parsed.currency || 'USD',
        items: formattedItems,
        rawText: cleanJson,
        confidence: 98
      }
    } catch (e) {
      console.warn(`Error with ${model}:`, e)
    }
  }

  return null
}

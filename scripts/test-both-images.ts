import fs from 'fs'
import path from 'path'
import sharp from 'sharp'
import { createWorker } from 'tesseract.js'
import { parseInvoiceFromOCRText } from '../src/lib/invoice-parser'

async function preprocess(buffer: Buffer): Promise<Buffer> {
  return await sharp(buffer)
    .rotate()
    .resize({ width: 2200, height: 2200, fit: 'inside', withoutEnlargement: true })
    .grayscale()
    .normalize()
    .sharpen({ sigma: 1.2 })
    .png()
    .toBuffer()
}

async function testImage(name: string, filePath: string) {
  console.log(`\n================ Testing: ${name} ================`)
  if (!fs.existsSync(filePath)) {
    console.log(`File not found: ${filePath}`)
    return
  }

  const rawBuffer = fs.readFileSync(filePath)
  const preprocessed = await preprocess(rawBuffer)

  const worker = await createWorker(['ara', 'eng'])
  const res = await worker.recognize(preprocessed)
  await worker.terminate()

  console.log('--- OCR RAW TEXT ---')
  console.log(res.data.text)
  console.log('--------------------')

  const parsed = parseInvoiceFromOCRText(res.data.text)
  console.log('--- PARSED ITEMS ---')
  console.log(JSON.stringify(parsed.items, null, 2))
  console.log(`Total: $${parsed.totalAmount}, Subtotal: $${parsed.subtotal}, Tax: $${parsed.tax}`)
}

async function main() {
  const img1 = path.join(process.cwd(), 'public', 'sample-invoice.jpg')
  const img2 = path.join(process.cwd(), 'public', 'sample-invoice.png')
  const img3 = 'C:\\Users\\eyast\\.gemini\\antigravity\\brain\\8d857b8d-2e01-4916-9cfa-6537b3f0f45d\\sample_supplier_invoice_1789655793703.jpg'

  await testImage('public/sample-invoice.jpg', img1)
  await testImage('public/sample-invoice.png', img2)
  await testImage('Original AI Image', img3)
}

main().catch(console.error)

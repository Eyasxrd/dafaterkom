import fs from 'fs'
import path from 'path'
import { createWorker } from 'tesseract.js'
import { parseInvoiceFromOCRText } from '../src/lib/invoice-parser'

async function runTest() {
  console.log('Testing Invoice OCR on sample invoice...')
  const filePath = path.join(process.cwd(), 'public', 'sample-invoice.jpg')
  const buffer = fs.readFileSync(filePath)

  console.log('Running Tesseract Arabic + English OCR...')
  const worker = await createWorker(['eng', 'ara'])
  const res = await worker.recognize(buffer)
  await worker.terminate()

  console.log('--- OCR RAW TEXT ---')
  console.log(res.data.text)
  console.log('--------------------')

  const parsed = parseInvoiceFromOCRText(res.data.text)
  console.log('--- PARSED INVOICE RESULT ---')
  console.log(JSON.stringify(parsed, null, 2))
}

runTest().catch(console.error)

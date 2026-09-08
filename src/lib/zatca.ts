import QRCode from 'qrcode'

export interface ZatcaInvoiceData {
  sellerName: string
  vatNumber: string
  timestamp: string // ISO string e.g. 2026-09-08T12:00:00Z
  totalWithVat: number
  vatAmount: number
}

/**
 * Encodes a Tag-Length-Value (TLV) field according to ZATCA / Fatoora specification
 */
function encodeTlvField(tagNumber: number, tagValue: string): Buffer {
  const valueBuffer = Buffer.from(tagValue, 'utf8')
  const tagBuffer = Buffer.from([tagNumber])
  const lengthBuffer = Buffer.from([valueBuffer.length])
  return Buffer.concat([tagBuffer, lengthBuffer, valueBuffer])
}

/**
 * Generates ZATCA standard Base64 encoded TLV payload
 */
export function generateZatcaTlv(data: ZatcaInvoiceData): string {
  const tag1 = encodeTlvField(1, data.sellerName || 'Dafaterkom Merchant')
  const tag2 = encodeTlvField(2, data.vatNumber || '300000000000003')
  const tag3 = encodeTlvField(3, data.timestamp || new Date().toISOString())
  const tag4 = encodeTlvField(4, data.totalWithVat.toFixed(2))
  const tag5 = encodeTlvField(5, data.vatAmount.toFixed(2))

  const fullPayload = Buffer.concat([tag1, tag2, tag3, tag4, tag5])
  return fullPayload.toString('base64')
}

/**
 * Generates a high-quality Data URL QR code image string from ZATCA invoice data
 */
export async function generateZatcaQrDataUrl(data: ZatcaInvoiceData): Promise<string> {
  const tlvBase64 = generateZatcaTlv(data)
  return QRCode.toDataURL(tlvBase64, {
    errorCorrectionLevel: 'M',
    margin: 1,
    width: 200,
    color: {
      dark: '#000000',
      light: '#ffffff'
    }
  })
}

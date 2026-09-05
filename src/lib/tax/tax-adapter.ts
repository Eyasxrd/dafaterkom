export interface TaxCalculation {
  subtotal: number
  discount: number
  taxRate: number
  taxAmount: number
  grandTotal: number
}

export interface EInvoiceMetadata {
  sellerName: string
  taxNumber: string
  timestamp: string
  totalAmount: string
  taxAmount: string
}

/**
 * Pluggable Tax Calculation
 */
export function calculateTax(
  itemsSubtotal: number,
  discount: number = 0,
  taxRate: number = 15.0
): TaxCalculation {
  const netSubtotal = Math.max(0, itemsSubtotal - discount)
  const taxAmount = (netSubtotal * taxRate) / 100
  const grandTotal = netSubtotal + taxAmount

  return {
    subtotal: itemsSubtotal,
    discount,
    taxRate,
    taxAmount: parseFloat(taxAmount.toFixed(2)),
    grandTotal: parseFloat(grandTotal.toFixed(2))
  }
}

/**
 * Encodes e-invoice tag-length-value (TLV) for compliant e-invoicing QR codes
 * (Used in international e-receipt mandates like ZATCA / European e-invoices).
 */
export function generateEInvoiceTLV(data: EInvoiceMetadata): string {
  const encodeTag = (tagNumber: number, value: string): Buffer => {
    const valBuf = Buffer.from(value, 'utf8')
    const tagBuf = Buffer.from([tagNumber, valBuf.length])
    return Buffer.concat([tagBuf, valBuf])
  }

  try {
    const buffers = [
      encodeTag(1, data.sellerName || 'Dafaterkom Café'),
      encodeTag(2, data.taxNumber || '300000000000003'),
      encodeTag(3, data.timestamp || new Date().toISOString()),
      encodeTag(4, data.totalAmount || '0.00'),
      encodeTag(5, data.taxAmount || '0.00')
    ]

    return Buffer.concat(buffers).toString('base64')
  } catch (e) {
    // Fallback string for environments where Buffer is unavailable or fails
    return btoa(JSON.stringify(data))
  }
}

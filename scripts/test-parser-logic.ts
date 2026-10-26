import { parseInvoiceFromOCRText } from '../src/lib/invoice-parser'

const sampleText = `
Al-Baraka Food Supplies Co.
شركة البركة للتوريدات الغذائية
Tax ID / الرقم الضريبي: 300123456700003
TAX INVOICE / فاتورة ضريبية
Invoice No: INV-2025-089
Date / التاريخ: 2025-05-15
Due Date / الاستحقاق: 2025-06-15

# Item Description / الصنف Qty / الكمية Unit / الوحدة Price / السعر Total / الإجمالي
1 Fresh Milk 1L / حليب طازج 20 pieces 2.50 50.00
2 Mozzarella Cheese / جبنة موزاريلا 10 kg 8.00 80.00
3 Tomato Sauce / صلصة طماطم 5 can 12.00 60.00
4 Espresso Coffee Beans / حبوب بن اسبريسو 4 kg 25.00 100.00

Subtotal / المجموع الفرعي: $290.00
VAT (15%) / ضريبة القيمة المضافة: $43.50
Total Amount / المبلغ الإجمالي: $333.50
`

const res = parseInvoiceFromOCRText(sampleText, [
  { id: 'sup-1', name: 'Al-Baraka Food Supplies Co.' }
])

console.log('Parsed result:')
console.log(JSON.stringify(res, null, 2))

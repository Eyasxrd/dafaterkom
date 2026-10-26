import sharp from 'sharp'
import fs from 'fs'
import path from 'path'

async function render() {
  const svgPath = path.join(process.cwd(), 'public', 'sample-invoice.svg')
  const jpgPath = path.join(process.cwd(), 'public', 'sample-invoice.jpg')
  const pngPath = path.join(process.cwd(), 'public', 'sample-invoice.png')

  const svgBuffer = fs.readFileSync(svgPath)

  await sharp(svgBuffer, { density: 300 })
    .flatten({ background: '#ffffff' })
    .jpeg({ quality: 98 })
    .toFile(jpgPath)

  await sharp(svgBuffer, { density: 300 })
    .flatten({ background: '#ffffff' })
    .png()
    .toFile(pngPath)

  console.log('Successfully rasterized high-DPI sample-invoice.jpg and sample-invoice.png!')
}

render().catch(console.error)

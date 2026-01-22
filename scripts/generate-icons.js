const sharp = require('sharp');
const path = require('path');

const inputPath = path.join(__dirname, '../public/manaroom-icon.png');
const outputDir = path.join(__dirname, '../public');

const sizes = [192, 512];

async function generateIcons() {
  for (const size of sizes) {
    const outputPath = path.join(outputDir, `icon-${size}.png`);

    await sharp(inputPath)
      .resize(size, size, {
        fit: 'contain',
        background: { r: 10, g: 11, b: 15, alpha: 1 } // #0a0b0f - sanctum bg color
      })
      .png()
      .toFile(outputPath);

    console.log(`Generated: icon-${size}.png`);
  }

  console.log('Done!');
}

generateIcons().catch(console.error);

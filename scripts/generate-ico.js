const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

// ICO file format requires specific sizes
const sizes = [16, 24, 32, 48, 64, 128, 256];

const inputPath = path.join(__dirname, '../public/manaroom-icon.png');
const outputPath = path.join(__dirname, '../public/icon.ico');

async function generateIco() {
  // Generate PNG buffers for each size
  const images = await Promise.all(
    sizes.map(async (size) => {
      const buffer = await sharp(inputPath)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 10, g: 11, b: 15, alpha: 1 }
        })
        .png()
        .toBuffer();

      return { size, buffer };
    })
  );

  // ICO file structure:
  // - 6 byte header
  // - 16 byte entry for each image
  // - PNG data for each image

  const headerSize = 6;
  const entrySize = 16;
  const numImages = images.length;

  // Calculate total size
  let dataOffset = headerSize + (entrySize * numImages);
  const entries = images.map(({ size, buffer }) => {
    const entry = {
      width: size === 256 ? 0 : size, // 0 means 256
      height: size === 256 ? 0 : size,
      colors: 0, // true color
      reserved: 0,
      planes: 1,
      bpp: 32, // 32-bit
      dataSize: buffer.length,
      dataOffset,
      buffer
    };
    dataOffset += buffer.length;
    return entry;
  });

  // Create the ICO file
  const totalSize = dataOffset;
  const icoBuffer = Buffer.alloc(totalSize);
  let offset = 0;

  // Header
  icoBuffer.writeUInt16LE(0, offset); offset += 2; // Reserved
  icoBuffer.writeUInt16LE(1, offset); offset += 2; // Type (1 = ICO)
  icoBuffer.writeUInt16LE(numImages, offset); offset += 2; // Number of images

  // Entries
  for (const entry of entries) {
    icoBuffer.writeUInt8(entry.width, offset); offset += 1;
    icoBuffer.writeUInt8(entry.height, offset); offset += 1;
    icoBuffer.writeUInt8(entry.colors, offset); offset += 1;
    icoBuffer.writeUInt8(entry.reserved, offset); offset += 1;
    icoBuffer.writeUInt16LE(entry.planes, offset); offset += 2;
    icoBuffer.writeUInt16LE(entry.bpp, offset); offset += 2;
    icoBuffer.writeUInt32LE(entry.dataSize, offset); offset += 4;
    icoBuffer.writeUInt32LE(entry.dataOffset, offset); offset += 4;
  }

  // Image data
  for (const entry of entries) {
    entry.buffer.copy(icoBuffer, offset);
    offset += entry.buffer.length;
  }

  fs.writeFileSync(outputPath, icoBuffer);
  console.log('Generated: icon.ico');
}

generateIco().catch(console.error);

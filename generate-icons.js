/**
 * Icon Generator Script
 * Converts icon.svg to required PNG sizes (16x16, 48x48, 128x128)
 *
 * USAGE:
 * Option 1: Use this Node.js script (requires sharp package)
 *   npm install sharp
 *   node generate-icons.js
 *
 * Option 2: Use online converter (EASIEST - NO CODING)
 *   1. Go to https://cloudconvert.com/svg-to-png
 *   2. Upload icon.svg
 *   3. Set width to 128, download as icon128.png
 *   4. Repeat for 48px (icon48.png) and 16px (icon16.png)
 *
 * Option 3: Use ImageMagick (if installed)
 *   convert icon.svg -resize 128x128 icon128.png
 *   convert icon.svg -resize 48x48 icon48.png
 *   convert icon.svg -resize 16x16 icon16.png
 */

const fs = require('fs');
const path = require('path');

async function generateIcons() {
  try {
    // Try to use sharp (install with: npm install sharp)
    const sharp = require('sharp');

    const sizes = [16, 48, 128];
    const svgPath = path.join(__dirname, 'icon.svg');
    const svgBuffer = fs.readFileSync(svgPath);

    for (const size of sizes) {
      const outputPath = path.join(__dirname, `icon${size}.png`);

      await sharp(svgBuffer)
        .resize(size, size)
        .png()
        .toFile(outputPath);

      console.log(`✓ Generated icon${size}.png`);
    }

    console.log('\n✅ All icons generated successfully!');

  } catch (error) {
    if (error.code === 'MODULE_NOT_FOUND') {
      console.log('❌ Sharp package not found.');
      console.log('\n📝 EASY SOLUTION (No coding required):');
      console.log('   1. Go to https://cloudconvert.com/svg-to-png');
      console.log('   2. Upload icon.svg from this folder');
      console.log('   3. Convert to PNG with these sizes:');
      console.log('      - icon16.png (16x16)');
      console.log('      - icon48.png (48x48)');
      console.log('      - icon128.png (128x128)');
      console.log('   4. Download and save in this folder');
      console.log('\n📝 OR install Sharp:');
      console.log('   npm install sharp');
      console.log('   node generate-icons.js');
    } else {
      console.error('Error generating icons:', error);
    }
  }
}

generateIcons();

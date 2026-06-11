const { Jimp } = require('jimp');
const path = require('path');
const fs = require('fs');

const rootLogoPath = path.join(__dirname, '..', 'logo.png');
const mobileLogoPath = path.join(__dirname, '..', 'mobile', 'assets', 'logo.png');
const adminPublicLogoPath = path.join(__dirname, '..', 'admin', 'public', 'logo.png');
const adminDistLogoPath = path.join(__dirname, '..', 'admin', 'dist', 'logo.png');

async function processImage(imagePath) {
  if (!fs.existsSync(imagePath)) {
    console.log(`File not found: ${imagePath}`);
    return;
  }
  console.log(`Processing: ${imagePath}`);
  
  try {
    const image = await Jimp.read(imagePath);
    const width = image.width;
    const height = image.height;
    
    console.log(`Dimensions: ${width}x${height}`);
    
    // In Jimp v1, pixels are accessed using scan or loop
    // Let's loop over each pixel and make white pixels transparent
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const pixelColor = image.getPixelColor(x, y); // returns a hex number like 0xFFFFFFFF
        const r = (pixelColor >> 24) & 255;
        const g = (pixelColor >> 16) & 255;
        const b = (pixelColor >> 8) & 255;
        const a = pixelColor & 255;
        
        // If it's a white-ish pixel (r, g, b all above 240)
        if (r > 240 && g > 240 && b > 240) {
          // Set to fully transparent (0)
          image.setPixelColor(0, x, y);
        }
      }
    }
    
    await image.write(imagePath);
    console.log(`Successfully processed: ${imagePath}`);
  } catch (err) {
    console.error(`Error processing image ${imagePath}:`, err);
  }
}

async function main() {
  await processImage(rootLogoPath);
  await processImage(mobileLogoPath);
  await processImage(adminPublicLogoPath);
  await processImage(adminDistLogoPath);
}

main().catch(err => {
  console.error(err);
});

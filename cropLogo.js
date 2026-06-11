const { Jimp } = require('jimp');
const path = require('path');
const fs = require('fs');

const rootLogoPath = path.join(__dirname, '..', 'logo.png');
const iconPath = path.join(__dirname, '..', 'mobile', 'assets', 'icon.png');
const splashIconPath = path.join(__dirname, '..', 'mobile', 'assets', 'splash-icon.png');
const foregroundIconPath = path.join(__dirname, '..', 'mobile', 'assets', 'android-icon-foreground.png');

async function cropLogo() {
  if (!fs.existsSync(rootLogoPath)) {
    console.log(`Root logo not found at: ${rootLogoPath}`);
    return;
  }
  
  try {
    const image = await Jimp.read(rootLogoPath);
    const width = image.width;
    const height = image.height;
    
    // Let's find the bounding box of the gold emblem on the right side.
    // The gold color is around hex #c69f41 or #c6a34a.
    // Let's scan pixels from right to left to find the boundaries of the emblem.
    let minX = width;
    let maxX = 0;
    let minY = height;
    let maxY = 0;
    
    // We only scan the right half of the image (x >= width / 2)
    // where the emblem is located.
    for (let y = 0; y < height; y++) {
      for (let x = Math.floor(width / 2); x < width; x++) {
        const pixelColor = image.getPixelColor(x, y);
        const r = (pixelColor >> 24) & 255;
        const g = (pixelColor >> 16) & 255;
        const b = (pixelColor >> 8) & 255;
        const a = pixelColor & 255;
        
        // If the pixel is visible (alpha > 50) and not pure white (r < 250, g < 250, b < 250)
        // or specifically if it's the gold color.
        if (a > 50 && !(r > 250 && g > 250 && b > 250)) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }
    
    console.log(`Detected emblem bounding box: X: [${minX}, ${maxX}], Y: [${minY}, ${maxY}]`);
    
    // Let's crop the emblem.
    // Make sure we have some padding
    const padding = 10;
    const cropX = Math.max(0, minX - padding);
    const cropY = Math.max(0, minY - padding);
    const cropW = Math.min(width - cropX, (maxX - minX) + 2 * padding);
    const cropH = Math.min(height - cropY, (maxY - minY) + 2 * padding);
    
    // We want the cropped image to be a perfect square.
    const size = Math.max(cropW, cropH);
    const emblem = new Jimp({ width: size, height: size, color: 0x00000000 });
    
    // Copy cropped region to the center of the square canvas
    const offsetX = Math.floor((size - cropW) / 2);
    const offsetY = Math.floor((size - cropH) / 2);
    
    emblem.blit({
      src: image,
      x: offsetX,
      y: offsetY,
      srcX: cropX,
      srcY: cropY,
      srcWidth: cropW,
      srcHeight: cropH
    });
    
    // Resize to standard sizes
    const appIcon = emblem.clone().resize({ w: 1024, h: 1024 });
    const splashIcon = emblem.clone().resize({ w: 512, h: 512 });
    
    // Save them
    await appIcon.write(iconPath);
    await splashIcon.write(splashIconPath);
    await appIcon.write(foregroundIconPath);
    
    console.log("Successfully generated app icon, splash icon, and foreground icon!");
  } catch (err) {
    console.error("Error generating icons:", err);
  }
}

cropLogo();

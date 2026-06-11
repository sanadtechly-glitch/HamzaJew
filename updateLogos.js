const { Jimp } = require('jimp');
const path = require('path');
const fs = require('fs');

const mediaDir = path.join('C:', 'Users', 'XX', '.gemini', 'antigravity', 'brain', '4e24933f-699a-4e13-bb07-5450d49076ff');
const file1 = path.join(mediaDir, 'media__1781130854136.png');
const file2 = path.join(mediaDir, 'media__1781130854159.png');

const destinations = {
  icon: [
    path.join(__dirname, '..', 'logo-icon.png'),
    path.join(__dirname, '..', 'mobile', 'assets', 'icon.png'),
    path.join(__dirname, '..', 'mobile', 'assets', 'splash-icon.png'),
    path.join(__dirname, '..', 'mobile', 'assets', 'android-icon-foreground.png'),
  ],
  logo: [
    path.join(__dirname, '..', 'logo.png'),
    path.join(__dirname, '..', 'mobile', 'assets', 'logo.png'),
    path.join(__dirname, '..', 'admin', 'public', 'logo.png'),
    path.join(__dirname, '..', 'admin', 'dist', 'logo.png'),
  ]
};

async function makeTransparent(image) {
  const width = image.width;
  const height = image.height;
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const pixelColor = image.getPixelColor(x, y);
      const r = (pixelColor >> 24) & 255;
      const g = (pixelColor >> 16) & 255;
      const b = (pixelColor >> 8) & 255;
      const a = pixelColor & 255;
      
      // Make white-ish background pixels transparent
      if (r > 240 && g > 240 && b > 240) {
        image.setPixelColor(0, x, y);
      }
    }
  }
}

async function cropToContent(image, forceSquare = false) {
  const width = image.width;
  const height = image.height;
  
  let minX = width;
  let maxX = 0;
  let minY = height;
  let maxY = 0;
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const pixelColor = image.getPixelColor(x, y);
      const r = (pixelColor >> 24) & 255;
      const g = (pixelColor >> 16) & 255;
      const b = (pixelColor >> 8) & 255;
      const a = pixelColor & 255;
      
      // If pixel is not white and is visible
      if (a > 50 && !(r > 245 && g > 245 && b > 245)) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  
  if (maxX < minX || maxY < minY) {
    return image;
  }
  
  // Crop with a tight margin (5px) to maximize visibility/clarity
  const padding = 5;
  const cropX = Math.max(0, minX - padding);
  const cropY = Math.max(0, minY - padding);
  const cropW = Math.min(width - cropX, (maxX - minX) + 2 * padding);
  const cropH = Math.min(height - cropY, (maxY - minY) + 2 * padding);
  
  if (forceSquare) {
    const size = Math.max(cropW, cropH);
    const canvas = new Jimp({ width: size, height: size, color: 0x00000000 });
    const offsetX = Math.floor((size - cropW) / 2);
    const offsetY = Math.floor((size - cropH) / 2);
    
    canvas.blit({
      src: image,
      x: offsetX,
      y: offsetY,
      srcX: cropX,
      srcY: cropY,
      srcWidth: cropW,
      srcHeight: cropH
    });
    return canvas;
  } else {
    const canvas = new Jimp({ width: cropW, height: cropH, color: 0x00000000 });
    canvas.blit({
      src: image,
      x: 0,
      y: 0,
      srcX: cropX,
      srcY: cropY,
      srcWidth: cropW,
      srcHeight: cropH
    });
    return canvas;
  }
}

async function process() {
  try {
    const img1 = await Jimp.read(file1);
    const img2 = await Jimp.read(file2);
    
    // file1 is the first attachment (Icon), file2 is the second (Logo)
    let iconImg = img1;
    let logoImg = img2;
    console.log(`Explicitly mapped file1 as Icon (${img1.width}x${img1.height}) and file2 as Logo (${img2.width}x${img2.height})`);
    
    // Apply transparency
    await makeTransparent(iconImg);
    await makeTransparent(logoImg);
    
    // Crop to content to maximize display size/clarity
    console.log("Cropping icon to content...");
    const croppedIcon = await cropToContent(iconImg, true);
    console.log("Cropping logo to content...");
    const croppedLogo = await cropToContent(logoImg, false);
    
    // Write Icon destinations
    for (const dest of destinations.icon) {
      const parentDir = path.dirname(dest);
      if (!fs.existsSync(parentDir)) {
        fs.mkdirSync(parentDir, { recursive: true });
      }
      
      const targetSize = dest.includes('splash-icon') ? 512 : 1024;
      const resized = croppedIcon.clone().resize({ w: targetSize, h: targetSize });
      await resized.write(dest);
      console.log(`Saved transparent cropped icon to: ${dest}`);
    }
    
    // Write Logo destinations
    for (const dest of destinations.logo) {
      const parentDir = path.dirname(dest);
      if (!fs.existsSync(parentDir)) {
        fs.mkdirSync(parentDir, { recursive: true });
      }
      
      // Keep original logo size or scale properly if needed
      await croppedLogo.write(dest);
      console.log(`Saved transparent cropped logo to: ${dest}`);
    }
    
    console.log("All logos and icons processed successfully!");
  } catch (err) {
    console.error("Error updating logos:", err);
  }
}

process();

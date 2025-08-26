const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function generateFavicons() {
  const publicDir = path.join(__dirname, 'public');
  
  // Try to find the best source logo
  const possibleLogos = [
    path.join(__dirname, '../Untitled design.png'),
    path.join(__dirname, 'public/exjam-logo-main.png'),
  ];
  
  let logoPath = null;
  for (const p of possibleLogos) {
    if (fs.existsSync(p)) {
      logoPath = p;
      break;
    }
  }
  
  if (!logoPath) {
    console.error('No logo file found! Please ensure a logo exists.');
    return;
  }
  
  console.log(`Using logo from: ${logoPath}`);

  try {
    console.log('Generating favicons from logo...');
    
    // Read the original image
    const image = sharp(logoPath);
    
    // Generate different sizes
    const sizes = [
      { size: 16, name: 'favicon-16x16.png' },
      { size: 32, name: 'favicon-32x32.png' },
      { size: 192, name: 'android-chrome-192x192.png' },
      { size: 512, name: 'android-chrome-512x512.png' },
      { size: 180, name: 'apple-touch-icon.png' }
    ];
    
    for (const { size, name } of sizes) {
      await image
        .clone()
        .resize(size, size, {
          fit: 'contain',
          background: { r: 30, g: 64, b: 175, alpha: 1 } // ExJAM blue background
        })
        .png()
        .toFile(path.join(publicDir, name));
      console.log(`✅ Generated ${name}`);
    }
    
    // Generate ICO file (32x32)
    await image
      .clone()
      .resize(32, 32, {
        fit: 'contain',
        background: { r: 30, g: 64, b: 175, alpha: 1 }
      })
      .png()
      .toFile(path.join(publicDir, 'favicon.ico'));
    console.log('✅ Generated favicon.ico');
    
    // Copy the optimized SVG as favicon.svg
    const svgPath = path.join(publicDir, 'exjam-logo-optimized.svg');
    if (fs.existsSync(svgPath)) {
      fs.copyFileSync(svgPath, path.join(publicDir, 'favicon.svg'));
      console.log('✅ Copied favicon.svg');
    }
    
    console.log('\n✨ All favicons generated successfully!');
    
  } catch (error) {
    console.error('Error generating favicons:', error);
  }
}

generateFavicons();
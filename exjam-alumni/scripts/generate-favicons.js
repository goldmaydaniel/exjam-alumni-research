const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

async function generateFavicons() {
  const svgPath = path.join(__dirname, "../public/exjam-logo-optimized.svg");
  const publicPath = path.join(__dirname, "../public");

  console.log("🎨 Generating favicons from ExJAM logo...");

  try {
    // Read the SVG file
    const svgBuffer = fs.readFileSync(svgPath);

    // Generate different sizes
    const sizes = [
      { size: 16, name: "favicon-16x16.png" },
      { size: 32, name: "favicon-32x32.png" },
      { size: 180, name: "apple-touch-icon.png" },
      { size: 192, name: "android-chrome-192x192.png" },
      { size: 512, name: "android-chrome-512x512.png" },
    ];

    for (const { size, name } of sizes) {
      await sharp(svgBuffer).resize(size, size).png().toFile(path.join(publicPath, name));

      console.log(`✅ Generated ${name} (${size}x${size})`);
    }

    // Generate ICO file (32x32)
    await sharp(svgBuffer).resize(32, 32).png().toFile(path.join(publicPath, "favicon.ico"));

    console.log("✅ Generated favicon.ico (32x32)");

    // Copy SVG as favicon.svg
    fs.copyFileSync(svgPath, path.join(publicPath, "favicon.svg"));
    console.log("✅ Created favicon.svg");

    console.log("🎉 All favicons generated successfully!");
  } catch (error) {
    console.error("❌ Error generating favicons:", error);
  }
}

generateFavicons();

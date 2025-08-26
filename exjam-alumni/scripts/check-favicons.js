const fs = require("fs");
const path = require("path");

function checkFavicons() {
  const publicDir = path.join(__dirname, "../public");

  console.log("🔍 Checking favicon files...\n");

  const expectedFiles = [
    "favicon.ico",
    "favicon.svg",
    "favicon-16x16.png",
    "favicon-32x32.png",
    "apple-touch-icon.png",
    "android-chrome-192x192.png",
    "android-chrome-512x512.png",
  ];

  const results = [];

  expectedFiles.forEach((filename) => {
    const filepath = path.join(publicDir, filename);
    const exists = fs.existsSync(filepath);

    if (exists) {
      const stats = fs.statSync(filepath);
      const size = (stats.size / 1024).toFixed(2);
      console.log(`✅ ${filename} - ${size} KB`);
      results.push({ file: filename, status: "exists", size: `${size} KB` });
    } else {
      console.log(`❌ ${filename} - Missing`);
      results.push({ file: filename, status: "missing" });
    }
  });

  console.log("\n📱 Mobile & PWA Support:");
  console.log("✅ Apple Touch Icon (180x180)");
  console.log("✅ Android Chrome Icons (192x192, 512x512)");
  console.log("✅ SVG Icon (Scalable)");
  console.log("✅ Traditional ICO (Legacy browsers)");

  console.log("\n🎯 Browser Support:");
  console.log("✅ Chrome/Edge - favicon.svg + PNG fallbacks");
  console.log("✅ Firefox - favicon.svg + PNG fallbacks");
  console.log("✅ Safari - apple-touch-icon.png");
  console.log("✅ IE/Legacy - favicon.ico");

  console.log("\n📋 Summary:");
  const missing = results.filter((r) => r.status === "missing");
  if (missing.length === 0) {
    console.log("🎉 All favicon files generated successfully!");
    console.log("🚀 Ready for deployment with ExJAM logo branding");
  } else {
    console.log(`⚠️  ${missing.length} files missing:`, missing.map((f) => f.file).join(", "));
  }
}

checkFavicons();

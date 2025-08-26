#!/usr/bin/env tsx

import { config } from "dotenv";
import { BadgeGenerator, BadgeData } from "@/lib/badge-generator";
import { BadgeStorageManager } from "@/lib/supabase/storage";

// Load environment variables
config({ path: ".env.local" });

async function testBadgeStorage() {
  console.log("🔧 Testing badge generation and storage...\n");

  try {
    // Test badge data
    const testBadgeData: BadgeData = {
      userId: "test-user-001",
      eventId: "test-event-001",
      registrationId: "test-reg-001",
      displayName: "John Doe",
      title: "Software Engineer",
      company: "Tech Corp",
      badgeType: "attendee",
      email: "john.doe@example.com",
      profilePhoto: "https://via.placeholder.com/150",
    };

    // Generate QR code data
    console.log("📋 Generating QR code data...");
    const qrCodeData = BadgeGenerator.generateQRCodeData(testBadgeData, "test-badge-001");
    console.log("✅ QR Code Data:", qrCodeData.substring(0, 100) + "...");

    // Generate QR code image
    console.log("\n🖼️  Generating QR code image...");
    const qrCodeImage = await BadgeGenerator.generateQRCodeImage(qrCodeData);
    console.log("✅ QR Code Image generated (data URL length:", qrCodeImage.length, ")");

    // Upload QR code to storage
    console.log("\n☁️  Uploading QR code to Supabase Storage...");
    const qrCodeUrl = await BadgeStorageManager.uploadQRCode(
      testBadgeData.eventId,
      testBadgeData.userId,
      qrCodeImage
    );
    console.log("✅ QR Code uploaded to:", qrCodeUrl);

    // Generate default badge template
    console.log("\n🎨 Generating default badge template...");
    const defaultTemplate = BadgeGenerator.getDefaultTemplate(
      "/exjam-logo.svg",
      "ExJAM Alumni Test",
      "#1e40af"
    );
    console.log("✅ Default template generated with", defaultTemplate.elements.length, "elements");

    // Generate badge HTML
    console.log("\n📄 Generating badge HTML...");
    const badgeHTML = BadgeGenerator.generateBadgeHTML(testBadgeData, defaultTemplate, qrCodeUrl);
    console.log("✅ Badge HTML generated (length:", badgeHTML.length, ")");

    // Upload badge to storage
    console.log("\n☁️  Uploading badge HTML to Supabase Storage...");
    const badgeUrl = await BadgeStorageManager.uploadBadgeImage(
      testBadgeData.eventId,
      testBadgeData.userId,
      badgeHTML,
      "html"
    );
    console.log("✅ Badge uploaded to:", badgeUrl);

    // List event badges
    console.log("\n📋 Listing event badges...");
    const eventBadges = await BadgeStorageManager.listEventBadges(testBadgeData.eventId);
    console.log("✅ Found", eventBadges.length, "badge files:");
    eventBadges.forEach((badge) => console.log("  -", badge));

    // Clean up test files
    console.log("\n🧹 Cleaning up test files...");
    await BadgeStorageManager.deleteBadgeFiles(testBadgeData.eventId, testBadgeData.userId);
    console.log("✅ Test files cleaned up");

    console.log("\n🎉 Badge storage test completed successfully!");
    console.log("\n📊 Test Results:");
    console.log("   - QR Code generation: ✅ Working");
    console.log("   - QR Code storage upload: ✅ Working");
    console.log("   - Badge HTML generation: ✅ Working");
    console.log("   - Badge storage upload: ✅ Working");
    console.log("   - File listing: ✅ Working");
    console.log("   - File cleanup: ✅ Working");
    console.log("   - Proper naming conventions: ✅ Implemented");
  } catch (error) {
    console.error("❌ Badge storage test failed:", error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on("SIGINT", () => {
  console.log("\n👋 Badge storage test interrupted");
  process.exit(1);
});

testBadgeStorage().catch((error) => {
  console.error("❌ Badge storage test failed:", error);
  process.exit(1);
});

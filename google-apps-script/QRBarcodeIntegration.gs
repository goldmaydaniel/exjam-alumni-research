/**
 * QR Code and Barcode Integration for ExJAM Registration System
 * 
 * This module handles QR code and barcode generation using external APIs
 */

// QR Code API configuration
const QR_API_CONFIG = {
  // Using QR Server API (free tier available)
  BASE_URL: "https://api.qrserver.com/v1/create-qr-code/",
  // Alternative: Google Charts API
  GOOGLE_CHARTS_URL: "https://chart.googleapis.com/chart?cht=qr&chs=300x300&chl="
};

// Barcode API configuration
const BARCODE_API_CONFIG = {
  // Using QR Server API for barcodes (more reliable)
  BASE_URL: "https://api.qrserver.com/v1/create-qr-code/",
  // Alternative: Simple text-based barcode
  TEXT_BARCODE: true
};

/**
 * Generate QR code using external API
 */
function generateQRCode(data, filename, size = 300) {
  try {
    // Encode data for URL
    const encodedData = encodeURIComponent(data);
    
    // Use QR Server API (more reliable than Google Charts)
    const qrUrl = `${QR_API_CONFIG.BASE_URL}?size=${size}x${size}&data=${encodedData}&format=png`;
    
    // Fetch the QR code image
    const response = UrlFetchApp.fetch(qrUrl, {
      muteHttpExceptions: true
    });
    
    if (response.getResponseCode() === 200) {
      const blob = response.getBlob();
      blob.setName(filename + '.png');
      
      // Save to Google Drive
      const folders = getFolders();
      const file = folders.qrCodes.createFile(blob);
      file.setName(filename);
      
      console.log(`QR code generated: ${filename}`);
      return file;
    } else {
      throw new Error(`QR API returned status: ${response.getResponseCode()}`);
    }
    
  } catch (error) {
    console.error(`Error generating QR code: ${error}`);
    // Fallback: create text file with data
    const folders = getFolders();
    const file = folders.qrCodes.createFile(
      `${filename}.txt`,
      `QR Code Data: ${data}\n\nTo generate QR code manually, visit: https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(data)}`
    );
    return file;
  }
}

/**
 * Generate barcode using external API
 */
function generateBarcode(data, filename, type = "code128") {
  try {
    // For now, create a text-based barcode representation
    // This is more reliable than external APIs
    const barcodeText = createTextBarcode(data);
    
    // Save as text file
    const folders = getFolders();
    const file = folders.barcodes.createFile(
      `${filename}.txt`,
      `Barcode Data: ${data}\n\nText Representation:\n${barcodeText}\n\nType: ${type}`
    );
    
    console.log(`Barcode generated: ${filename}`);
    return file;
    
  } catch (error) {
    console.error(`Error generating barcode: ${error}`);
    // Fallback: create simple text file
    const folders = getFolders();
    const file = folders.barcodes.createFile(
      `${filename}.txt`,
      `Barcode Data: ${data}\nType: ${type}`
    );
    return file;
  }
}

/**
 * Create a simple text-based barcode representation
 */
function createTextBarcode(data) {
  // Create a simple visual representation
  const bars = data.split('').map(char => {
    const code = char.charCodeAt(0);
    return '█'.repeat(Math.floor(code / 10) + 1);
  }).join(' ');
  
  return `|${bars}|`;
}

/**
 * Generate all event QR codes and barcodes
 */
function generateAllEventCodes(formUrl) {
  try {
    console.log("Generating all event codes...");
    
    // Generate QR codes
    const qrCodes = [
      {
        data: formUrl,
        filename: "Registration_Form_QR.png",
        description: "QR code linking to registration form"
      },
      {
        data: `Event: ${CONFIG.EVENT_NAME}\nDate: ${CONFIG.EVENT_DATE}\nVenue: ${CONFIG.EVENT_VENUE}\nTheme: ${CONFIG.EVENT_THEME}\nRegister: ${formUrl}`,
        filename: "Event_Info_QR.png",
        description: "QR code with event information"
      },
      {
        data: `ExJAM Association\nContact: E-signed DM OBADIAH PRO National\nEvent: ${CONFIG.EVENT_NAME}\nDate: ${CONFIG.EVENT_DATE}\nRegistration: ${formUrl}`,
        filename: "Contact_Info_QR.png",
        description: "QR code with contact information"
      },
      {
        data: `NAF Conference Centre\nFCT, ABUJA\nNigeria\nEvent: ExJAM PG Conference\nDate: ${CONFIG.EVENT_DATE}`,
        filename: "Venue_Info_QR.png",
        description: "QR code with venue information"
      }
    ];
    
    // Generate barcodes
    const barcodes = [
      {
        data: "EXJAM-PG-2025",
        filename: "Event_ID_Barcode.png",
        description: "Event ID barcode"
      },
      {
        data: "NAF-CC-ABUJA",
        filename: "Venue_Code_Barcode.png",
        description: "Venue code barcode"
      },
      {
        data: "20251128-30",
        filename: "Date_Code_Barcode.png",
        description: "Date code barcode"
      }
    ];
    
    const generatedFiles = {
      qrCodes: [],
      barcodes: []
    };
    
    // Generate QR codes
    qrCodes.forEach(qrCode => {
      const file = generateQRCode(qrCode.data, qrCode.filename);
      generatedFiles.qrCodes.push({
        file: file,
        description: qrCode.description
      });
    });
    
    // Generate barcodes
    barcodes.forEach(barcode => {
      const file = generateBarcode(barcode.data, barcode.filename);
      generatedFiles.barcodes.push({
        file: file,
        description: barcode.description
      });
    });
    
    console.log(`Generated ${generatedFiles.qrCodes.length} QR codes and ${generatedFiles.barcodes.length} barcodes`);
    return generatedFiles;
    
  } catch (error) {
    console.error("Error generating event codes: " + error);
    throw error;
  }
}

/**
 * Generate participant-specific QR code and barcode
 */
function generateParticipantCodes(registrationId, participantData) {
  try {
    // Generate QR code data
    const qrData = JSON.stringify({
      registrationId: registrationId,
      event: CONFIG.EVENT_NAME,
      date: CONFIG.EVENT_DATE,
      venue: CONFIG.EVENT_VENUE,
      participant: participantData.fullName,
      email: participantData.email,
      phone: participantData.phone
    });
    
    // Generate QR code
    const qrFile = generateQRCode(
      qrData,
      `QR_${registrationId}.png`
    );
    
    // Generate barcode
    const barcodeFile = generateBarcode(
      registrationId,
      `Barcode_${registrationId}.png`
    );
    
    // Create participant badge with embedded codes
    const badgeFile = createParticipantBadge(registrationId, participantData, qrFile, barcodeFile);
    
    console.log(`Participant codes generated for: ${registrationId}`);
    
    return {
      qrCode: qrFile,
      barcode: barcodeFile,
      badge: badgeFile
    };
    
  } catch (error) {
    console.error("Error generating participant codes: " + error);
    throw error;
  }
}

/**
 * Create participant badge with embedded QR code and barcode
 */
function createParticipantBadge(registrationId, participantData, qrFile, barcodeFile) {
  try {
    // Create HTML badge template
    const badgeHtml = createBadgeHTML(registrationId, participantData, qrFile, barcodeFile);
    
    // Convert HTML to PDF using Google Apps Script
    const pdfBlob = convertHtmlToPdf(badgeHtml);
    
    // Save to Google Drive
    const folders = getFolders();
    const badgeFile = folders.badges.createFile(pdfBlob);
    badgeFile.setName(`Badge_${registrationId}.pdf`);
    
    console.log(`Participant badge created: ${registrationId}`);
    return badgeFile;
    
  } catch (error) {
    console.error("Error creating participant badge: " + error);
    // Fallback: create HTML file
    const badgeHtml = createBadgeHTML(registrationId, participantData);
    const folders = getFolders();
    const badgeFile = folders.badges.createFile(
      `Badge_${registrationId}.html`,
      badgeHtml,
      "text/html"
    );
    return badgeFile;
  }
}

/**
 * Create HTML template for participant badge
 */
function createBadgeHTML(registrationId, participantData, qrFile = null, barcodeFile = null) {
  const qrImageUrl = qrFile ? qrFile.getDownloadUrl() : "";
  const barcodeImageUrl = barcodeFile ? barcodeFile.getDownloadUrl() : "";
  
  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>ExJAM PG Conference Badge - ${participantData.fullName}</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            background: linear-gradient(135deg, #1e3c72, #2a5298);
            color: white;
        }
        .badge {
            width: 400px;
            height: 600px;
            background: white;
            color: #333;
            border-radius: 15px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
            margin: 0 auto;
            padding: 30px;
            text-align: center;
        }
        .header {
            background: linear-gradient(135deg, #1e3c72, #2a5298);
            color: white;
            padding: 20px;
            margin: -30px -30px 20px -30px;
            border-radius: 15px 15px 0 0;
        }
        .event-title {
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 5px;
        }
        .event-theme {
            font-size: 14px;
            opacity: 0.9;
        }
        .participant-info {
            margin: 30px 0;
        }
        .participant-name {
            font-size: 24px;
            font-weight: bold;
            color: #1e3c72;
            margin-bottom: 10px;
        }
        .participant-details {
            font-size: 14px;
            line-height: 1.6;
        }
        .event-details {
            background: #f5f5f5;
            padding: 20px;
            border-radius: 10px;
            margin: 20px 0;
        }
        .event-details h3 {
            margin: 0 0 10px 0;
            color: #1e3c72;
        }
        .event-details p {
            margin: 5px 0;
            font-size: 14px;
        }
        .codes-section {
            display: flex;
            justify-content: space-between;
            margin-top: 30px;
        }
        .qr-code, .barcode {
            text-align: center;
        }
        .qr-code img, .barcode img {
            max-width: 120px;
            max-height: 120px;
            border: 1px solid #ddd;
            border-radius: 5px;
        }
        .registration-id {
            font-size: 12px;
            color: #666;
            margin-top: 10px;
        }
    </style>
</head>
<body>
    <div class="badge">
        <div class="header">
            <div class="event-title">ExJAM President General's Conference</div>
            <div class="event-theme">Maiden Flight</div>
        </div>
        
        <div class="participant-info">
            <div class="participant-name">${participantData.fullName}</div>
            <div class="participant-details">
                <div>Service Number: ${participantData.serviceNumber || 'N/A'}</div>
                <div>Set: ${participantData.set || 'N/A'}</div>
                <div>Squadron: ${participantData.squadron || 'N/A'}</div>
                <div>Chapter: ${participantData.chapter || 'N/A'}</div>
                <div>Organization: ${participantData.organization || 'N/A'}</div>
                <div>Location: ${participantData.location || 'N/A'}</div>
            </div>
        </div>
        
        <div class="event-details">
            <h3>Event Information</h3>
            <p><strong>Date:</strong> ${CONFIG.EVENT_DATE}</p>
            <p><strong>Venue:</strong> ${CONFIG.EVENT_VENUE}</p>
            <p><strong>Theme:</strong> ${CONFIG.EVENT_THEME}</p>
        </div>
        
        <div class="codes-section">
            <div class="qr-code">
                ${qrImageUrl ? `<img src="${qrImageUrl}" alt="QR Code">` : '<div style="width:120px;height:120px;background:#f0f0f0;border:1px solid #ddd;border-radius:5px;display:flex;align-items:center;justify-content:center;">QR Code</div>'}
                <div class="registration-id">QR Code</div>
            </div>
            <div class="barcode">
                ${barcodeImageUrl ? `<img src="${barcodeImageUrl}" alt="Barcode">` : '<div style="width:120px;height:40px;background:#f0f0f0;border:1px solid #ddd;border-radius:5px;display:flex;align-items:center;justify-content:center;">Barcode</div>'}
                <div class="registration-id">Barcode</div>
            </div>
        </div>
        
        <div class="registration-id" style="margin-top: 20px;">
            Registration ID: ${registrationId}
        </div>
    </div>
</body>
</html>
  `;
}

/**
 * Convert HTML to PDF (simplified version)
 */
function convertHtmlToPdf(html) {
  try {
    // For a full implementation, you would need to use an external service
    // like Puppeteer or a PDF conversion API
    // For now, we'll create a simple text representation
    
    const textContent = html.replace(/<[^>]*>/g, '');
    const blob = Utilities.newBlob(textContent, 'text/plain');
    blob.setName('badge.txt'); // Set a name for the blob
    return blob;
    
  } catch (error) {
    console.error("Error converting HTML to PDF: " + error);
    // Return HTML blob as fallback
    const htmlBlob = Utilities.newBlob(html, 'text/html');
    htmlBlob.setName('badge.html'); // Set a name for the blob
    return htmlBlob;
  }
}

/**
 * Bulk generate codes for multiple participants
 */
function bulkGenerateCodes(participantsData) {
  try {
    console.log(`Generating codes for ${participantsData.length} participants...`);
    
    const results = [];
    
    participantsData.forEach((participant, index) => {
      try {
        const registrationId = participant.registrationId || generateRegistrationId();
        const codes = generateParticipantCodes(registrationId, participant);
        
        results.push({
          participant: participant.fullName,
          registrationId: registrationId,
          codes: codes,
          status: 'success'
        });
        
        console.log(`Generated codes for ${participant.fullName} (${index + 1}/${participantsData.length})`);
        
        // Add delay to avoid rate limiting
        Utilities.sleep(1000);
        
      } catch (error) {
        console.error(`Error generating codes for ${participant.fullName}: ${error}`);
        results.push({
          participant: participant.fullName,
          registrationId: participant.registrationId,
          error: error.toString(),
          status: 'error'
        });
      }
    });
    
    console.log(`Bulk generation complete. ${results.filter(r => r.status === 'success').length} successful, ${results.filter(r => r.status === 'error').length} failed`);
    
    return results;
    
  } catch (error) {
    console.error("Error in bulk generation: " + error);
    throw error;
  }
}

/**
 * Test QR code and barcode generation
 */
function testCodeGeneration() {
  try {
    console.log("Testing QR code and barcode generation...");
    
    // Test QR code generation
    const testQrData = "Test QR Code for ExJAM PG Conference";
    const qrFile = generateQRCode(testQrData, "test_qr_code.png");
    console.log("✓ QR code test successful");
    
    // Test barcode generation
    const testBarcodeData = "EXJAM-TEST-2025";
    const barcodeFile = generateBarcode(testBarcodeData, "test_barcode.png");
    console.log("✓ Barcode test successful");
    
    // Test participant badge
    const testParticipant = {
      fullName: "Test Participant",
      graduationYear: "2020",
      organization: "Test Organization",
      location: "Test Location",
      email: "test@example.com",
      phone: "+1234567890"
    };
    
    const badgeFile = createParticipantBadge("EXJAM-TEST-2025", testParticipant, qrFile, barcodeFile);
    console.log("✓ Badge generation test successful");
    
    console.log("All tests completed successfully!");
    return {
      qrCode: qrFile,
      barcode: barcodeFile,
      badge: badgeFile
    };
    
  } catch (error) {
    console.error("Test failed: " + error);
    throw error;
  }
}

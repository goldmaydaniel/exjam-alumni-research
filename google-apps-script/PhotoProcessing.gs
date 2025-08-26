/**
 * Photo Processing and Badge Generation for ExJAM Registration System
 * 
 * This module handles photo uploads, processing, and badge generation with embedded photos
 */

// Photo processing configuration
const PHOTO_CONFIG = {
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_FORMATS: ['image/jpeg', 'image/jpg', 'image/png'],
  BADGE_PHOTO_SIZE: { width: 150, height: 200 }, // pixels
  PHOTOS_FOLDER_NAME: "Participant Photos"
};

/**
 * Process uploaded photo and create badge with photo
 */
function processPhotoAndCreateBadge(registrationId, participantData) {
  try {
    console.log(`Processing photo for registration: ${registrationId}`);
    
    let photoFile = null;
    let photoUrl = "";
    
    // Check if photo upload link is provided
    if (participantData.photoUploadLink && participantData.photoUploadLink.trim() !== "") {
      photoFile = downloadPhotoFromLink(participantData.photoUploadLink);
      if (photoFile) {
        photoUrl = photoFile.getDownloadUrl();
        console.log("Photo downloaded from upload link");
      }
    }
    
    // If no photo uploaded, create placeholder
    if (!photoFile) {
      photoFile = createPhotoPlaceholder(participantData.fullName);
      photoUrl = photoFile.getDownloadUrl();
      console.log("Created photo placeholder");
    }
    
    // Generate QR code and barcode
    const codes = generateParticipantCodes(registrationId, participantData);
    
    // Create badge with photo
    const badgeFile = createBadgeWithPhoto(registrationId, participantData, photoFile, codes);
    
    // Update spreadsheet with photo status
    updatePhotoStatus(registrationId, photoFile ? "Photo Added" : "Placeholder Created");
    
    console.log(`Badge with photo created for: ${registrationId}`);
    return {
      photo: photoFile,
      badge: badgeFile,
      codes: codes
    };
    
  } catch (error) {
    console.error(`Error processing photo for ${registrationId}: ${error}`);
    throw error;
  }
}

/**
 * Download photo from Google Drive link
 */
function downloadPhotoFromLink(photoLink) {
  try {
    // Extract file ID from Google Drive link
    const fileId = extractFileIdFromLink(photoLink);
    if (!fileId) {
      console.log("Invalid Google Drive link");
      return null;
    }
    
    // Get file from Google Drive
    const file = DriveApp.getFileById(fileId);
    
    // Validate file type and size
    if (!validatePhotoFile(file)) {
      console.log("Photo file validation failed");
      return null;
    }
    
    // Copy to photos folder
    const photosFolder = getOrCreatePhotosFolder();
    const copiedFile = file.makeCopy(photosFolder);
    copiedFile.setName(`Photo_${new Date().getTime()}.jpg`);
    
    return copiedFile;
    
  } catch (error) {
    console.error(`Error downloading photo: ${error}`);
    return null;
  }
}

/**
 * Extract file ID from Google Drive link
 */
function extractFileIdFromLink(link) {
  try {
    // Handle different Google Drive link formats
    const patterns = [
      /\/file\/d\/([a-zA-Z0-9-_]+)/,
      /id=([a-zA-Z0-9-_]+)/,
      /\/d\/([a-zA-Z0-9-_]+)/
    ];
    
    for (const pattern of patterns) {
      const match = link.match(pattern);
      if (match) {
        return match[1];
      }
    }
    
    return null;
  } catch (error) {
    console.error(`Error extracting file ID: ${error}`);
    return null;
  }
}

/**
 * Validate photo file
 */
function validatePhotoFile(file) {
  try {
    // Check file size
    if (file.getSize() > PHOTO_CONFIG.MAX_FILE_SIZE) {
      console.log("File too large");
      return false;
    }
    
    // Check file type
    const mimeType = file.getBlob().getContentType();
    if (!PHOTO_CONFIG.ALLOWED_FORMATS.includes(mimeType)) {
      console.log("Invalid file type");
      return false;
    }
    
    return true;
  } catch (error) {
    console.error(`Error validating photo file: ${error}`);
    return false;
  }
}

/**
 * Create photo placeholder
 */
function createPhotoPlaceholder(participantName) {
  try {
    // Create a simple placeholder image using Google Charts API
    const placeholderUrl = `https://chart.googleapis.com/chart?cht=qr&chs=150x200&chl=${encodeURIComponent(participantName)}&chco=1e3c72`;
    
    // Download placeholder
    const response = UrlFetchApp.fetch(placeholderUrl);
    const blob = response.getBlob();
    
    // Save to photos folder
    const photosFolder = getOrCreatePhotosFolder();
    const placeholderFile = photosFolder.createFile(blob);
    placeholderFile.setName(`Placeholder_${participantName.replace(/\s+/g, '_')}.png`);
    
    return placeholderFile;
    
  } catch (error) {
    console.error(`Error creating photo placeholder: ${error}`);
    return null;
  }
}

/**
 * Get or create photos folder
 */
function getOrCreatePhotosFolder() {
  try {
    const drive = DriveApp;
    const folders = drive.getFoldersByName(PHOTO_CONFIG.PHOTOS_FOLDER_NAME);
    
    if (folders.hasNext()) {
      return folders.next();
    } else {
      // Create photos folder in the main event folder
      const mainFolder = drive.getFoldersByName(CONFIG.FOLDER_NAME).next();
      return mainFolder.createFolder(PHOTO_CONFIG.PHOTOS_FOLDER_NAME);
    }
  } catch (error) {
    console.error(`Error getting photos folder: ${error}`);
    throw error;
  }
}

/**
 * Create badge with embedded photo
 */
function createBadgeWithPhoto(registrationId, participantData, photoFile, codes) {
  try {
    // Create enhanced HTML badge with photo
    const badgeHtml = createBadgeHTMLWithPhoto(registrationId, participantData, photoFile, codes);
    
    // Convert to PDF
    const pdfBlob = convertHtmlToPdf(badgeHtml);
    
    // Save to badges folder
    const folders = getFolders();
    const badgeFile = folders.badges.createFile(pdfBlob);
    badgeFile.setName(`Badge_${registrationId}_with_Photo.pdf`);
    
    console.log(`Badge with photo created: ${registrationId}`);
    return badgeFile;
    
  } catch (error) {
    console.error(`Error creating badge with photo: ${error}`);
    throw error;
  }
}

/**
 * Create HTML badge template with embedded photo
 */
function createBadgeHTMLWithPhoto(registrationId, participantData, photoFile, codes) {
  const photoUrl = photoFile ? photoFile.getDownloadUrl() : "";
  const qrImageUrl = codes.qrCode ? codes.qrCode.getDownloadUrl() : "";
  const barcodeImageUrl = codes.barcode ? codes.barcode.getDownloadUrl() : "";
  
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
            width: 450px;
            height: 650px;
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
        .badge-content {
            display: flex;
            margin: 20px 0;
        }
        .photo-section {
            flex: 0 0 150px;
            margin-right: 20px;
        }
        .participant-photo {
            width: 150px;
            height: 200px;
            border: 3px solid #1e3c72;
            border-radius: 10px;
            object-fit: cover;
            background: #f0f0f0;
        }
        .info-section {
            flex: 1;
            text-align: left;
        }
        .participant-name {
            font-size: 22px;
            font-weight: bold;
            color: #1e3c72;
            margin-bottom: 15px;
        }
        .participant-details {
            font-size: 12px;
            line-height: 1.4;
            margin-bottom: 15px;
        }
        .participant-details div {
            margin-bottom: 5px;
        }
        .event-details {
            background: #f5f5f5;
            padding: 15px;
            border-radius: 8px;
            margin: 20px 0;
        }
        .event-details h3 {
            margin: 0 0 10px 0;
            color: #1e3c72;
            font-size: 14px;
        }
        .event-details p {
            margin: 5px 0;
            font-size: 12px;
        }
        .codes-section {
            display: flex;
            justify-content: space-between;
            margin-top: 20px;
        }
        .qr-code, .barcode {
            text-align: center;
        }
        .qr-code img, .barcode img {
            max-width: 100px;
            max-height: 100px;
            border: 1px solid #ddd;
            border-radius: 5px;
        }
        .registration-id {
            font-size: 11px;
            color: #666;
            margin-top: 10px;
        }
        .photo-status {
            font-size: 10px;
            color: #888;
            margin-top: 5px;
        }
    </style>
</head>
<body>
    <div class="badge">
        <div class="header">
            <div class="event-title">ExJAM President General's Conference</div>
            <div class="event-theme">Maiden Flight</div>
        </div>
        
        <div class="badge-content">
            <div class="photo-section">
                <img src="${photoUrl}" alt="Participant Photo" class="participant-photo" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
                <div style="display:none; width:150px; height:200px; background:#f0f0f0; border:3px solid #1e3c72; border-radius:10px; display:flex; align-items:center; justify-content:center; font-size:12px; color:#666;">Photo Unavailable</div>
                <div class="photo-status">${participantData.photoConsent || 'Photo provided'}</div>
            </div>
            
            <div class="info-section">
                <div class="participant-name">${participantData.fullName}</div>
                <div class="participant-details">
                    <div><strong>Service Number:</strong> ${participantData.serviceNumber || 'N/A'}</div>
                    <div><strong>Set:</strong> ${participantData.set || 'N/A'}</div>
                    <div><strong>Squadron:</strong> ${participantData.squadron || 'N/A'}</div>
                    <div><strong>Chapter:</strong> ${participantData.chapter || 'N/A'}</div>
                    <div><strong>Organization:</strong> ${participantData.organization || 'N/A'}</div>
                    <div><strong>Location:</strong> ${participantData.location || 'N/A'}</div>
                </div>
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
                ${qrImageUrl ? `<img src="${qrImageUrl}" alt="QR Code">` : '<div style="width:100px;height:100px;background:#f0f0f0;border:1px solid #ddd;border-radius:5px;display:flex;align-items:center;justify-content:center;font-size:10px;">QR Code</div>'}
                <div class="registration-id">QR Code</div>
            </div>
            <div class="barcode">
                ${barcodeImageUrl ? `<img src="${barcodeImageUrl}" alt="Barcode">` : '<div style="width:100px;height:40px;background:#f0f0f0;border:1px solid #ddd;border-radius:5px;display:flex;align-items:center;justify-content:center;font-size:10px;">Barcode</div>'}
                <div class="registration-id">Barcode</div>
            </div>
        </div>
        
        <div class="registration-id" style="margin-top: 15px;">
            Registration ID: ${registrationId}
        </div>
    </div>
</body>
</html>
  `;
}

/**
 * Update photo status in spreadsheet
 */
function updatePhotoStatus(registrationId, status) {
  try {
    const spreadsheet = SpreadsheetApp.openByName(CONFIG.SPREADSHEET_NAME);
    const sheet = spreadsheet.getActiveSheet();
    const data = sheet.getDataRange().getValues();
    
    // Find the row with this registration ID
    for (let i = 1; i < data.length; i++) {
      if (data[i][1] === registrationId) { // Registration ID is in column B (index 1)
        // Update photo status column (assuming it's the last column before "QR Code Generated")
        const photoStatusColumn = data[0].length - 2; // Second to last column
        sheet.getRange(i + 1, photoStatusColumn + 1).setValue(status);
        break;
      }
    }
    
  } catch (error) {
    console.error(`Error updating photo status: ${error}`);
  }
}

/**
 * Bulk process photos for multiple participants
 */
function bulkProcessPhotos(participantsData) {
  try {
    console.log(`Processing photos for ${participantsData.length} participants...`);
    
    const results = [];
    
    participantsData.forEach((participant, index) => {
      try {
        const registrationId = participant.registrationId || generateRegistrationId();
        const result = processPhotoAndCreateBadge(registrationId, participant);
        
        results.push({
          participant: participant.fullName,
          registrationId: registrationId,
          photoProcessed: !!result.photo,
          badgeCreated: !!result.badge,
          status: 'success'
        });
        
        console.log(`Processed photo for ${participant.fullName} (${index + 1}/${participantsData.length})`);
        
        // Add delay to avoid rate limiting
        Utilities.sleep(2000);
        
      } catch (error) {
        console.error(`Error processing photo for ${participant.fullName}: ${error}`);
        results.push({
          participant: participant.fullName,
          registrationId: participant.registrationId,
          error: error.toString(),
          status: 'error'
        });
      }
    });
    
    console.log(`Bulk photo processing complete. ${results.filter(r => r.status === 'success').length} successful, ${results.filter(r => r.status === 'error').length} failed`);
    
    return results;
    
  } catch (error) {
    console.error("Error in bulk photo processing: " + error);
    throw error;
  }
}

/**
 * Test photo processing functionality
 */
function testPhotoProcessing() {
  try {
    console.log("Testing photo processing...");
    
    const testParticipant = {
      fullName: "Test Participant",
      serviceNumber: "EXJAM-TEST-001",
      set: "2020",
      squadron: "Alpha (Yellow)",
      chapter: "Lagos, Nigeria",
      organization: "Test Organization",
      location: "Lagos, Nigeria",
      email: "test@example.com",
      phone: "+234 123 456 7890",
      photoUploadLink: "",
      photoConsent: "I consent to having my photo taken and used on my conference badge"
    };
    
    const result = processPhotoAndCreateBadge("EXJAM-TEST-2025", testParticipant);
    
    console.log("✓ Photo processing test successful");
    console.log(`Photo: ${result.photo ? 'Created' : 'Failed'}`);
    console.log(`Badge: ${result.badge ? 'Created' : 'Failed'}`);
    
    return result;
    
  } catch (error) {
    console.error("Photo processing test failed: " + error);
    throw error;
  }
}

// api/badge.js - Badge generation endpoint
import PDFDocument from 'pdfkit';
import { google } from 'googleapis';

const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  },
  scopes: ['https://www.googleapis.com/auth/drive.file'],
});

const drive = google.drive({ version: 'v3', auth });

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      registrationId,
      name,
      email,
      organization,
      position,
      chapter,
      qrCode,
      barcode,
      photoUrl
    } = req.body;

    // Create PDF document
    const doc = new PDFDocument({
      size: [242, 400], // Badge size in points (3.36" x 5.56")
      margins: { top: 20, bottom: 20, left: 20, right: 20 }
    });

    // Stream to buffer
    const chunks = [];
    doc.on('data', chunk => chunks.push(chunk));
    doc.on('end', () => {
      const pdfBuffer = Buffer.concat(chunks);
      
      // Return PDF as base64
      const pdfBase64 = pdfBuffer.toString('base64');
      
      res.status(200).json({
        success: true,
        badge: `data:application/pdf;base64,${pdfBase64}`,
        registrationId
      });
    });

    // Design the badge
    // Header with logo and event name
    doc.fillColor('#1e3c72')
       .fontSize(16)
       .font('Helvetica-Bold')
       .text('ExJAM', { align: 'center' });
    
    doc.fontSize(12)
       .font('Helvetica')
       .text('President General\'s Conference', { align: 'center' })
       .text('Maiden Flight 2025', { align: 'center' })
       .moveDown(0.5);

    // Photo placeholder or actual photo
    if (photoUrl) {
      try {
        // Add photo (you'll need to fetch and convert the photo)
        doc.image(photoUrl, doc.page.width / 2 - 50, doc.y, { 
          width: 100, 
          height: 100,
          align: 'center' 
        });
      } catch (e) {
        // Placeholder if photo fails
        doc.rect(doc.page.width / 2 - 50, doc.y, 100, 100)
           .stroke()
           .fillColor('#cccccc')
           .fontSize(10)
           .text('PHOTO', doc.page.width / 2 - 20, doc.y + 45);
      }
    } else {
      // Photo placeholder
      doc.rect(doc.page.width / 2 - 50, doc.y, 100, 100)
         .stroke();
    }

    doc.moveDown(5);

    // Name
    doc.fillColor('#1e3c72')
       .fontSize(16)
       .font('Helvetica-Bold')
       .text(name, { align: 'center' })
       .moveDown(0.3);

    // Position and Organization
    if (position) {
      doc.fillColor('#333333')
         .fontSize(11)
         .font('Helvetica')
         .text(position, { align: 'center' });
    }
    
    if (organization) {
      doc.fontSize(10)
         .text(organization, { align: 'center' });
    }

    // Chapter
    if (chapter) {
      doc.moveDown(0.3)
         .fillColor('#666666')
         .fontSize(10)
         .text(`Chapter: ${chapter}`, { align: 'center' });
    }

    doc.moveDown(0.5);

    // QR Code
    if (qrCode) {
      const qrImageData = qrCode.replace(/^data:image\/png;base64,/, '');
      const qrBuffer = Buffer.from(qrImageData, 'base64');
      doc.image(qrBuffer, doc.page.width / 2 - 40, doc.y, { width: 80, height: 80 });
    }

    doc.moveDown(4);

    // Barcode
    if (barcode) {
      const barcodeImageData = barcode.replace(/^data:image\/png;base64,/, '');
      const barcodeBuffer = Buffer.from(barcodeImageData, 'base64');
      doc.image(barcodeBuffer, doc.page.width / 2 - 60, doc.y, { width: 120, height: 40 });
    }

    doc.moveDown(2);

    // Registration ID
    doc.fillColor('#666666')
       .fontSize(8)
       .text(registrationId, { align: 'center' });

    // Footer
    doc.moveDown(0.5)
       .fontSize(8)
       .fillColor('#999999')
       .text('NAF Conference Centre, ABUJA', { align: 'center' })
       .text('November 28-30, 2025', { align: 'center' });

    // Finalize PDF
    doc.end();

  } catch (error) {
    console.error('Badge generation error:', error);
    return res.status(500).json({ 
      error: 'Badge generation failed', 
      details: error.message 
    });
  }
}
// api/register.js - Main registration endpoint for ExJAM Conference
import { google } from 'googleapis';
import QRCode from 'qrcode';
import JsBarcode from 'jsbarcode';
import { createCanvas } from 'canvas';

// Initialize Google Sheets API
const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  },
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const sheets = google.sheets({ version: 'v4', auth });
const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_ID;

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export default async function handler(req, res) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).json({}, { headers: corsHeaders });
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' }, { headers: corsHeaders });
  }

  try {
    // Parse request body
    const {
      firstName,
      lastName,
      email,
      phone,
      organization,
      position,
      chapter,
      graduationYear,
      accommodationType,
      dietaryRestrictions,
      photoUrl,
      emergencyContact,
      emergencyPhone,
    } = req.body;

    // Validate required fields
    if (!firstName || !lastName || !email || !phone) {
      return res.status(400).json({ 
        error: 'Missing required fields' 
      }, { headers: corsHeaders });
    }

    // Generate unique registration ID
    const timestamp = Date.now();
    const registrationId = `EXJAM-${timestamp}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
    
    // Generate QR code data
    const qrData = JSON.stringify({
      id: registrationId,
      name: `${firstName} ${lastName}`,
      email: email,
      chapter: chapter || 'N/A',
      event: 'ExJAM PG Conference 2025'
    });

    // Generate QR code as base64
    const qrCodeBase64 = await QRCode.toDataURL(qrData, {
      errorCorrectionLevel: 'M',
      type: 'image/png',
      quality: 0.92,
      margin: 1,
      color: {
        dark: '#1e3c72',
        light: '#FFFFFF',
      },
      width: 200,
    });

    // Generate barcode
    const canvas = createCanvas(200, 100);
    JsBarcode(canvas, registrationId, {
      format: 'CODE128',
      width: 2,
      height: 50,
      displayValue: true,
      fontSize: 12,
      background: '#ffffff',
      lineColor: '#000000',
    });
    const barcodeBase64 = canvas.toDataURL();

    // Format timestamp
    const registrationDate = new Date().toISOString();

    // Prepare data for Google Sheets
    const rowData = [
      registrationId,
      registrationDate,
      firstName,
      lastName,
      email,
      phone,
      organization || '',
      position || '',
      chapter || '',
      graduationYear || '',
      accommodationType || '',
      dietaryRestrictions || '',
      emergencyContact || '',
      emergencyPhone || '',
      photoUrl || '',
      qrCodeBase64,
      barcodeBase64,
      'Confirmed', // Registration status
    ];

    // Append to Google Sheets
    const request = {
      spreadsheetId: SPREADSHEET_ID,
      range: 'Registrations!A:R', // Adjust based on your sheet name
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      resource: {
        values: [rowData],
      },
    };

    await sheets.spreadsheets.values.append(request);

    // Send confirmation email (optional - implement email service)
    // await sendConfirmationEmail(email, registrationId, qrCodeBase64);

    // Return success response
    return res.status(200).json({
      success: true,
      message: 'Registration successful',
      data: {
        registrationId,
        name: `${firstName} ${lastName}`,
        email,
        qrCode: qrCodeBase64,
        barcode: barcodeBase64,
        timestamp: registrationDate,
      }
    }, { headers: corsHeaders });

  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ 
      error: 'Registration failed', 
      details: error.message 
    }, { headers: corsHeaders });
  }
}
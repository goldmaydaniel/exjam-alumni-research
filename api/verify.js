// api/verify.js - QR code verification endpoint
import { google } from 'googleapis';

const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  },
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const sheets = google.sheets({ version: 'v4', auth });
const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_ID;

export default async function handler(req, res) {
  // Handle CORS
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (req.method === 'OPTIONS') {
    return res.status(200).json({}, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' }, { headers: corsHeaders });
  }

  try {
    const { qrData } = req.body;

    if (!qrData) {
      return res.status(400).json({ 
        error: 'QR data is required' 
      }, { headers: corsHeaders });
    }

    // Parse QR data
    let parsedData;
    try {
      parsedData = JSON.parse(qrData);
    } catch (e) {
      return res.status(400).json({ 
        error: 'Invalid QR code format' 
      }, { headers: corsHeaders });
    }

    const { id: registrationId } = parsedData;

    if (!registrationId) {
      return res.status(400).json({ 
        error: 'Invalid QR code - no registration ID' 
      }, { headers: corsHeaders });
    }

    // Search for registration in Google Sheets
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Registrations!A:R',
    });

    const rows = response.data.values || [];
    
    // Find the registration
    const registrationIndex = rows.findIndex(row => row[0] === registrationId);
    
    if (registrationIndex === -1) {
      return res.status(404).json({ 
        error: 'Registration not found',
        valid: false 
      }, { headers: corsHeaders });
    }

    const registration = rows[registrationIndex];
    const [
      id,
      registrationDate,
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
      emergencyContact,
      emergencyPhone,
      photoUrl,
      qrCode,
      barcode,
      status,
      checkInTime
    ] = registration;

    // Update check-in time if not already checked in
    if (!checkInTime) {
      const currentTime = new Date().toISOString();
      
      // Update the sheet with check-in time
      await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `Registrations!S${registrationIndex + 1}`, // Column S for check-in time
        valueInputOption: 'USER_ENTERED',
        resource: {
          values: [[currentTime]]
        }
      });

      // Update status to "Checked In"
      await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `Registrations!R${registrationIndex + 1}`, // Column R for status
        valueInputOption: 'USER_ENTERED',
        resource: {
          values: [['Checked In']]
        }
      });
    }

    // Return verification result
    return res.status(200).json({
      success: true,
      valid: true,
      data: {
        registrationId: id,
        name: `${firstName} ${lastName}`,
        email,
        organization,
        position,
        chapter,
        accommodationType,
        status: checkInTime ? 'Already Checked In' : 'Checked In',
        checkInTime: checkInTime || new Date().toISOString(),
        registrationDate,
      },
      message: checkInTime 
        ? `Already checked in at ${new Date(checkInTime).toLocaleString()}`
        : 'Successfully checked in'
    }, { headers: corsHeaders });

  } catch (error) {
    console.error('Verification error:', error);
    return res.status(500).json({ 
      error: 'Verification failed', 
      details: error.message 
    }, { headers: corsHeaders });
  }
}
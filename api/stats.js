// api/stats.js - Registration statistics endpoint
import { google } from 'googleapis';

const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  },
  scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
});

const sheets = google.sheets({ version: 'v4', auth });
const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_ID;

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get all registration data
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Registrations!A:R',
    });

    const rows = response.data.values || [];
    
    // Skip header row
    const registrations = rows.slice(1);
    
    // Calculate statistics
    const stats = {
      totalRegistrations: registrations.length,
      byChapter: {},
      byAccommodation: {},
      byMonth: {},
      recentRegistrations: [],
      dailyRegistrations: {},
    };

    // Process each registration
    registrations.forEach((row, index) => {
      const [
        registrationId,
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
      ] = row;

      // By Chapter
      if (chapter) {
        stats.byChapter[chapter] = (stats.byChapter[chapter] || 0) + 1;
      }

      // By Accommodation
      if (accommodationType) {
        stats.byAccommodation[accommodationType] = (stats.byAccommodation[accommodationType] || 0) + 1;
      }

      // By Month
      if (registrationDate) {
        const month = new Date(registrationDate).toLocaleString('default', { month: 'long', year: 'numeric' });
        stats.byMonth[month] = (stats.byMonth[month] || 0) + 1;
      }

      // Daily registrations
      if (registrationDate) {
        const day = new Date(registrationDate).toISOString().split('T')[0];
        stats.dailyRegistrations[day] = (stats.dailyRegistrations[day] || 0) + 1;
      }

      // Recent registrations (last 10)
      if (index < 10) {
        stats.recentRegistrations.push({
          id: registrationId,
          name: `${firstName} ${lastName}`,
          date: registrationDate,
          chapter: chapter || 'N/A',
        });
      }
    });

    // Sort and limit results
    stats.topChapters = Object.entries(stats.byChapter)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([chapter, count]) => ({ chapter, count }));

    // Calculate growth rate
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    stats.todayRegistrations = stats.dailyRegistrations[today] || 0;
    stats.yesterdayRegistrations = stats.dailyRegistrations[yesterday] || 0;
    
    if (stats.yesterdayRegistrations > 0) {
      stats.growthRate = ((stats.todayRegistrations - stats.yesterdayRegistrations) / stats.yesterdayRegistrations * 100).toFixed(1);
    } else {
      stats.growthRate = 0;
    }

    return res.status(200).json({
      success: true,
      stats,
      lastUpdated: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Stats error:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch statistics', 
      details: error.message 
    });
  }
}
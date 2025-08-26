// Admin Analytics API
export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }
    
    // Check authorization
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({
            success: false,
            message: 'Unauthorized'
        });
        return;
    }
    
    if (req.method === 'GET') {
        const { startDate, endDate, type = 'overview' } = req.query;
        
        // Generate mock analytics data
        const analytics = {
            overview: {
                totalRegistrations: 1247,
                verifiedAlumni: 892,
                pendingApproval: 43,
                rejectedApplications: 12,
                surveyResponses: 567,
                averageResponseRate: 78.5,
                monthlyGrowth: 12.3,
                activeUsers: 634,
                engagementRate: 82.4
            },
            
            registrationTrends: {
                daily: [
                    { date: '2024-01-15', count: 12 },
                    { date: '2024-01-16', count: 19 },
                    { date: '2024-01-17', count: 15 },
                    { date: '2024-01-18', count: 25 },
                    { date: '2024-01-19', count: 22 },
                    { date: '2024-01-20', count: 30 },
                    { date: '2024-01-21', count: 28 }
                ],
                monthly: [
                    { month: 'Oct 2023', count: 145 },
                    { month: 'Nov 2023', count: 189 },
                    { month: 'Dec 2023', count: 234 },
                    { month: 'Jan 2024', count: 278 }
                ]
            },
            
            squadronDistribution: [
                { squadron: 'Alpha', count: 245, percentage: 27.5 },
                { squadron: 'Jaguar', count: 223, percentage: 25.0 },
                { squadron: 'Mig', count: 178, percentage: 20.0 },
                { squadron: 'Hercules', count: 134, percentage: 15.0 },
                { squadron: 'Donier', count: 112, percentage: 12.5 }
            ],
            
            batchDistribution: [
                { batch: '2020', count: 234 },
                { batch: '2021', count: 289 },
                { batch: '2022', count: 198 },
                { batch: '2023', count: 171 }
            ],
            
            geographicDistribution: [
                { country: 'Nigeria', count: 456, percentage: 51.1 },
                { country: 'United Kingdom', count: 178, percentage: 20.0 },
                { country: 'United States', count: 134, percentage: 15.0 },
                { country: 'Canada', count: 67, percentage: 7.5 },
                { country: 'Others', count: 57, percentage: 6.4 }
            ],
            
            careerFields: [
                { field: 'Aviation', count: 345, percentage: 38.7 },
                { field: 'Technology', count: 234, percentage: 26.2 },
                { field: 'Business', count: 156, percentage: 17.5 },
                { field: 'Education', count: 89, percentage: 10.0 },
                { field: 'Healthcare', count: 68, percentage: 7.6 }
            ],
            
            surveyMetrics: {
                totalSurveys: 12,
                activeSurveys: 3,
                completedSurveys: 9,
                totalResponses: 567,
                averageCompletionRate: 72.3,
                averageCompletionTime: '8.5 minutes',
                topSurveys: [
                    { title: 'Career Development Survey', responses: 234, completionRate: 78 },
                    { title: 'Alumni Engagement Survey', responses: 189, completionRate: 65 },
                    { title: 'Event Feedback Survey', responses: 144, completionRate: 82 }
                ]
            },
            
            engagementMetrics: {
                dailyActiveUsers: 234,
                weeklyActiveUsers: 567,
                monthlyActiveUsers: 892,
                averageSessionDuration: '12.3 minutes',
                pageViewsPerSession: 5.6,
                bounceRate: 23.4,
                returnVisitorRate: 67.8
            },
            
            recentActivity: [
                { type: 'registration', count: 45, change: '+12%' },
                { type: 'profile_update', count: 78, change: '+8%' },
                { type: 'survey_response', count: 34, change: '+25%' },
                { type: 'document_upload', count: 23, change: '-5%' }
            ]
        };
        
        // Filter by type if specified
        let responseData = analytics;
        if (type !== 'overview') {
            responseData = analytics[type] || {};
        }
        
        // Apply date filtering if provided
        if (startDate && endDate && analytics.registrationTrends) {
            // Filter trends data based on date range
            const start = new Date(startDate);
            const end = new Date(endDate);
            
            if (analytics.registrationTrends.daily) {
                responseData.registrationTrends.daily = analytics.registrationTrends.daily.filter(item => {
                    const itemDate = new Date(item.date);
                    return itemDate >= start && itemDate <= end;
                });
            }
        }
        
        res.status(200).json({
            success: true,
            data: responseData,
            dateRange: {
                start: startDate || 'all-time',
                end: endDate || 'present'
            },
            generated: new Date().toISOString()
        });
    } else {
        res.status(405).json({
            success: false,
            message: 'Method not allowed'
        });
    }
}
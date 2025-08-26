// Admin Authentication API
export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }
    
    if (req.method === 'POST') {
        try {
            const { email, password } = req.body;
            
            // In production, validate against database
            // For demo, check against environment variables
            const adminEmail = process.env.ADMIN_EMAIL || 'admin@exjam.org';
            const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
            
            if (email === adminEmail && password === adminPassword) {
                // Generate JWT token (simplified for demo)
                const token = Buffer.from(`${email}:${Date.now()}`).toString('base64');
                
                res.status(200).json({
                    success: true,
                    token: token,
                    user: {
                        email: email,
                        name: email.split('@')[0],
                        role: 'Administrator'
                    }
                });
            } else {
                res.status(401).json({
                    success: false,
                    message: 'Invalid credentials'
                });
            }
        } catch (error) {
            console.error('Authentication error:', error);
            res.status(500).json({
                success: false,
                message: 'Authentication failed'
            });
        }
    } else if (req.method === 'GET') {
        // Validate token
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(401).json({
                success: false,
                message: 'No token provided'
            });
            return;
        }
        
        const token = authHeader.substring(7);
        
        try {
            // Decode and validate token (simplified)
            const decoded = Buffer.from(token, 'base64').toString('ascii');
            const [email, timestamp] = decoded.split(':');
            
            // Check if token is not expired (24 hours)
            const tokenAge = Date.now() - parseInt(timestamp);
            if (tokenAge > 24 * 60 * 60 * 1000) {
                res.status(401).json({
                    success: false,
                    message: 'Token expired'
                });
                return;
            }
            
            res.status(200).json({
                success: true,
                user: {
                    email: email,
                    name: email.split('@')[0],
                    role: 'Administrator'
                }
            });
        } catch (error) {
            res.status(401).json({
                success: false,
                message: 'Invalid token'
            });
        }
    } else {
        res.status(405).json({
            success: false,
            message: 'Method not allowed'
        });
    }
}
// Admin Registrations Management API
export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
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
    
    // Mock data for demonstration
    const mockRegistrations = [
        {
            id: 1,
            name: 'John Doe',
            email: 'john.doe@example.com',
            phone: '+1234567890',
            batch: '2020',
            squadron: 'Alpha',
            status: 'approved',
            registrationDate: '2024-01-15',
            verificationDate: '2024-01-16',
            profileComplete: true
        },
        {
            id: 2,
            name: 'Jane Smith',
            email: 'jane.smith@example.com',
            phone: '+1234567891',
            batch: '2021',
            squadron: 'Jaguar',
            status: 'pending',
            registrationDate: '2024-01-20',
            verificationDate: null,
            profileComplete: false
        },
        {
            id: 3,
            name: 'Mike Johnson',
            email: 'mike.j@example.com',
            phone: '+1234567892',
            batch: '2019',
            squadron: 'Mig',
            status: 'approved',
            registrationDate: '2024-01-10',
            verificationDate: '2024-01-11',
            profileComplete: true
        }
    ];
    
    switch (req.method) {
        case 'GET':
            // Get all registrations with optional filters
            const { status, batch, squadron, search, page = 1, limit = 10 } = req.query;
            
            let filteredRegistrations = [...mockRegistrations];
            
            // Apply filters
            if (status) {
                filteredRegistrations = filteredRegistrations.filter(r => r.status === status);
            }
            
            if (batch) {
                filteredRegistrations = filteredRegistrations.filter(r => r.batch === batch);
            }
            
            if (squadron) {
                filteredRegistrations = filteredRegistrations.filter(r => r.squadron === squadron);
            }
            
            if (search) {
                const searchLower = search.toLowerCase();
                filteredRegistrations = filteredRegistrations.filter(r => 
                    r.name.toLowerCase().includes(searchLower) ||
                    r.email.toLowerCase().includes(searchLower) ||
                    r.phone.includes(search)
                );
            }
            
            // Pagination
            const startIndex = (page - 1) * limit;
            const endIndex = startIndex + parseInt(limit);
            const paginatedRegistrations = filteredRegistrations.slice(startIndex, endIndex);
            
            res.status(200).json({
                success: true,
                data: paginatedRegistrations,
                pagination: {
                    total: filteredRegistrations.length,
                    page: parseInt(page),
                    limit: parseInt(limit),
                    pages: Math.ceil(filteredRegistrations.length / limit)
                },
                stats: {
                    total: mockRegistrations.length,
                    approved: mockRegistrations.filter(r => r.status === 'approved').length,
                    pending: mockRegistrations.filter(r => r.status === 'pending').length,
                    rejected: mockRegistrations.filter(r => r.status === 'rejected').length
                }
            });
            break;
            
        case 'POST':
            // Add new registration
            const newRegistration = {
                id: mockRegistrations.length + 1,
                ...req.body,
                status: 'pending',
                registrationDate: new Date().toISOString().split('T')[0],
                verificationDate: null,
                profileComplete: false
            };
            
            res.status(201).json({
                success: true,
                message: 'Registration created successfully',
                data: newRegistration
            });
            break;
            
        case 'PUT':
            // Update registration
            const { id } = req.query;
            const updateData = req.body;
            
            const registrationIndex = mockRegistrations.findIndex(r => r.id === parseInt(id));
            
            if (registrationIndex === -1) {
                res.status(404).json({
                    success: false,
                    message: 'Registration not found'
                });
                return;
            }
            
            const updatedRegistration = {
                ...mockRegistrations[registrationIndex],
                ...updateData
            };
            
            // If status is being changed to approved, set verification date
            if (updateData.status === 'approved' && !updatedRegistration.verificationDate) {
                updatedRegistration.verificationDate = new Date().toISOString().split('T')[0];
            }
            
            res.status(200).json({
                success: true,
                message: 'Registration updated successfully',
                data: updatedRegistration
            });
            break;
            
        case 'DELETE':
            // Delete registration
            const { id: deleteId } = req.query;
            
            const deleteIndex = mockRegistrations.findIndex(r => r.id === parseInt(deleteId));
            
            if (deleteIndex === -1) {
                res.status(404).json({
                    success: false,
                    message: 'Registration not found'
                });
                return;
            }
            
            res.status(200).json({
                success: true,
                message: 'Registration deleted successfully'
            });
            break;
            
        default:
            res.status(405).json({
                success: false,
                message: 'Method not allowed'
            });
    }
}
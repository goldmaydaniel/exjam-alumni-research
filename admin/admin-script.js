// Admin Dashboard JavaScript
let currentUser = null;
let registrationsData = [];
let currentPage = 1;
const itemsPerPage = 10;

// Initialize dashboard on page load
document.addEventListener('DOMContentLoaded', function() {
    checkAuthentication();
    initializeEventListeners();
    initializeCharts();
    loadDashboardData();
});

// Authentication check
function checkAuthentication() {
    const token = localStorage.getItem('adminToken');
    if (!token) {
        showLoginModal();
    } else {
        validateToken(token);
    }
}

function showLoginModal() {
    const modal = document.getElementById('loginModal');
    modal.classList.add('active');
}

function hideLoginModal() {
    const modal = document.getElementById('loginModal');
    modal.classList.remove('active');
}

function validateToken(token) {
    // In production, validate token with backend
    // For now, simulate validation
    currentUser = {
        name: 'Admin User',
        email: 'admin@exjam.org',
        role: 'Administrator'
    };
    document.getElementById('adminName').textContent = currentUser.name;
    hideLoginModal();
}

// Login form handler
document.getElementById('loginForm')?.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    // In production, authenticate with backend
    // For demo, accept any credentials
    if (email && password) {
        const token = btoa(email + ':' + password);
        localStorage.setItem('adminToken', token);
        currentUser = {
            name: email.split('@')[0],
            email: email,
            role: 'Administrator'
        };
        document.getElementById('adminName').textContent = currentUser.name;
        hideLoginModal();
        loadDashboardData();
    }
});

// Logout handler
document.getElementById('logoutBtn')?.addEventListener('click', function() {
    localStorage.removeItem('adminToken');
    currentUser = null;
    showLoginModal();
});

// Initialize event listeners
function initializeEventListeners() {
    // Sidebar navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            const section = this.dataset.section;
            navigateToSection(section);
        });
    });
    
    // Menu toggle for mobile
    document.getElementById('menuToggle')?.addEventListener('click', function() {
        document.getElementById('sidebar').classList.toggle('active');
    });
    
    // Refresh button
    document.getElementById('refreshBtn')?.addEventListener('click', function() {
        loadDashboardData();
        this.style.animation = 'spin 1s';
        setTimeout(() => {
            this.style.animation = '';
        }, 1000);
    });
    
    // Export button
    document.getElementById('exportBtn')?.addEventListener('click', function() {
        exportData();
    });
    
    // Search registrations
    document.getElementById('searchRegistrations')?.addEventListener('input', function() {
        filterRegistrations();
    });
    
    // Status filter
    document.getElementById('statusFilter')?.addEventListener('change', function() {
        filterRegistrations();
    });
    
    // Batch filter
    document.getElementById('batchFilter')?.addEventListener('change', function() {
        filterRegistrations();
    });
    
    // Add registration button
    document.getElementById('addRegistrationBtn')?.addEventListener('click', function() {
        showAddRegistrationModal();
    });
    
    // Select all checkbox
    document.getElementById('selectAll')?.addEventListener('change', function() {
        const checkboxes = document.querySelectorAll('.registration-checkbox');
        checkboxes.forEach(cb => cb.checked = this.checked);
    });
    
    // Pagination
    document.getElementById('prevPage')?.addEventListener('click', function() {
        if (currentPage > 1) {
            currentPage--;
            renderRegistrationsTable();
        }
    });
    
    document.getElementById('nextPage')?.addEventListener('click', function() {
        const totalPages = Math.ceil(registrationsData.length / itemsPerPage);
        if (currentPage < totalPages) {
            currentPage++;
            renderRegistrationsTable();
        }
    });
    
    // Date range picker
    document.getElementById('applyDateRange')?.addEventListener('click', function() {
        const startDate = document.getElementById('startDate').value;
        const endDate = document.getElementById('endDate').value;
        loadAnalyticsData(startDate, endDate);
    });
    
    // Generate report
    document.getElementById('generateReportBtn')?.addEventListener('click', function() {
        generateReport();
    });
    
    // Send email
    document.getElementById('sendEmailBtn')?.addEventListener('click', function() {
        sendNotificationEmail();
    });
    
    // Settings tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const tab = this.dataset.tab;
            showSettingsTab(tab);
        });
    });
}

// Navigation function
function navigateToSection(section) {
    // Update active nav item
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    document.querySelector(`[data-section="${section}"]`).classList.add('active');
    
    // Update content sections
    document.querySelectorAll('.content-section').forEach(sec => {
        sec.classList.remove('active');
    });
    document.getElementById(section).classList.add('active');
    
    // Update topbar title
    const titles = {
        dashboard: 'Dashboard',
        registrations: 'Registrations Management',
        analytics: 'Analytics & Insights',
        alumni: 'Alumni Profiles',
        surveys: 'Survey Management',
        reports: 'Reports',
        notifications: 'Email Notifications',
        settings: 'Settings'
    };
    
    document.getElementById('sectionTitle').textContent = titles[section];
    document.getElementById('breadcrumbSection').textContent = titles[section];
    
    // Load section-specific data
    loadSectionData(section);
}

// Load dashboard data
async function loadDashboardData() {
    try {
        // Fetch statistics from backend
        // For demo, use mock data
        const stats = {
            totalRegistrations: 1247,
            verifiedAlumni: 892,
            pendingApproval: 43,
            surveyResponses: 567
        };
        
        // Update stat cards
        document.getElementById('totalRegistrations').textContent = stats.totalRegistrations;
        document.getElementById('verifiedAlumni').textContent = stats.verifiedAlumni;
        document.getElementById('pendingApproval').textContent = stats.pendingApproval;
        document.getElementById('surveyResponses').textContent = stats.surveyResponses;
        
        // Load recent activity
        loadRecentActivity();
        
        // Update charts
        updateDashboardCharts();
        
    } catch (error) {
        console.error('Error loading dashboard data:', error);
    }
}

// Load recent activity
function loadRecentActivity() {
    const activities = [
        { type: 'registration', user: 'John Doe', action: 'completed registration', time: '5 minutes ago' },
        { type: 'survey', user: 'Jane Smith', action: 'submitted survey response', time: '15 minutes ago' },
        { type: 'approval', user: 'Admin', action: 'approved 3 registrations', time: '1 hour ago' },
        { type: 'export', user: 'System', action: 'generated monthly report', time: '2 hours ago' }
    ];
    
    const activityList = document.getElementById('activityList');
    activityList.innerHTML = activities.map(activity => `
        <div class="activity-item">
            <div class="activity-icon ${activity.type}">
                <i class="fas fa-${getActivityIcon(activity.type)}"></i>
            </div>
            <div class="activity-details">
                <strong>${activity.user}</strong> ${activity.action}
                <span class="activity-time">${activity.time}</span>
            </div>
        </div>
    `).join('');
}

function getActivityIcon(type) {
    const icons = {
        registration: 'user-plus',
        survey: 'clipboard-list',
        approval: 'check-circle',
        export: 'file-export'
    };
    return icons[type] || 'circle';
}

// Initialize charts
function initializeCharts() {
    // Registration trends chart
    const registrationCtx = document.getElementById('registrationChart')?.getContext('2d');
    if (registrationCtx) {
        new Chart(registrationCtx, {
            type: 'line',
            data: {
                labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                datasets: [{
                    label: 'Registrations',
                    data: [12, 19, 15, 25, 22, 30, 28],
                    borderColor: '#2563eb',
                    backgroundColor: 'rgba(37, 99, 235, 0.1)',
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }
    
    // Distribution chart
    const distributionCtx = document.getElementById('distributionChart')?.getContext('2d');
    if (distributionCtx) {
        new Chart(distributionCtx, {
            type: 'doughnut',
            data: {
                labels: ['Alpha', 'Jaguar', 'Mig', 'Hercules', 'Donier'],
                datasets: [{
                    data: [30, 25, 20, 15, 10],
                    backgroundColor: [
                        '#2563eb',
                        '#8b5cf6',
                        '#10b981',
                        '#f59e0b',
                        '#ef4444'
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }
}

// Update dashboard charts
function updateDashboardCharts() {
    // This would fetch real data and update charts
    // For now, charts are initialized with static data
}

// Load section-specific data
function loadSectionData(section) {
    switch(section) {
        case 'registrations':
            loadRegistrationsData();
            break;
        case 'analytics':
            loadAnalyticsData();
            break;
        case 'alumni':
            loadAlumniProfiles();
            break;
        case 'surveys':
            loadSurveys();
            break;
        case 'reports':
            loadRecentReports();
            break;
        case 'notifications':
            loadEmailHistory();
            break;
    }
}

// Load registrations data
async function loadRegistrationsData() {
    try {
        // In production, fetch from backend
        // For demo, use mock data
        registrationsData = generateMockRegistrations(50);
        renderRegistrationsTable();
    } catch (error) {
        console.error('Error loading registrations:', error);
    }
}

// Generate mock registrations
function generateMockRegistrations(count) {
    const names = ['John Doe', 'Jane Smith', 'Mike Johnson', 'Sarah Williams', 'David Brown'];
    const statuses = ['pending', 'approved', 'rejected'];
    const batches = ['2020', '2021', '2022', '2023'];
    
    return Array.from({ length: count }, (_, i) => ({
        id: i + 1,
        name: names[Math.floor(Math.random() * names.length)] + ' ' + (i + 1),
        email: `user${i + 1}@example.com`,
        phone: `+1234567${String(i).padStart(4, '0')}`,
        batch: batches[Math.floor(Math.random() * batches.length)],
        status: statuses[Math.floor(Math.random() * statuses.length)],
        date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toLocaleDateString()
    }));
}

// Render registrations table
function renderRegistrationsTable() {
    const tbody = document.getElementById('registrationsTableBody');
    if (!tbody) return;
    
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const pageData = registrationsData.slice(start, end);
    
    tbody.innerHTML = pageData.map(reg => `
        <tr>
            <td><input type="checkbox" class="registration-checkbox" data-id="${reg.id}"></td>
            <td>${reg.name}</td>
            <td>${reg.email}</td>
            <td>${reg.phone}</td>
            <td>${reg.batch}</td>
            <td><span class="status-badge ${reg.status}">${reg.status}</span></td>
            <td>${reg.date}</td>
            <td>
                <button class="action-btn" onclick="viewRegistration(${reg.id})">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="action-btn" onclick="editRegistration(${reg.id})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="action-btn" onclick="deleteRegistration(${reg.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
    
    updatePagination();
}

// Update pagination
function updatePagination() {
    const totalPages = Math.ceil(registrationsData.length / itemsPerPage);
    const pageNumbers = document.getElementById('pageNumbers');
    if (!pageNumbers) return;
    
    pageNumbers.innerHTML = '';
    for (let i = 1; i <= totalPages; i++) {
        const pageBtn = document.createElement('button');
        pageBtn.className = `page-btn ${i === currentPage ? 'active' : ''}`;
        pageBtn.textContent = i;
        pageBtn.onclick = () => {
            currentPage = i;
            renderRegistrationsTable();
        };
        pageNumbers.appendChild(pageBtn);
    }
}

// Filter registrations
function filterRegistrations() {
    const searchTerm = document.getElementById('searchRegistrations')?.value.toLowerCase();
    const statusFilter = document.getElementById('statusFilter')?.value;
    const batchFilter = document.getElementById('batchFilter')?.value;
    
    let filtered = [...registrationsData];
    
    if (searchTerm) {
        filtered = filtered.filter(reg => 
            reg.name.toLowerCase().includes(searchTerm) ||
            reg.email.toLowerCase().includes(searchTerm) ||
            reg.phone.includes(searchTerm)
        );
    }
    
    if (statusFilter) {
        filtered = filtered.filter(reg => reg.status === statusFilter);
    }
    
    if (batchFilter) {
        filtered = filtered.filter(reg => reg.batch === batchFilter);
    }
    
    registrationsData = filtered;
    currentPage = 1;
    renderRegistrationsTable();
}

// Registration actions
function viewRegistration(id) {
    console.log('View registration:', id);
    // Implement view modal
}

function editRegistration(id) {
    console.log('Edit registration:', id);
    // Implement edit modal
}

function deleteRegistration(id) {
    if (confirm('Are you sure you want to delete this registration?')) {
        registrationsData = registrationsData.filter(reg => reg.id !== id);
        renderRegistrationsTable();
    }
}

// Load analytics data
function loadAnalyticsData(startDate, endDate) {
    console.log('Loading analytics for:', startDate, 'to', endDate);
    // Implement analytics data loading
    
    // Initialize mini charts
    initializeMiniCharts();
}

// Initialize mini charts for analytics
function initializeMiniCharts() {
    // Engagement mini chart
    const engagementCtx = document.getElementById('engagementMiniChart')?.getContext('2d');
    if (engagementCtx) {
        new Chart(engagementCtx, {
            type: 'line',
            data: {
                labels: ['', '', '', '', '', ''],
                datasets: [{
                    data: [65, 70, 75, 72, 78, 75],
                    borderColor: '#10b981',
                    borderWidth: 2,
                    fill: false,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    x: {
                        display: false
                    },
                    y: {
                        display: false
                    }
                }
            }
        });
    }
}

// Load alumni profiles
function loadAlumniProfiles() {
    const profiles = [
        { name: 'John Doe', batch: '2020', squadron: 'Alpha', location: 'Lagos, Nigeria' },
        { name: 'Jane Smith', batch: '2019', squadron: 'Jaguar', location: 'London, UK' },
        { name: 'Mike Johnson', batch: '2021', squadron: 'Mig', location: 'New York, USA' }
    ];
    
    const profilesGrid = document.getElementById('alumniProfiles');
    if (profilesGrid) {
        profilesGrid.innerHTML = profiles.map(profile => `
            <div class="profile-card">
                <img src="https://via.placeholder.com/100" alt="${profile.name}">
                <h3>${profile.name}</h3>
                <p>Batch: ${profile.batch}</p>
                <p>Squadron: ${profile.squadron}</p>
                <p>Location: ${profile.location}</p>
                <button class="btn btn-primary">View Profile</button>
            </div>
        `).join('');
    }
}

// Load surveys
function loadSurveys() {
    const surveys = [
        { title: 'Career Development Survey', responses: 234, status: 'active' },
        { title: 'Alumni Engagement Survey', responses: 189, status: 'active' },
        { title: 'Event Feedback Survey', responses: 456, status: 'completed' }
    ];
    
    const surveysList = document.getElementById('surveysList');
    if (surveysList) {
        surveysList.innerHTML = surveys.map(survey => `
            <div class="survey-item">
                <h3>${survey.title}</h3>
                <p>Responses: ${survey.responses}</p>
                <span class="status-badge ${survey.status}">${survey.status}</span>
                <button class="btn btn-secondary">View Results</button>
            </div>
        `).join('');
    }
}

// Load recent reports
function loadRecentReports() {
    const reports = [
        { name: 'Monthly Registration Report', date: '2024-01-15', format: 'PDF' },
        { name: 'Alumni Analytics Q4 2023', date: '2024-01-10', format: 'Excel' },
        { name: 'Survey Results Summary', date: '2024-01-05', format: 'CSV' }
    ];
    
    const reportsList = document.getElementById('reportsList');
    if (reportsList) {
        reportsList.innerHTML = reports.map(report => `
            <div class="report-item">
                <i class="fas fa-file-${getFileIcon(report.format)}"></i>
                <div>
                    <h4>${report.name}</h4>
                    <p>Generated: ${report.date}</p>
                </div>
                <button class="btn btn-secondary">Download</button>
            </div>
        `).join('');
    }
}

function getFileIcon(format) {
    const icons = {
        'PDF': 'pdf',
        'Excel': 'excel',
        'CSV': 'csv'
    };
    return icons[format] || 'alt';
}

// Generate report
function generateReport() {
    const reportType = document.getElementById('reportType')?.value;
    const reportFormat = document.getElementById('reportFormat')?.value;
    
    console.log('Generating report:', reportType, 'in format:', reportFormat);
    // Implement report generation
    alert(`Generating ${reportType} in ${reportFormat} format...`);
}

// Load email history
function loadEmailHistory() {
    const emails = [
        { subject: 'Welcome to ExJAM Alumni Network', recipients: 45, date: '2024-01-20', status: 'sent' },
        { subject: 'Conference Registration Open', recipients: 892, date: '2024-01-18', status: 'sent' },
        { subject: 'Survey Invitation', recipients: 234, date: '2024-01-15', status: 'scheduled' }
    ];
    
    const emailHistory = document.getElementById('emailHistory');
    if (emailHistory) {
        emailHistory.innerHTML = emails.map(email => `
            <div class="email-item">
                <h4>${email.subject}</h4>
                <p>Recipients: ${email.recipients}</p>
                <p>Date: ${email.date}</p>
                <span class="status-badge ${email.status}">${email.status}</span>
            </div>
        `).join('');
    }
}

// Send notification email
function sendNotificationEmail() {
    const notificationType = document.getElementById('notificationType')?.value;
    const recipientGroup = document.getElementById('recipientGroup')?.value;
    const subject = document.getElementById('emailSubject')?.value;
    const message = document.getElementById('emailMessage')?.value;
    
    if (!subject || !message) {
        alert('Please fill in all required fields');
        return;
    }
    
    console.log('Sending email:', {
        type: notificationType,
        recipients: recipientGroup,
        subject: subject,
        message: message
    });
    
    alert('Email sent successfully!');
}

// Show settings tab
function showSettingsTab(tab) {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tab}"]`).classList.add('active');
    
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(`${tab}-tab`).classList.add('active');
}

// Export data
function exportData() {
    const data = registrationsData;
    const csv = convertToCSV(data);
    downloadCSV(csv, 'registrations_export.csv');
}

// Convert data to CSV
function convertToCSV(data) {
    const headers = Object.keys(data[0]);
    const csvHeaders = headers.join(',');
    const csvRows = data.map(row => 
        headers.map(header => row[header]).join(',')
    ).join('\n');
    
    return `${csvHeaders}\n${csvRows}`;
}

// Download CSV file
function downloadCSV(csv, filename) {
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
}

// Add CSS animation for spin
const style = document.createElement('style');
style.textContent = `
    @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
    }
    
    .status-badge {
        padding: 0.25rem 0.75rem;
        border-radius: 20px;
        font-size: 0.75rem;
        font-weight: 500;
        text-transform: uppercase;
    }
    
    .status-badge.pending {
        background: #fef3c7;
        color: #92400e;
    }
    
    .status-badge.approved {
        background: #d1fae5;
        color: #065f46;
    }
    
    .status-badge.rejected {
        background: #fee2e2;
        color: #991b1b;
    }
    
    .status-badge.active {
        background: #dbeafe;
        color: #1e40af;
    }
    
    .status-badge.completed {
        background: #e9d5ff;
        color: #6b21a8;
    }
    
    .status-badge.sent {
        background: #d1fae5;
        color: #065f46;
    }
    
    .status-badge.scheduled {
        background: #fed7aa;
        color: #9a3412;
    }
    
    .activity-item {
        display: flex;
        align-items: center;
        gap: 1rem;
        padding: 1rem;
        border-left: 3px solid transparent;
        transition: all 0.3s ease;
    }
    
    .activity-item:hover {
        background: #f8fafc;
        border-left-color: #2563eb;
    }
    
    .activity-icon {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1rem;
    }
    
    .activity-icon.registration {
        background: #dbeafe;
        color: #2563eb;
    }
    
    .activity-icon.survey {
        background: #d1fae5;
        color: #10b981;
    }
    
    .activity-icon.approval {
        background: #fef3c7;
        color: #f59e0b;
    }
    
    .activity-icon.export {
        background: #e9d5ff;
        color: #8b5cf6;
    }
    
    .activity-details {
        flex: 1;
    }
    
    .activity-time {
        display: block;
        font-size: 0.75rem;
        color: #64748b;
        margin-top: 0.25rem;
    }
    
    .profile-card {
        background: white;
        padding: 1.5rem;
        border-radius: 12px;
        text-align: center;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
        transition: all 0.3s ease;
    }
    
    .profile-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
    }
    
    .profile-card img {
        width: 100px;
        height: 100px;
        border-radius: 50%;
        margin-bottom: 1rem;
    }
    
    .profile-card h3 {
        margin-bottom: 0.5rem;
    }
    
    .profile-card p {
        font-size: 0.875rem;
        color: #64748b;
        margin-bottom: 0.5rem;
    }
    
    .survey-item,
    .report-item,
    .email-item {
        background: white;
        padding: 1.5rem;
        border-radius: 12px;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
        margin-bottom: 1rem;
        display: flex;
        align-items: center;
        justify-content: space-between;
    }
    
    .report-item {
        gap: 1rem;
    }
    
    .report-item i {
        font-size: 2rem;
        color: #64748b;
    }
    
    .report-item > div {
        flex: 1;
    }
    
    .email-item h4,
    .survey-item h3,
    .report-item h4 {
        margin-bottom: 0.5rem;
    }
    
    .email-item p,
    .survey-item p,
    .report-item p {
        font-size: 0.875rem;
        color: #64748b;
        margin-bottom: 0.25rem;
    }
`;
document.head.appendChild(style);
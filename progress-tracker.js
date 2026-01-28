/**
 * Progress Tracker - Main functionality
 */
document.addEventListener('DOMContentLoaded', function() {
    // Check if user is logged in
    const currentUser = JSON.parse(localStorage.getItem('rehabUser'));
    if (!currentUser) {
        window.location.href = 'index.html';
        return;
    }

    // Initialize the page
    initProgressPage(currentUser);
});

// Handle direct access to progress page
document.addEventListener('DOMContentLoaded', function() {
    // Check if user is logged in
    const currentUser = JSON.parse(localStorage.getItem('rehabUser'));
    
    if (!currentUser) {
        // Redirect to login page with a message
        alert('Please login to access progress tracking.');
        window.location.href = 'index.html';
        return;
    }
    
    // Check if viewing as therapist or from direct link
    const urlParams = new URLSearchParams(window.location.search);
    const viewingPatient = urlParams.get('view');
    
    if (viewingPatient) {
        // Direct link to view specific patient (for therapists)
        const savedUser = localStorage.getItem('rehabUser');
        if (savedUser) {
            const user = JSON.parse(savedUser);
            if (user.role === 'therapist') {
                // Load specific patient's progress
                loadPatientDashboard(viewingPatient);
                return;
            }
        }
    }
    
    // Normal initialization
    initProgressPage(currentUser);
});


function initProgressPage(currentUser) {
    const isTherapist = currentUser.role === 'therapist';
    
    // Set page title based on role
    document.title = isTherapist 
        ? 'Therapist Dashboard - Progress Tracking'
        : 'My Progress - Rehabilitation Tracker';

    // Show/hide therapist-specific elements
    document.getElementById('therapistControls').style.display = isTherapist ? 'block' : 'none';
    document.getElementById('patientView').style.display = isTherapist ? 'none' : 'block';
    
    // Load initial data
    if (isTherapist) {
        loadTherapistDashboard();
    } else {
        loadPatientDashboard(currentUser.username);
    }

    // Setup event listeners
    setupEventListeners();
}

// ===== PATIENT DASHBOARD =====

function loadPatientDashboard(username) {
    // Load patient info
    const patient = progressStorage.getPatient(username);
    if (patient) {
        document.getElementById('patientName').textContent = patient.name;
        document.getElementById('patientCondition').textContent = patient.condition;
        document.getElementById('patientTherapist').textContent = `Therapist: ${patient.therapist}`;
        document.getElementById('patientSince').textContent = `Patient since: ${patient.joinDate}`;
    }

    // Load statistics
    updatePatientStats(username);
    
    // Load recent sessions
    loadRecentSessions(username);
    
    // Load charts
    renderCharts(username);
    
    // Load exercise list
    populateExerciseFilter(username);
}

function updatePatientStats(username) {
    const stats = progressStorage.getPatientStats(username);
    
    document.getElementById('totalSessions').textContent = stats.totalSessions;
    document.getElementById('totalReps').textContent = stats.totalReps.toLocaleString();
    document.getElementById('totalDuration').textContent = `${stats.totalDuration} mins`;
    document.getElementById('avgAccuracy').textContent = `${stats.avgAccuracy}%`;
    document.getElementById('progressTrend').textContent = `${stats.progressTrend >= 0 ? '+' : ''}${stats.progressTrend}%`;
    document.getElementById('consistency').textContent = `${stats.consistency}/week`;
    document.getElementById('favoriteExercise').textContent = stats.favoriteExercise;
    document.getElementById('lastSession').textContent = stats.lastSessionDate 
        ? new Date(stats.lastSessionDate).toLocaleDateString() 
        : 'No sessions';
    
    // Style progress trend
    const trendElement = document.getElementById('progressTrend');
    trendElement.className = stats.progressTrend > 0 ? 'positive' : 
                            stats.progressTrend < 0 ? 'negative' : 'neutral';
}

function loadRecentSessions(username, limit = 5) {
    const sessions = progressStorage.getPatientSessions(username);
    const container = document.getElementById('recentSessions');
    
    if (sessions.length === 0) {
        container.innerHTML = `
            <div class="no-sessions">
                <p>No exercise sessions recorded yet.</p>
                <button onclick="addSampleData('${username}')" class="btn-sample">
                    Add Sample Data
                </button>
            </div>
        `;
        return;
    }

    const recentSessions = sessions.slice(0, limit);
    let html = '<div class="sessions-list">';
    
    recentSessions.forEach(session => {
        const date = new Date(session.date);
        const accuracyClass = session.accuracy >= 80 ? 'good' : 
                             session.accuracy >= 60 ? 'medium' : 'poor';
        
        html += `
            <div class="session-card">
                <div class="session-header">
                    <span class="session-date">${date.toLocaleDateString()}</span>
                    <span class="session-exercise">${session.exercise}</span>
                    <span class="session-accuracy ${accuracyClass}">${session.accuracy}%</span>
                </div>
                <div class="session-details">
                    <span>${session.reps} reps × ${session.sets} sets</span>
                    <span>${session.duration} mins</span>
                    <span>Pain: ${session.painLevel}/5</span>
                </div>
                <div class="session-feedback">${session.feedback}</div>
            </div>
        `;
    });
    
    html += '</div>';
    
    if (sessions.length > limit) {
        html += `
            <div class="view-all">
                <button onclick="viewAllSessions('${username}')" class="btn-view-all">
                    View All Sessions (${sessions.length})
                </button>
            </div>
        `;
    }
    
    container.innerHTML = html;
}

// ===== THERAPIST DASHBOARD =====

function loadTherapistDashboard() {
    // Load all patients
    const patients = progressStorage.getAllPatients();
    const container = document.getElementById('patientsList');
    
    if (patients.length === 0) {
        container.innerHTML = '<p class="no-data">No patients found.</p>';
        return;
    }

    let html = '<div class="patients-grid">';
    
    patients.forEach(patient => {
        const stats = progressStorage.getPatientStats(patient.username);
        const lastSession = patient.lastSession 
            ? new Date(patient.lastSession).toLocaleDateString() 
            : 'Never';
        
        html += `
            <div class="patient-card" onclick="viewPatientProgress('${patient.username}')">
                <div class="patient-header">
                    <div class="patient-avatar">${patient.name.charAt(0)}</div>
                    <div class="patient-info">
                        <h4>${patient.name}</h4>
                        <p>${patient.condition}</p>
                    </div>
                    <div class="patient-stats">
                        <span class="stat-badge">${stats.totalSessions} sessions</span>
                        <span class="stat-badge accuracy-${stats.avgAccuracy >= 70 ? 'good' : 'medium'}">
                            ${stats.avgAccuracy}% accuracy
                        </span>
                    </div>
                </div>
                <div class="patient-details">
                    <p><strong>Age:</strong> ${patient.age}</p>
                    <p><strong>Last Session:</strong> ${lastSession}</p>
                    <p><strong>Phone:</strong> ${patient.phone || 'N/A'}</p>
                    <p class="patient-notes">${patient.notes || 'No notes'}</p>
                </div>
                <button class="btn-view-details" onclick="event.stopPropagation(); viewPatientProgress('${patient.username}')">
                    View Progress
                </button>
            </div>
        `;
    });
    
    html += '</div>';
    container.innerHTML = html;
}

// ===== CHARTS =====

let accuracyChart = null;
let repsChart = null;
let painChart = null;

function renderCharts(username) {
    const chartData = progressStorage.getChartData(username);
    
    // Accuracy Chart
    const accuracyCtx = document.getElementById('accuracyChart').getContext('2d');
    if (accuracyChart) accuracyChart.destroy();
    
    if (chartData.labels.length > 0) {
        accuracyChart = new Chart(accuracyCtx, {
            type: 'line',
            data: {
                labels: chartData.labels,
                datasets: [{
                    label: 'Accuracy (%)',
                    data: chartData.accuracy,
                    borderColor: '#6a11cb',
                    backgroundColor: 'rgba(106, 17, 203, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: 'Exercise Accuracy Over Time'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: false,
                        min: 50,
                        max: 100,
                        title: {
                            display: true,
                            text: 'Accuracy (%)'
                        }
                    }
                }
            }
        });
    }

    // Reps Chart
    const repsCtx = document.getElementById('repsChart').getContext('2d');
    if (repsChart) repsChart.destroy();
    
    if (chartData.labels.length > 0) {
        repsChart = new Chart(repsCtx, {
            type: 'bar',
            data: {
                labels: chartData.labels,
                datasets: [{
                    label: 'Repetitions',
                    data: chartData.reps,
                    backgroundColor: '#2575fc',
                    borderColor: '#1a68ea',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: 'Repetitions Per Session'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Number of Reps'
                        }
                    }
                }
            }
        });
    }

    // Pain Level Chart
    const painCtx = document.getElementById('painChart').getContext('2d');
    if (painChart) painChart.destroy();
    
    if (chartData.labels.length > 0) {
        painChart = new Chart(painCtx, {
            type: 'line',
            data: {
                labels: chartData.labels,
                datasets: [{
                    label: 'Pain Level (1-5)',
                    data: chartData.painLevel,
                    borderColor: '#ff4757',
                    backgroundColor: 'rgba(255, 71, 87, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: 'Pain Level Tracking'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 5,
                        reverse: true, // Lower pain at top
                        title: {
                            display: true,
                            text: 'Pain Level (5 = worst)'
                        }
                    }
                }
            }
        });
    }
}

// ===== EXERCISE FILTER =====

function populateExerciseFilter(username) {
    const sessions = progressStorage.getPatientSessions(username);
    const exercises = [...new Set(sessions.map(s => s.exercise))];
    const filter = document.getElementById('exerciseFilter');
    
    filter.innerHTML = '<option value="">All Exercises</option>';
    
    exercises.forEach(exercise => {
        const option = document.createElement('option');
        option.value = exercise;
        option.textContent = exercise;
        filter.appendChild(option);
    });
    
    filter.onchange = () => {
        const selectedExercise = filter.value;
        const currentUser = JSON.parse(localStorage.getItem('rehabUser'));
        const chartData = progressStorage.getChartData(currentUser.username, selectedExercise || null);
        updateChartsWithData(chartData);
    };
}

function updateChartsWithData(chartData) {
    if (accuracyChart && chartData.labels.length > 0) {
        accuracyChart.data.labels = chartData.labels;
        accuracyChart.data.datasets[0].data = chartData.accuracy;
        accuracyChart.update();
    }
    
    if (repsChart && chartData.labels.length > 0) {
        repsChart.data.labels = chartData.labels;
        repsChart.data.datasets[0].data = chartData.reps;
        repsChart.update();
    }
    
    if (painChart && chartData.labels.length > 0) {
        painChart.data.labels = chartData.labels;
        painChart.data.datasets[0].data = chartData.painLevel;
        painChart.update();
    }
}

// ===== DATA MANAGEMENT =====

function exportData() {
    if (progressStorage.exportToJSON()) {
        showNotification('Data exported successfully!', 'success');
    } else {
        showNotification('Export failed. Please try again.', 'error');
    }
}

function importData(file) {
    if (!file) return;
    
    if (!confirm('Importing will replace all current data. Continue?')) {
        return;
    }
    
    progressStorage.importFromJSON(file)
        .then(() => {
            showNotification('Data imported successfully!', 'success');
            // Reload page to show new data
            setTimeout(() => location.reload(), 1000);
        })
        .catch(error => {
            showNotification(`Import failed: ${error.message}`, 'error');
        });
}

function addSampleData(username) {
    const count = progressStorage.addSampleData(username);
    showNotification(`${count} sample sessions added!`, 'success');
    
    // Reload dashboard
    const currentUser = JSON.parse(localStorage.getItem('rehabUser'));
    if (currentUser.role === 'therapist') {
        loadTherapistDashboard();
    } else {
        loadPatientDashboard(username);
    }
}

function clearAllData() {
    if (!confirm('⚠️ This will delete ALL progress data! Are you sure?')) {
        return;
    }
    
    if (confirm('This action cannot be undone. Type "DELETE" to confirm.')) {
        progressStorage.clearAllData();
        showNotification('All data cleared successfully.', 'success');
        setTimeout(() => location.reload(), 1500);
    }
}

// ===== NAVIGATION =====

function viewPatientProgress(username) {
    // Store selected patient in session storage
    sessionStorage.setItem('viewingPatient', username);
    
    // Open patient progress in new tab or redirect
    window.open('progress.html?view=' + username, '_blank');
}

function viewAllSessions(username) {
    // Show all sessions modal
    const sessions = progressStorage.getPatientSessions(username);
    
    let html = '<div class="all-sessions-modal">';
    html += '<h3>All Exercise Sessions</h3>';
    html += '<div class="sessions-table-container">';
    html += '<table><thead><tr><th>Date</th><th>Exercise</th><th>Duration</th><th>Reps</th><th>Accuracy</th><th>Feedback</th></tr></thead><tbody>';
    
    sessions.forEach(session => {
        const accuracyClass = session.accuracy >= 80 ? 'good' : 
                             session.accuracy >= 60 ? 'medium' : 'poor';
        
        html += `
            <tr>
                <td>${new Date(session.date).toLocaleDateString()}</td>
                <td>${session.exercise}</td>
                <td>${session.duration}m</td>
                <td>${session.reps}</td>
                <td class="${accuracyClass}">${session.accuracy}%</td>
                <td>${session.feedback}</td>
            </tr>
        `;
    });
    
    html += '</tbody></table></div></div>';
    
    // Create modal
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>All Sessions for ${username}</h3>
                <button onclick="this.closest('.modal-overlay').remove()" class="modal-close">&times;</button>
            </div>
            <div class="modal-body">
                ${html}
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

// ===== UTILITY FUNCTIONS =====

function setupEventListeners() {
    // Export button
    document.getElementById('exportBtn').addEventListener('click', exportData);
    
    // Import button
    document.getElementById('importFile').addEventListener('change', function(e) {
        if (e.target.files[0]) {
            importData(e.target.files[0]);
        }
    });
    
    // Add sample data button
    const sampleBtn = document.getElementById('addSampleBtn');
    if (sampleBtn) {
        sampleBtn.addEventListener('click', function() {
            const currentUser = JSON.parse(localStorage.getItem('rehabUser'));
            addSampleData(currentUser.username);
        });
    }
    
    // Clear data button (for therapist)
    const clearBtn = document.getElementById('clearDataBtn');
    if (clearBtn) {
        clearBtn.addEventListener('click', clearAllData);
    }
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Show notification
    setTimeout(() => notification.classList.add('show'), 10);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

function goBack() {
    const currentUser = JSON.parse(localStorage.getItem('rehabUser'));
    if (currentUser.role === 'therapist') {
        window.location.href = 'training.html';
    } else {
        window.location.href = 'patient.html';
    }
}

function logout() {
    localStorage.removeItem('rehabUser');
    window.location.href = 'index.html';
}

// Make functions available globally
window.viewPatientProgress = viewPatientProgress;
window.viewAllSessions = viewAllSessions;
window.addSampleData = addSampleData;
window.exportData = exportData;
window.importData = importData;
window.goBack = goBack;
window.logout = logout;
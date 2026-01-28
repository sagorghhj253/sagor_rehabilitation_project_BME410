// Training Mode JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const patientSearch = document.getElementById('patientSearch');
    const addPatientBtn = document.getElementById('addPatientBtn');
    const patientList = document.getElementById('patientList');
    const profileSection = document.getElementById('profileSection');
    const emptyState = document.getElementById('emptyState');
    const patientModal = document.getElementById('patientModal');
    const exerciseModal = document.getElementById('exerciseModal');
    const patientForm = document.getElementById('patientForm');
    const exerciseForm = document.getElementById('exerciseForm');
    const cancelModal = document.getElementById('cancelModal');
    const cancelExerciseModal = document.getElementById('cancelExerciseModal');
    const addExerciseBtn = document.getElementById('addExerciseBtn');
    const startSessionBtn = document.getElementById('startSessionBtn');
    const tabBtns = document.querySelectorAll('.tab-btn');
    const quickAddPatient = document.getElementById('quickAddPatient');
    const exerciseProgram = document.getElementById('exerciseProgram');
    
    // State Management
    let patients = JSON.parse(localStorage.getItem('rehab_patients')) || [];
    let selectedPatientId = null;
    let progressChart = null;

    // Initialize
    init();
    
    function init() {
        loadPatients();
        setupEventListeners();
        updateStats();
    }
    
    function loadPatients() {
        patientList.innerHTML = '';
        
        if (patients.length === 0) {
            patientList.innerHTML = '<p class="no-patients">No patients added yet</p>';
            return;
        }
        
        patients.forEach(patient => {
            const patientItem = document.createElement('div');
            patientItem.className = 'patient-item';
            patientItem.dataset.id = patient.id;
            
            const lastSession = patient.sessions && patient.sessions.length > 0 
                ? new Date(patient.sessions[patient.sessions.length - 1].date).toLocaleDateString()
                : 'No sessions';
            
            patientItem.innerHTML = `
                <div class="patient-name">${patient.name}</div>
                <div class="patient-info">
                    <span>${patient.condition || 'General rehab'}</span>
                    <span>Last: ${lastSession}</span>
                </div>
            `;
            
            patientItem.addEventListener('click', () => selectPatient(patient.id));
            patientList.appendChild(patientItem);
        });
    }
    
    function selectPatient(patientId) {
        selectedPatientId = patientId;
        
        // Update UI state
        document.querySelectorAll('.patient-item').forEach(item => {
            item.classList.remove('active');
            if (item.dataset.id === patientId) {
                item.classList.add('active');
            }
        });
        
        // Show profile section
        profileSection.style.display = 'block';
        emptyState.style.display = 'none';
        
        // Load patient data
        const patient = patients.find(p => p.id === patientId);
        if (patient) {
            loadPatientData(patient);
        }
    }
    
    function loadPatientData(patient) {
        // Basic Info
        document.getElementById('patientName').textContent = patient.name;
        document.getElementById('patientAge').textContent = patient.age || '-';
        document.getElementById('patientGender').textContent = patient.gender || '-';
        document.getElementById('patientCondition').textContent = patient.condition || '-';
        document.getElementById('assignedTherapist').textContent = patient.therapist || 'Unassigned';
        
        // Goals
        const goalsContainer = document.getElementById('patientGoals');
        if (patient.goals && patient.goals.length > 0) {
            goalsContainer.innerHTML = patient.goals.map(goal => 
                `<div class="goal-item">✓ ${goal}</div>`
            ).join('');
        } else {
            goalsContainer.innerHTML = '<p>No goals set</p>';
        }
        
        // Recent Sessions
        const sessionsContainer = document.getElementById('recentSessions');
        if (patient.sessions && patient.sessions.length > 0) {
            const recentSessions = patient.sessions.slice(-3).reverse();
            sessionsContainer.innerHTML = recentSessions.map(session => `
                <div class="session-item">
                    <div>${new Date(session.date).toLocaleDateString()}</div>
                    <div>${session.exercise} - ${session.reps} reps</div>
                    <div>Form: ${session.formScore}%</div>
                </div>
            `).join('');
        } else {
            sessionsContainer.innerHTML = '<p>No sessions recorded yet</p>';
        }
        
        // Exercise Program
        loadExerciseProgram(patient);
        
        // Progress Chart
        renderProgressChart(patient);
        
        // Notes
        loadNotes(patient);
    }
    
    function loadExerciseProgram(patient) {
        exerciseProgram.innerHTML = '';
        
        if (!patient.exercises || patient.exercises.length === 0) {
            exerciseProgram.innerHTML = `
                <div class="empty-program">
                    <p>No exercises in program yet. Add exercises to create a custom program.</p>
                </div>
            `;
            return;
        }
        
        patient.exercises.forEach((exercise, index) => {
            const exerciseItem = document.createElement('div');
            exerciseItem.className = 'exercise-item';
            exerciseItem.innerHTML = `
                <div class="exercise-info">
                    <h4>${getExerciseName(exercise.type)}</h4>
                    <div class="exercise-details">
                        <span>${exercise.sets} sets × ${exercise.reps} reps</span>
                        <span>${exercise.frequency || 3}× per week</span>
                    </div>
                    ${exercise.instructions ? `<p class="exercise-instructions">${exercise.instructions}</p>` : ''}
                </div>
                <div class="exercise-actions">
                    <button class="btn-small edit-exercise" data-index="${index}">Edit</button>
                    <button class="btn-small delete-exercise" data-index="${index}">Delete</button>
                </div>
            `;
            exerciseProgram.appendChild(exerciseItem);
        });
        
        // Add event listeners for exercise actions
        document.querySelectorAll('.edit-exercise').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = e.target.dataset.index;
                editExercise(index);
            });
        });
        
        document.querySelectorAll('.delete-exercise').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = e.target.dataset.index;
                deleteExercise(index);
            });
        });
    }
    
    function getExerciseName(type) {
        const exerciseNames = {
            'neck_flexion': 'Neck Flexion & Extension',
            'neck_rotation': 'Neck Rotation',
            'shoulder_abduction': 'Shoulder Abduction',
            'shoulder_flexion': 'Shoulder Flexion',
            'elbow_flexion': 'Elbow Flexion & Extension',
            'wrist_flexion': 'Wrist Flexion & Extension',
            'finger_flexion': 'Finger Squeeze & Open',
            'squat': 'Squat'
        };
        return exerciseNames[type] || type;
    }
    
    function renderProgressChart(patient) {
        const ctx = document.getElementById('progressChart').getContext('2d');
        
        if (progressChart) {
            progressChart.destroy();
        }
        
        if (!patient.sessions || patient.sessions.length === 0) {
            ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
            ctx.font = '16px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('No session data available', ctx.canvas.width / 2, ctx.canvas.height / 2);
            return;
        }
        
        const sessions = patient.sessions.slice(-10); // Last 10 sessions
        const labels = sessions.map(s => new Date(s.date).toLocaleDateString());
        const formScores = sessions.map(s => s.formScore);
        
        // Update progress stats
        document.getElementById('bestFormScore').textContent = 
            `${Math.max(...formScores)}%`;
        document.getElementById('avgDuration').textContent = 
            sessions.length > 0 ? `${Math.round(sessions.reduce((a, b) => a + (b.duration || 0), 0) / sessions.length)}s` : '-';
        document.getElementById('totalExercises').textContent = 
            sessions.reduce((a, b) => a + (b.reps || 0), 0);
        document.getElementById('consistencyRate').textContent = 
            sessions.length > 0 ? `${Math.round((sessions.length / 7) * 100)}%` : '0%';
        
        progressChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Form Score (%)',
                    data: formScores,
                    borderColor: '#4facfe',
                    backgroundColor: 'rgba(79, 172, 254, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: {
                            color: 'white'
                        }
                    }
                },
                scales: {
                    x: {
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        },
                        ticks: {
                            color: 'white'
                        }
                    },
                    y: {
                        min: 0,
                        max: 100,
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        },
                        ticks: {
                            color: 'white'
                        }
                    }
                }
            }
        });
    }
    
    function loadNotes(patient) {
        const notesList = document.getElementById('notesList');
        
        if (!patient.notes || patient.notes.length === 0) {
            notesList.innerHTML = '<p class="no-notes">No clinical notes recorded</p>';
            return;
        }
        
        notesList.innerHTML = patient.notes.map(note => `
            <div class="note-item">
                <div class="note-header">
                    <strong>${note.title}</strong>
                    <span class="note-date">${new Date(note.date).toLocaleDateString()}</span>
                </div>
                <div class="note-content">${note.content}</div>
            </div>
        `).join('');
    }
    
    function setupEventListeners() {
        // Patient Search
        patientSearch.addEventListener('input', function() {
            const searchTerm = this.value.toLowerCase();
            const patientItems = document.querySelectorAll('.patient-item');
            
            patientItems.forEach(item => {
                const name = item.querySelector('.patient-name').textContent.toLowerCase();
                const condition = item.querySelector('.patient-info span:first-child').textContent.toLowerCase();
                
                if (name.includes(searchTerm) || condition.includes(searchTerm)) {
                    item.style.display = 'block';
                } else {
                    item.style.display = 'none';
                }
            });
        });
        
        // Add Patient Button
        addPatientBtn.addEventListener('click', () => {
            document.getElementById('modalTitle').textContent = 'Add New Patient';
            patientForm.reset();
            patientModal.classList.add('active');
        });
        
        quickAddPatient.addEventListener('click', () => {
            document.getElementById('modalTitle').textContent = 'Add New Patient';
            patientForm.reset();
            patientModal.classList.add('active');
        });
        
        // Patient Form Submission
        patientForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const patientData = {
                id: 'patient_' + Date.now(),
                name: document.getElementById('modalName').value,
                age: document.getElementById('modalAge').value,
                gender: document.getElementById('modalGender').value,
                condition: document.getElementById('modalCondition').value,
                therapist: document.getElementById('modalTherapist').value,
                goals: document.getElementById('modalGoals').value ? 
                    document.getElementById('modalGoals').value.split('\n').filter(g => g.trim()) : [],
                exercises: [],
                sessions: [],
                notes: [],
                createdAt: new Date().toISOString()
            };
            
            patients.push(patientData);
            savePatients();
            loadPatients();
            selectPatient(patientData.id);
            patientModal.classList.remove('active');
            
            // Show confirmation
            showNotification(`Patient "${patientData.name}" added successfully!`);
        });
        
        // Cancel Modal
        cancelModal.addEventListener('click', () => {
            patientModal.classList.remove('active');
        });
        
        // Add Exercise Button
        addExerciseBtn.addEventListener('click', () => {
            if (!selectedPatientId) {
                showNotification('Please select a patient first', 'warning');
                return;
            }
            
            exerciseForm.reset();
            exerciseModal.classList.add('active');
        });
        
        // Exercise Form Submission
        exerciseForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const patientIndex = patients.findIndex(p => p.id === selectedPatientId);
            if (patientIndex === -1) return;
            
            const exerciseData = {
                type: document.getElementById('exerciseType').value,
                sets: parseInt(document.getElementById('exerciseSets').value),
                reps: parseInt(document.getElementById('exerciseReps').value),
                frequency: parseInt(document.getElementById('exerciseFrequency').value) || 3,
                instructions: document.getElementById('exerciseInstructions').value,
                addedAt: new Date().toISOString()
            };
            
            if (!patients[patientIndex].exercises) {
                patients[patientIndex].exercises = [];
            }
            
            patients[patientIndex].exercises.push(exerciseData);
            savePatients();
            loadExerciseProgram(patients[patientIndex]);
            exerciseModal.classList.remove('active');
            
            showNotification('Exercise added to program!');
        });
        
        // Cancel Exercise Modal
        cancelExerciseModal.addEventListener('click', () => {
            exerciseModal.classList.remove('active');
        });
        
        // Tab Switching
        tabBtns.forEach(btn => {
            btn.addEventListener('click', function() {
                const tabName = this.dataset.tab;
                
                // Update active tab button
                tabBtns.forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                
                // Show corresponding tab content
                document.querySelectorAll('.tab-pane').forEach(pane => {
                    pane.classList.remove('active');
                });
                document.getElementById(`${tabName}Tab`).classList.add('active');
            });
        });
        
        // Start Session Button
        startSessionBtn.addEventListener('click', () => {
            if (!selectedPatientId) return;
            
            const patient = patients.find(p => p.id === selectedPatientId);
            if (patient && patient.exercises && patient.exercises.length > 0) {
                // Store patient ID for the session
                localStorage.setItem('session_patient_id', selectedPatientId);
                localStorage.setItem('session_patient_name', patient.name);
                
                // Redirect to patient mode with this patient's exercises
                window.location.href = 'patient.html?mode=training';
            } else {
                showNotification('Please add exercises to this patient\'s program first', 'warning');
            }
        });
        
        // Library Exercise Buttons
        document.querySelectorAll('.lib-exercise').forEach(btn => {
            btn.addEventListener('click', function() {
                if (!selectedPatientId) {
                    showNotification('Select a patient first', 'warning');
                    return;
                }
                
                const exerciseType = this.dataset.exercise;
                
                // Pre-fill the exercise form
                document.getElementById('exerciseType').value = exerciseType;
                exerciseModal.classList.add('active');
            });
        });
        
        // Close modals when clicking outside
        window.addEventListener('click', (e) => {
            if (e.target === patientModal) {
                patientModal.classList.remove('active');
            }
            if (e.target === exerciseModal) {
                exerciseModal.classList.remove('active');
            }
        });
    }
    
    function editExercise(index) {
        const patient = patients.find(p => p.id === selectedPatientId);
        if (!patient || !patient.exercises || !patient.exercises[index]) return;
        
        const exercise = patient.exercises[index];
        
        // Pre-fill form
        document.getElementById('exerciseType').value = exercise.type;
        document.getElementById('exerciseSets').value = exercise.sets;
        document.getElementById('exerciseReps').value = exercise.reps;
        document.getElementById('exerciseFrequency').value = exercise.frequency || 3;
        document.getElementById('exerciseInstructions').value = exercise.instructions || '';
        
        // Show modal
        exerciseModal.classList.add('active');
        
        // Update form submission to handle edit
        const form = document.getElementById('exerciseForm');
        const originalSubmit = form.onsubmit;
        
        form.onsubmit = function(e) {
            e.preventDefault();
            
            // Update exercise
            exercise.type = document.getElementById('exerciseType').value;
            exercise.sets = parseInt(document.getElementById('exerciseSets').value);
            exercise.reps = parseInt(document.getElementById('exerciseReps').value);
            exercise.frequency = parseInt(document.getElementById('exerciseFrequency').value) || 3;
            exercise.instructions = document.getElementById('exerciseInstructions').value;
            
            savePatients();
            loadExerciseProgram(patient);
            exerciseModal.classList.remove('active');
            
            // Restore original submit handler
            form.onsubmit = originalSubmit;
            
            showNotification('Exercise updated!');
        };
    }
    
    function deleteExercise(index) {
        if (!confirm('Are you sure you want to remove this exercise from the program?')) return;
        
        const patient = patients.find(p => p.id === selectedPatientId);
        if (patient && patient.exercises) {
            patient.exercises.splice(index, 1);
            savePatients();
            loadExerciseProgram(patient);
            showNotification('Exercise removed');
        }
    }
    
    function savePatients() {
        localStorage.setItem('rehab_patients', JSON.stringify(patients));
        updateStats();
    }
    
    function updateStats() {
        document.getElementById('totalPatients').textContent = patients.length;
        
        // Calculate active sessions (simulated)
        const activeSessionCount = Math.min(patients.length, 3);
        document.getElementById('activeSessions').textContent = activeSessionCount;
        
        // Calculate average progress (simulated)
        let totalProgress = 0;
        patients.forEach(patient => {
            if (patient.sessions && patient.sessions.length > 0) {
                const lastSession = patient.sessions[patient.sessions.length - 1];
                totalProgress += lastSession.formScore || 0;
            }
        });
        
        const avgProgress = patients.length > 0 ? Math.round(totalProgress / patients.length) : 0;
        document.getElementById('avgProgress').textContent = `${avgProgress}%`;
        
        // Update active sessions list
        updateActiveSessionsList();
    }
    
    function updateActiveSessionsList() {
        const activeSessionsList = document.getElementById('activeSessionsList');
        
        // Simulate active sessions from the last 3 patients
        const recentPatients = patients.slice(-3);
        
        if (recentPatients.length === 0) {
            activeSessionsList.innerHTML = '<p class="no-sessions">No active sessions</p>';
            return;
        }
        
        activeSessionsList.innerHTML = recentPatients.map(patient => `
            <div class="active-session">
                <div class="session-patient">${patient.name}</div>
                <div class="session-exercise">
                    ${patient.exercises && patient.exercises.length > 0 
                        ? getExerciseName(patient.exercises[0].type) 
                        : 'No exercises'}
                </div>
                <div class="session-progress">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${Math.min(100, Math.random() * 100)}%"></div>
                    </div>
                    <span>${Math.round(Math.random() * 100)}%</span>
                </div>
            </div>
        `).join('');
    }
    
    function showNotification(message, type = 'success') {
        // Remove existing notification
        const existingNotification = document.querySelector('.notification');
        if (existingNotification) {
            existingNotification.remove();
        }
        
        // Create notification
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        // Style notification
        notification.style.position = 'fixed';
        notification.style.top = '20px';
        notification.style.right = '20px';
        notification.style.padding = '15px 25px';
        notification.style.background = type === 'success' ? '#43e97b' : '#fa709a';
        notification.style.color = 'white';
        notification.style.borderRadius = '10px';
        notification.style.zIndex = '3000';
        notification.style.boxShadow = '0 5px 15px rgba(0, 0, 0, 0.3)';
        
        document.body.appendChild(notification);
        
        // Auto-remove after 3 seconds
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
    
    // Add Goal Button
    document.getElementById('addGoalBtn').addEventListener('click', function() {
        const goal = prompt('Enter new goal for this patient:');
        if (goal && selectedPatientId) {
            const patient = patients.find(p => p.id === selectedPatientId);
            if (patient) {
                if (!patient.goals) patient.goals = [];
                patient.goals.push(goal);
                savePatients();
                loadPatientData(patient);
                showNotification('Goal added!');
            }
        }
    });
    
    // Add Note Button
    document.getElementById('addNoteBtn').addEventListener('click', function() {
        if (!selectedPatientId) {
            showNotification('Please select a patient first', 'warning');
            return;
        }
        
        const title = prompt('Enter note title:');
        if (!title) return;
        
        const content = prompt('Enter note content:');
        if (!content) return;
        
        const patient = patients.find(p => p.id === selectedPatientId);
        if (patient) {
            if (!patient.notes) patient.notes = [];
            patient.notes.push({
                title: title,
                content: content,
                date: new Date().toISOString()
            });
            savePatients();
            loadNotes(patient);
            showNotification('Note added!');
        }
    });
    
    // Edit Profile Button
    document.getElementById('editProfileBtn').addEventListener('click', function() {
        if (!selectedPatientId) return;
        
        const patient = patients.find(p => p.id === selectedPatientId);
        if (!patient) return;
        
        // Pre-fill form with patient data
        document.getElementById('modalTitle').textContent = 'Edit Patient Profile';
        document.getElementById('modalName').value = patient.name;
        document.getElementById('modalAge').value = patient.age || '';
        document.getElementById('modalGender').value = patient.gender || '';
        document.getElementById('modalCondition').value = patient.condition || '';
        document.getElementById('modalTherapist').value = patient.therapist || '';
        document.getElementById('modalGoals').value = patient.goals ? patient.goals.join('\n') : '';
        
        // Show modal with custom submit handler
        patientModal.classList.add('active');
        
        const form = document.getElementById('patientForm');
        const originalSubmit = form.onsubmit;
        
        form.onsubmit = function(e) {
            e.preventDefault();
            
            // Update patient data
            patient.name = document.getElementById('modalName').value;
            patient.age = document.getElementById('modalAge').value;
            patient.gender = document.getElementById('modalGender').value;
            patient.condition = document.getElementById('modalCondition').value;
            patient.therapist = document.getElementById('modalTherapist').value;
            patient.goals = document.getElementById('modalGoals').value ? 
                document.getElementById('modalGoals').value.split('\n').filter(g => g.trim()) : [];
            
            savePatients();
            loadPatients();
            loadPatientData(patient);
            patientModal.classList.remove('active');
            
            // Restore original submit handler
            form.onsubmit = originalSubmit;
            
            showNotification('Profile updated successfully!');
        };
    });
});
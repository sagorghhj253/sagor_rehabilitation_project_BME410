/**
 * Simplified Progress Storage Manager
 * Uses localStorage only - no Excel files needed
 */
class ProgressStorage {
    constructor() {
        this.STORAGE_KEY = 'rehab_progress_data_v2';
        this.data = this.loadData();
    }

    // Load data from localStorage
    loadData() {
        try {
            const saved = localStorage.getItem(this.STORAGE_KEY);
            if (saved) {
                return JSON.parse(saved);
            }
        } catch (e) {
            console.error("Error loading data:", e);
        }
        
        // Return default structure if no data exists
        return this.getDefaultData();
    }

    // Default data structure
    getDefaultData() {
        return {
            patients: {
                rubi: {
                    username: "rubi",
                    name: "Rubi Rahman",
                    age: 45,
                    condition: "Post Shoulder Surgery",
                    therapist: "Dr. Ahmed",
                    joinDate: "2024-01-15",
                    lastSession: "2024-03-10",
                    phone: "01712345678",
                    notes: "Needs gentle exercises"
                },
                maliha: {
                    username: "maliha",
                    name: "Maliha Khan",
                    age: 32,
                    condition: "Knee Rehabilitation",
                    therapist: "Dr. Fatima",
                    joinDate: "2024-02-10",
                    lastSession: "2024-03-08",
                    phone: "01787654321",
                    notes: "Good progress with leg exercises"
                },
                sagor: {
                    username: "sagor",
                    name: "Sagor Das",
                    age: 50,
                    condition: "Lower Back Pain",
                    therapist: "Dr. Rahman",
                    joinDate: "2024-01-20",
                    lastSession: "2024-03-05",
                    phone: "01811223344",
                    notes: "Avoid heavy lifting"
                }
            },
            sessions: [
                // Sample sessions for demonstration
                {
                    id: "1",
                    username: "rubi",
                    exercise: "Shoulder Rotations",
                    date: "2024-03-01",
                    duration: 15,
                    reps: 20,
                    sets: 3,
                    accuracy: 85,
                    feedback: "Good form, keep elbows straight",
                    painLevel: 2,
                    difficulty: "Medium",
                    notes: "Completed all sets"
                },
                {
                    id: "2",
                    username: "rubi",
                    exercise: "Arm Raises",
                    date: "2024-03-03",
                    duration: 20,
                    reps: 15,
                    sets: 3,
                    accuracy: 90,
                    feedback: "Excellent range of motion",
                    painLevel: 1,
                    difficulty: "Easy",
                    notes: "Pain reduced from last session"
                },
                {
                    id: "3",
                    username: "maliha",
                    exercise: "Leg Lifts",
                    date: "2024-03-02",
                    duration: 25,
                    reps: 12,
                    sets: 4,
                    accuracy: 78,
                    feedback: "Knee slightly bent, needs correction",
                    painLevel: 3,
                    difficulty: "Hard",
                    notes: "Use support next time"
                },
                {
                    id: "4",
                    username: "sagor",
                    exercise: "Back Extensions",
                    date: "2024-03-01",
                    duration: 18,
                    reps: 10,
                    sets: 3,
                    accuracy: 82,
                    feedback: "Good posture maintained",
                    painLevel: 2,
                    difficulty: "Medium",
                    notes: "Feeling improvement"
                },
                {
                    id: "5",
                    username: "rubi",
                    exercise: "Shoulder Press",
                    date: "2024-03-10",
                    duration: 22,
                    reps: 18,
                    sets: 3,
                    accuracy: 92,
                    feedback: "Best session so far!",
                    painLevel: 1,
                    difficulty: "Medium",
                    notes: "Can increase weight slightly"
                }
            ],
            exercises: [
                "Shoulder Rotations",
                "Arm Raises", 
                "Leg Lifts",
                "Back Extensions",
                "Shoulder Press",
                "Knee Bends",
                "Neck Stretches",
                "Walking",
                "Squats",
                "Arm Curls"
            ],
            lastUpdated: new Date().toISOString()
        };
    }

    // Save data to localStorage
    saveData() {
        try {
            this.data.lastUpdated = new Date().toISOString();
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.data));
            return true;
        } catch (e) {
            console.error("Error saving data:", e);
            return false;
        }
    }

    // ===== PATIENT MANAGEMENT =====
    
    // Get all patients
    getAllPatients() {
        return Object.values(this.data.patients);
    }

    // Get specific patient
    getPatient(username) {
        return this.data.patients[username];
    }

    // Add new patient (for therapist)
    addPatient(patientData) {
        const username = patientData.username;
        if (!this.data.patients[username]) {
            this.data.patients[username] = {
                ...patientData,
                joinDate: new Date().toISOString().split('T')[0],
                lastSession: null
            };
            this.saveData();
            return true;
        }
        return false;
    }

    // Update patient info
    updatePatient(username, updates) {
        if (this.data.patients[username]) {
            this.data.patients[username] = {
                ...this.data.patients[username],
                ...updates
            };
            this.saveData();
            return true;
        }
        return false;
    }

    // ===== SESSION MANAGEMENT =====

    // Add new exercise session
    addSession(sessionData) {
        const session = {
            id: Date.now().toString(),
            timestamp: new Date().toISOString(),
            ...sessionData
        };

        this.data.sessions.push(session);
        
        // Update patient's last session date
        if (this.data.patients[sessionData.username]) {
            this.data.patients[sessionData.username].lastSession = sessionData.date;
        }

        this.saveData();
        return session.id;
    }

    // Get sessions for a specific patient
    getPatientSessions(username) {
        return this.data.sessions
            .filter(session => session.username === username)
            .sort((a, b) => new Date(b.date) - new Date(a.date)); // Newest first
    }

    // Get all sessions (for therapist)
    getAllSessions() {
        return this.data.sessions.sort((a, b) => new Date(b.date) - new Date(a.date));
    }

    // Delete a session
    deleteSession(sessionId) {
        const initialLength = this.data.sessions.length;
        this.data.sessions = this.data.sessions.filter(session => session.id !== sessionId);
        if (this.data.sessions.length !== initialLength) {
            this.saveData();
            return true;
        }
        return false;
    }

    // ===== PROGRESS ANALYTICS =====

    // Get patient statistics
    getPatientStats(username) {
        const sessions = this.getPatientSessions(username);
        if (sessions.length === 0) {
            return {
                totalSessions: 0,
                totalReps: 0,
                totalDuration: 0,
                avgAccuracy: 0,
                avgPainLevel: 0,
                exercisesCount: 0,
                progressTrend: 0,
                lastSessionDate: null,
                consistency: 0
            };
        }

        const totalSessions = sessions.length;
        const totalReps = sessions.reduce((sum, s) => sum + (s.reps || 0), 0);
        const totalDuration = sessions.reduce((sum, s) => sum + (s.duration || 0), 0);
        const avgAccuracy = sessions.reduce((sum, s) => sum + (s.accuracy || 0), 0) / totalSessions;
        const avgPainLevel = sessions.reduce((sum, s) => sum + (s.painLevel || 0), 0) / totalSessions;
        
        const uniqueExercises = [...new Set(sessions.map(s => s.exercise))];
        
        // Calculate progress trend (last 5 sessions accuracy change)
        const recentSessions = sessions.slice(0, 5).reverse(); // Get oldest to newest of last 5
        let progressTrend = 0;
        if (recentSessions.length >= 2) {
            const firstAccuracy = recentSessions[0].accuracy || 0;
            const lastAccuracy = recentSessions[recentSessions.length - 1].accuracy || 0;
            progressTrend = firstAccuracy > 0 ? ((lastAccuracy - firstAccuracy) / firstAccuracy * 100) : 0;
        }

        // Calculate consistency (sessions per week)
        const firstSession = new Date(sessions[sessions.length - 1].date);
        const lastSession = new Date(sessions[0].date);
        const weeks = Math.max(1, (lastSession - firstSession) / (1000 * 60 * 60 * 24 * 7));
        const consistency = totalSessions / weeks;

        return {
            totalSessions,
            totalReps,
            totalDuration: Math.round(totalDuration),
            avgAccuracy: Math.round(avgAccuracy * 10) / 10,
            avgPainLevel: Math.round(avgPainLevel * 10) / 10,
            exercisesCount: uniqueExercises.length,
            progressTrend: Math.round(progressTrend * 10) / 10,
            lastSessionDate: sessions[0].date,
            consistency: Math.round(consistency * 10) / 10,
            favoriteExercise: this.getFavoriteExercise(username)
        };
    }

    // Get favorite/most frequent exercise
    getFavoriteExercise(username) {
        const sessions = this.getPatientSessions(username);
        if (sessions.length === 0) return "None";
        
        const exerciseCount = {};
        sessions.forEach(session => {
            exerciseCount[session.exercise] = (exerciseCount[session.exercise] || 0) + 1;
        });
        
        return Object.entries(exerciseCount)
            .sort((a, b) => b[1] - a[1])[0][0];
    }

    // Get progress data for charts
    getChartData(username, exerciseFilter = null) {
        let sessions = this.getPatientSessions(username);
        
        if (exerciseFilter) {
            sessions = sessions.filter(s => s.exercise === exerciseFilter);
        }
        
        // Sort by date (oldest to newest)
        sessions.sort((a, b) => new Date(a.date) - new Date(b.date));

        return {
            labels: sessions.map(s => {
                const date = new Date(s.date);
                return `${date.getDate()}/${date.getMonth() + 1}`;
            }),
            accuracy: sessions.map(s => s.accuracy || 0),
            reps: sessions.map(s => s.reps || 0),
            duration: sessions.map(s => s.duration || 0),
            painLevel: sessions.map(s => s.painLevel || 0),
            dates: sessions.map(s => s.date)
        };
    }

    // ===== DATA EXPORT/IMPORT =====

    // Export data as JSON file
    exportToJSON() {
        try {
            const dataStr = JSON.stringify(this.data, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            
            const link = document.createElement('a');
            link.href = URL.createObjectURL(dataBlob);
            link.download = `rehab-progress-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            return true;
        } catch (error) {
            console.error("Export failed:", error);
            return false;
        }
    }

    // Import data from JSON file
    importFromJSON(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const importedData = JSON.parse(event.target.result);
                    
                    // Validate data structure
                    if (importedData.patients && importedData.sessions) {
                        this.data = importedData;
                        this.saveData();
                        resolve(true);
                    } else {
                        reject(new Error("Invalid data format"));
                    }
                } catch (error) {
                    reject(error);
                }
            };
            reader.onerror = () => reject(new Error("Failed to read file"));
            reader.readAsText(file);
        });
    }

    // ===== DATA MANAGEMENT =====

    // Add sample data for demonstration
    addSampleData(username) {
        const sampleExercises = [
            "Shoulder Rotations", "Arm Raises", "Leg Lifts", 
            "Back Extensions", "Shoulder Press", "Walking"
        ];
        
        const today = new Date();
        const sessionsToAdd = [];
        
        // Create 8 sample sessions over the last 4 weeks
        for (let i = 0; i < 8; i++) {
            const sessionDate = new Date();
            sessionDate.setDate(today.getDate() - (7 - i) * 3.5); // Spread over 4 weeks
            
            const exercise = sampleExercises[Math.floor(Math.random() * sampleExercises.length)];
            const baseAccuracy = 65 + Math.random() * 20;
            const accuracy = Math.min(98, baseAccuracy + (i * 3)); // Improving over time
            
            sessionsToAdd.push({
                username: username,
                exercise: exercise,
                date: sessionDate.toISOString().split('T')[0],
                duration: Math.floor(Math.random() * 15) + 10,
                reps: Math.floor(Math.random() * 15) + 10,
                sets: 3,
                accuracy: Math.round(accuracy),
                feedback: i > 5 ? "Excellent progress!" : 
                         i > 3 ? "Good form maintained" : 
                         "Needs practice",
                painLevel: Math.max(1, Math.floor(5 - i * 0.5)), // Decreasing pain
                difficulty: ["Easy", "Medium", "Hard"][Math.floor(Math.random() * 3)],
                notes: `Session ${i + 1} completed`
            });
        }
        
        // Add all sample sessions
        sessionsToAdd.forEach(session => this.addSession(session));
        
        return sessionsToAdd.length;
    }

    // Clear all data (with confirmation)
    clearAllData() {
        localStorage.removeItem(this.STORAGE_KEY);
        this.data = this.getDefaultData();
        this.saveData();
        return true;
    }

    // Get system statistics
    getSystemStats() {
        return {
            totalPatients: Object.keys(this.data.patients).length,
            totalSessions: this.data.sessions.length,
            totalExercises: this.data.exercises.length,
            lastUpdated: this.data.lastUpdated,
            storageSize: JSON.stringify(this.data).length
        };
    }
}

// Create global instance
const progressStorage = new ProgressStorage();
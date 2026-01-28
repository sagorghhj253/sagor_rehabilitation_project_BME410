// User credentials
const users = {
    // Patients
    rubi: { password: "1234", role: "patient" },
    maliha: { password: "1235", role: "patient" },
    sagor: { password: "1236", role: "patient" },
    // Therapist
    sagordas: { password: "12345", role: "therapist" }
};

let currentUser = null;
let selectedRole = "patient";

// DOM elements
const loginContainer = document.getElementById('loginContainer');
const homeContainer = document.getElementById('homeContainer');
const loginForm = document.getElementById('loginForm');
const errorMessage = document.getElementById('errorMessage');
const roleButtons = document.querySelectorAll('.role-btn');

// Role selection
roleButtons.forEach(button => {
    button.addEventListener('click', () => {
        roleButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        selectedRole = button.dataset.role;
    });
});

// Form submission
loginForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    
    // Clear previous error
    errorMessage.textContent = '';
    errorMessage.classList.remove('show');
    
    // Validate credentials
    if (users[username]) {
        if (users[username].password === password) {
            if (users[username].role === selectedRole) {
                currentUser = {
                    username: username,
                    role: users[username].role
                };
                
                // Save to localStorage
                localStorage.setItem('rehabUser', JSON.stringify(currentUser));
                
                // Show home container
                loginContainer.style.display = 'none';
                homeContainer.style.display = 'block';
                
                // Hide appropriate mode based on role
                if (selectedRole === 'patient') {
                    document.querySelector('.mode-card:nth-child(2)').style.display = 'none';
                } else if (selectedRole === 'therapist') {
                    document.querySelector('.mode-card:nth-child(1)').style.display = 'none';
                }
                
            } else {
                showError(`Please select ${users[username].role} role to login`);
            }
        } else {
            showError('Incorrect password');
        }
    } else {
        showError('Username not found');
    }
});

// Navigation functions
function enterPatientMode() {
    window.location.href = 'patient.html';
}

function enterTrainingMode() {
    window.location.href = 'training.html';
}

function logout() {
    localStorage.removeItem('rehabUser');
    currentUser = null;
    
    // Reset form
    loginForm.reset();
    document.getElementById('username').focus();
    
    // Show login, hide home
    homeContainer.style.display = 'none';
    
    // Ensure login container is properly displayed and centered
    loginContainer.style.display = 'flex'; // Use flex to center it
    loginContainer.style.justifyContent = 'center';
    loginContainer.style.alignItems = 'center';
    loginContainer.style.minHeight = '100vh';
    
    // Reset role selection
    roleButtons.forEach(btn => btn.classList.remove('active'));
    document.querySelector('.role-btn[data-role="patient"]').classList.add('active');
    selectedRole = "patient";
    
    // Show all mode cards again for next login
    document.querySelectorAll('.mode-card').forEach(card => {
        card.style.display = 'block';
    });
}

// Helper function to show error
function showError(message) {
    errorMessage.textContent = message;
    errorMessage.classList.add('show');
}

// Check if already logged in on page load
window.addEventListener('DOMContentLoaded', () => {
    const savedUser = localStorage.getItem('rehabUser');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        loginContainer.style.display = 'none';
        homeContainer.style.display = 'block';
        
        // Hide appropriate mode based on role
        if (currentUser.role === 'patient') {
            document.querySelector('.mode-card:nth-child(2)').style.display = 'none';
            selectedRole = 'patient';
        } else if (currentUser.role === 'therapist') {
            document.querySelector('.mode-card:nth-child(1)').style.display = 'none';
            selectedRole = 'therapist';
        }
    }
});
// Quick Access Functions
function quickAccess(role) {
    let username, password;
    
    if (role === 'patient') {
        username = 'rubi';
        password = '1234';
    } else if (role === 'therapist') {
        username = 'sagordas';
        password = '12345';
    }
    
    // Set the form values
    document.getElementById('username').value = username;
    document.getElementById('password').value = password;
    
    // Set the role
    const roleBtn = document.querySelector(`.role-btn[data-role="${role}"]`);
    if (roleBtn) {
        roleButtons.forEach(btn => btn.classList.remove('active'));
        roleBtn.classList.add('active');
        selectedRole = role;
    }
    
    // Auto-submit after a delay
    setTimeout(() => {
        document.querySelector('.login-btn').click();
    }, 500);
}

function viewProgressDirectly() {
    // Check if user is already logged in
    const savedUser = localStorage.getItem('rehabUser');
    
    if (savedUser) {
        // User is logged in, go directly to progress page
        window.location.href = 'progress.html';
    } else {
        // Show login prompt
        alert('Please login first to view progress.');
        document.getElementById('username').focus();
    }
}
// Progress Button Component
class ProgressButton {
    static createButton(text = '📊 View Progress', type = 'primary') {
        const button = document.createElement('button');
        button.className = `progress-button ${type}`;
        button.innerHTML = text;
        button.onclick = () => window.location.href = 'progress.html';
        return button;
    }
    
    static addToContainer(containerId, text, type) {
        const container = document.getElementById(containerId);
        if (container) {
            const button = this.createButton(text, type);
            container.appendChild(button);
        }
    }
}

// Add to all pages automatically
document.addEventListener('DOMContentLoaded', function() {
    // Check user role and add appropriate button
    const currentUser = JSON.parse(localStorage.getItem('rehabUser'));
    
    if (currentUser) {
        if (currentUser.role === 'patient') {
            ProgressButton.addToContainer('headerControls', 'My Progress', 'patient');
        } else if (currentUser.role === 'therapist') {
            ProgressButton.addToContainer('headerControls', 'Patient Progress', 'therapist');
        }
    }
});
// ===== API URL (pake var biar gak conflict) =====
var API_URL = 'http://localhost:3000/api';
var token = null;

// ===== LOGIN =====
async function login() {
    const password = document.getElementById('adminPassword').value;
    const messageEl = document.getElementById('loginMessage');
    
    console.log('🔄 Login button clicked!');
    
    if (!password) {
        messageEl.textContent = 'Please enter password';
        messageEl.className = 'error';
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password })
        });
        
        const data = await response.json();
        console.log('Response:', data);
        
        if (response.ok) {
            token = data.token;
            document.getElementById('loginForm').style.display = 'none';
            document.getElementById('adminActions').style.display = 'block';
            messageEl.textContent = '✅ Login successful!';
            messageEl.className = 'success';
            loadMatchesForSelect();
        } else {
            messageEl.textContent = '❌ ' + (data.error || 'Login failed');
            messageEl.className = 'error';
        }
    } catch (error) {
        console.error('Login error:', error);
        messageEl.textContent = '❌ Error: ' + error.message;
        messageEl.className = 'error';
    }
}

// ===== SETUP TOURNAMENT =====
async function setupTournament() {
    const messageEl = document.getElementById('adminMessage');
    
    try {
        const response = await fetch(`${API_URL}/tournament/setup`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        
        const data = await response.json();
        
        if (response.ok) {
            messageEl.textContent = `✅ ${data.message} (${data.matchesCreated} matches)`;
            messageEl.className = 'success';
            loadMatchesForSelect();
        } else {
            messageEl.textContent = '❌ ' + (data.error || 'Setup failed');
            messageEl.className = 'error';
        }
    } catch (error) {
        messageEl.textContent = '❌ Error: ' + error.message;
        messageEl.className = 'error';
    }
}

// ===== LOAD MATCHES =====
async function loadMatchesForSelect() {
    try {
        const response = await fetch(`${API_URL}/matches?status=scheduled&phase=group`);
        const data = await response.json();
        const select = document.getElementById('matchSelect');
        select.innerHTML = '<option value="">Select a match...</option>';
        
        if (data && data.length > 0) {
            data.forEach(match => {
                const option = document.createElement('option');
                option.value = match.id;
                option.textContent = `${match.teamA.name} vs ${match.teamB.name} (Group ${match.groupName})`;
                select.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error loading matches:', error);
    }
}

// ===== SUBMIT RESULT =====
async function submitResult() {
    const matchId = document.getElementById('matchSelect').value;
    const scoreA = parseInt(document.getElementById('scoreA').value);
    const scoreB = parseInt(document.getElementById('scoreB').value);
    const messageEl = document.getElementById('adminMessage');
    
    if (!matchId) {
        messageEl.textContent = 'Please select a match';
        messageEl.className = 'error';
        return;
    }
    
    if (isNaN(scoreA) || isNaN(scoreB) || scoreA < 0 || scoreB < 0) {
        messageEl.textContent = 'Please enter valid scores';
        messageEl.className = 'error';
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/matches/${matchId}/result`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ scoreA, scoreB })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            messageEl.textContent = `✅ Result updated!`;
            messageEl.className = 'success';
            document.getElementById('scoreA').value = '';
            document.getElementById('scoreB').value = '';
            loadMatchesForSelect();
        } else {
            messageEl.textContent = '❌ ' + (data.error || 'Update failed');
            messageEl.className = 'error';
        }
    } catch (error) {
        messageEl.textContent = '❌ Error: ' + error.message;
        messageEl.className = 'error';
    }
}

// ===== ADVANCE TO KNOCKOUT =====
async function advanceToKnockout() {
    const messageEl = document.getElementById('adminMessage');
    
    try {
        const response = await fetch(`${API_URL}/tournament/advance`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        
        const data = await response.json();
        
        if (response.ok) {
            messageEl.textContent = `✅ ${data.message} (${data.matchesCreated} matches)`;
            messageEl.className = 'success';
        } else {
            messageEl.textContent = '❌ ' + (data.error || 'Advance failed');
            messageEl.className = 'error';
        }
    } catch (error) {
        messageEl.textContent = '❌ Error: ' + error.message;
        messageEl.className = 'error';
    }
}

// ===== RESET TOURNAMENT =====
async function resetTournament() {
    if (!confirm('⚠️ Are you sure you want to reset all matches?')) {
        return;
    }
    
    const messageEl = document.getElementById('adminMessage');
    
    try {
        const response = await fetch(`${API_URL}/tournament/reset`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const data = await response.json();
        
        if (response.ok) {
            messageEl.textContent = `✅ ${data.message}`;
            messageEl.className = 'success';
            loadMatchesForSelect();
        } else {
            messageEl.textContent = '❌ ' + (data.error || 'Reset failed');
            messageEl.className = 'error';
        }
    } catch (error) {
        messageEl.textContent = '❌ Error: ' + error.message;
        messageEl.className = 'error';
    }
}

// ===== ENTER KEY =====
document.addEventListener('DOMContentLoaded', () => {
    const passwordInput = document.getElementById('adminPassword');
    if (passwordInput) {
        passwordInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') login();
        });
    }
});
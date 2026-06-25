// ===== API URL (jangan pake const biar gak conflict) =====
var API_URL = 'http://localhost:3000/api';

// ===== TAB SWITCHING =====
function showTab(tabName) {
    document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('nav button').forEach(btn => btn.classList.remove('active'));
    
    document.getElementById(tabName).classList.add('active');
    document.querySelector(`nav button[onclick="showTab('${tabName}')"]`).classList.add('active');
    
    if (tabName === 'standings') fetchStandings();
    if (tabName === 'matches') fetchMatches();
    if (tabName === 'bracket') fetchBracket();
}

// ===== FETCH STANDINGS =====
async function fetchStandings() {
    try {
        const response = await fetch(`${API_URL}/standings`);
        const data = await response.json();
        renderStandings(data);
    } catch (error) {
        console.error('Error fetching standings:', error);
        document.getElementById('standingsContainer').innerHTML = 
            '<p style="color:#e74c3c;">❌ Error loading standings</p>';
    }
}

function renderStandings(data) {
    const container = document.getElementById('standingsContainer');
    container.innerHTML = '';
    
    if (!data || data.length === 0) {
        container.innerHTML = '<p>No standings available. Generate fixtures first.</p>';
        return;
    }
    
    data.forEach(group => {
        const div = document.createElement('div');
        div.className = 'standings-group';
        
        let html = `<h3>Group ${group.group}</h3><table>
            <thead><tr>
                <th>#</th><th>Team</th><th>P</th><th>W</th>
                <th>D</th><th>L</th><th>GF</th><th>GA</th>
                <th>GD</th><th>Pts</th>
            </tr></thead><tbody>`;
        
        group.standings.forEach((team, index) => {
            html += `<tr>
                <td>${index + 1}</td>
                <td><strong>${team.team}</strong> (${team.code})</td>
                <td>${team.played}</td>
                <td>${team.won}</td>
                <td>${team.drawn}</td>
                <td>${team.lost}</td>
                <td>${team.goalsFor}</td>
                <td>${team.goalsAgainst}</td>
                <td>${team.goalDiff}</td>
                <td><strong>${team.points}</strong></td>
            </tr>`;
        });
        
        html += '</tbody></table>';
        div.innerHTML = html;
        container.appendChild(div);
    });
}

// ===== FETCH MATCHES =====
async function fetchMatches() {
    try {
        const response = await fetch(`${API_URL}/matches?phase=group`);
        const data = await response.json();
        renderMatches(data);
    } catch (error) {
        console.error('Error fetching matches:', error);
        document.getElementById('matchesContainer').innerHTML = 
            '<p style="color:#e74c3c;">❌ Error loading matches</p>';
    }
}

function renderMatches(matches) {
    const container = document.getElementById('matchesContainer');
    container.innerHTML = '';
    
    if (!matches || matches.length === 0) {
        container.innerHTML = '<p>No matches found. Generate fixtures first.</p>';
        return;
    }
    
    const groups = {};
    matches.forEach(match => {
        if (!groups[match.groupName]) groups[match.groupName] = [];
        groups[match.groupName].push(match);
    });
    
    Object.keys(groups).sort().forEach(groupName => {
        const div = document.createElement('div');
        div.className = 'standings-group';
        
        let html = `<h3>Group ${groupName}</h3>`;
        groups[groupName].forEach(match => {
            const isFinished = match.status === 'finished';
            const scoreDisplay = isFinished ? `${match.scoreA} - ${match.scoreB}` : 'vs';
            const statusClass = isFinished ? 'finished' : 'scheduled';
            
            html += `<div class="match-card">
                <span class="team"><strong>${match.teamA.name}</strong></span>
                <span class="match-score ${isFinished ? '' : 'scheduled'}">${scoreDisplay}</span>
                <span class="team"><strong>${match.teamB.name}</strong></span>
                <span class="match-status ${statusClass}">${match.status}</span>
            </div>`;
        });
        
        div.innerHTML = html;
        container.appendChild(div);
    });
}

// ===== FETCH BRACKET =====
async function fetchBracket() {
    try {
        const response = await fetch(`${API_URL}/bracket`);
        const data = await response.json();
        renderBracket(data);
    } catch (error) {
        console.error('Error fetching bracket:', error);
        document.getElementById('bracketContainer').innerHTML = 
            '<p style="color:#e74c3c;">❌ Error loading bracket</p>';
    }
}

function renderBracket(bracketData) {
    const container = document.getElementById('bracketContainer');
    container.innerHTML = '';
    
    if (!bracketData || Object.keys(bracketData).length === 0) {
        container.innerHTML = '<p>No knockout matches yet. Advance tournament first.</p>';
        return;
    }
    
    const bracketDiv = document.createElement('div');
    bracketDiv.className = 'bracket-container';
    
    const roundOrder = ['Round of 32', 'Round of 16', 'Quarter-final', 'Semi-final', 'Final'];
    
    roundOrder.forEach(roundName => {
        if (!bracketData[roundName]) return;
        
        const roundDiv = document.createElement('div');
        roundDiv.className = 'bracket-round';
        
        let html = `<h4>${roundName}</h4>`;
        bracketData[roundName].forEach(match => {
            const teamA = match.teamA?.name || 'TBD';
            const teamB = match.teamB?.name || 'TBD';
            const scoreDisplay = match.status === 'finished' ? `${match.scoreA} - ${match.scoreB}` : 'vs';
            
            html += `<div class="bracket-match">
                <div><strong>${teamA}</strong></div>
                <div class="match-score">${scoreDisplay}</div>
                <div><strong>${teamB}</strong></div>
            </div>`;
        });
        
        roundDiv.innerHTML = html;
        bracketDiv.appendChild(roundDiv);
    });
    
    container.appendChild(bracketDiv);
}

// ===== LOAD INITIAL =====
document.addEventListener('DOMContentLoaded', () => {
    fetchStandings();
});
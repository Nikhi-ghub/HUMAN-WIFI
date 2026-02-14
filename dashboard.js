let currentUser = null;
let currentRoom = null;
let allUsers = [];
let matches = [];

document.addEventListener('DOMContentLoaded', () => {
  
    const userToken = localStorage.getItem('userToken');
    if (!userToken) {
        window.location.href = 'index.html';
        return;
    }
   
    loadUserData();
    
    
    setInterval(refreshMatches, 30000); 
});


function loadUserData() {
    currentUser = {
        name: localStorage.getItem('userName') || 'Guest User',
        mood: localStorage.getItem('userMood') || 'calm',
        interests: JSON.parse(localStorage.getItem('userInterests') || '[]'),
        purpose: localStorage.getItem('userPurpose') || 'socialize'
    };
    

    document.getElementById('userName').textContent = currentUser.name;
    document.getElementById('welcomeName').textContent = currentUser.name;
    document.getElementById('userMood').textContent = getMoodEmoji(currentUser.mood);
    

    const avatar = currentUser.name.charAt(0).toUpperCase();
    document.getElementById('userAvatar').textContent = getAvatarEmoji(currentUser.purpose);
}


async function joinRoom() {
    const roomCode = document.getElementById('roomCodeInput').value.trim().toUpperCase();
    
    if (!roomCode) {
        alert('Please enter a room code');
        return;
    }
    
    try {
        const response = await fetch('/api/join-room', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('userToken')}`
            },
            body: JSON.stringify({
                roomCode,
                user: currentUser
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            currentRoom = roomCode;
            document.getElementById('currentRoom').textContent = roomCode;
            localStorage.setItem('currentRoom', roomCode);
            

            await loadRoomUsers();
            await refreshMatches();
            
    
            showNotification('🎉 Successfully joined ' + roomCode);
        } else {
            alert(data.message || 'Failed to join room');
        }
    } catch (error) {
        console.error('Join room error:', error);
        
        currentRoom = roomCode;
        document.getElementById('currentRoom').textContent = roomCode;
        localStorage.setItem('currentRoom', roomCode);
        await generateDemoMatches();
        showNotification('🎉 Successfully joined ' + roomCode);
    }
}


function quickJoin(roomCode) {
    document.getElementById('roomCodeInput').value = roomCode;
    joinRoom();
}

async function loadRoomUsers() {
    try {
        const response = await fetch(`/api/room/${currentRoom}/users`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('userToken')}`
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            allUsers = data.users;
            updateStats();
        }
    } catch (error) {
        console.error('Load users error:', error);
    }
}

async function generateDemoMatches() {
    const demoUsers = [
        {
            name: 'Alex Chen',
            interests: ['AI', 'Coding', 'Gaming'],
            mood: 'energized',
            purpose: 'collaborate'
        },
        {
            name: 'Sarah Johnson',
            interests: ['Music', 'AI', 'Photography'],
            mood: 'curious',
            purpose: 'socialize'
        },
        {
            name: 'Mike Rodriguez',
            interests: ['Sports', 'Coding', 'Travel'],
            mood: 'focused',
            purpose: 'network'
        },
        {
            name: 'Emily Wang',
            interests: ['AI', 'Art', 'Coding'],
            mood: 'calm',
            purpose: 'study'
        },
        {
            name: 'David Kim',
            interests: ['Gaming', 'Music', 'Fitness'],
            mood: 'energized',
            purpose: 'socialize'
        }
    ];
    
    allUsers = demoUsers;
    matches = calculateMatches(demoUsers);
    updateStats();
    renderMatches();
}

function calculateMatches(users) {
    const matchedUsers = users.map(user => {
        const commonInterests = currentUser.interests.filter(interest => 
            user.interests.includes(interest)
        );
        
        const matchScore = Math.round(
            (commonInterests.length / Math.max(currentUser.interests.length, user.interests.length)) * 100
        );
        
        return {
            ...user,
            commonInterests,
            matchScore,
            icebreaker: generateIcebreaker(commonInterests, user)
        };
    });
   
    return matchedUsers
        .filter(user => user.matchScore > 30)
        .sort((a, b) => b.matchScore - a.matchScore);
}


function generateIcebreaker(commonInterests, user) {
    if (commonInterests.length > 0) {
        const interest = commonInterests[0];
        const icebreakers = {
            'AI': `What excites you most about ${interest}?`,
            'Coding': `What's your favorite programming language and why?`,
            'Music': `What genre of ${interest} do you enjoy most?`,
            'Gaming': `What's your all-time favorite game?`,
            'Sports': `Which sport do you follow most closely?`,
            'Photography': `What's your favorite subject to photograph?`,
            'Art': `What art style resonates with you?`,
            'Travel': `What's the most memorable place you've visited?`,
            'Fitness': `What's your go-to workout routine?`
        };
        
        return icebreakers[interest] || `Tell me about your passion for ${interest}!`;
    }
    
    return "What's something new you learned this week?";
}


function updateStats() {
    document.getElementById('nearbyCount').textContent = allUsers.length;
    document.getElementById('matchCount').textContent = matches.length;
    document.getElementById('connectionCount').textContent = 
        Math.floor(matches.length * 0.6); 
    
    if (matches.length > 0) {
        const avgScore = Math.round(
            matches.reduce((sum, m) => sum + m.matchScore, 0) / matches.length
        );
        document.getElementById('matchScore').textContent = avgScore + '%';
    }
}


function renderMatches() {
    const matchesList = document.getElementById('matchesList');
    const noMatches = document.getElementById('noMatches');
    
    if (matches.length === 0) {
        matchesList.style.display = 'none';
        noMatches.style.display = 'block';
        return;
    }
    
    matchesList.style.display = 'grid';
    noMatches.style.display = 'none';
    
    matchesList.innerHTML = matches.map(match => `
        <div class="match-card" onclick="showMatchDetails(${JSON.stringify(match).replace(/"/g, '&quot;')})">
            <div class="match-header">
                <div class="match-avatar">${getAvatarEmoji(match.purpose)}</div>
                <div class="match-info">
                    <h3>${match.name}</h3>
                    <span class="match-percentage">${match.matchScore}% Match</span>
                </div>
            </div>
            <div class="match-details">
                <div class="detail-item">
                    <div class="detail-label">Shared Interests</div>
                    <div class="interests-tags">
                        ${match.commonInterests.map(i => 
                            `<span class="interest-tag">${i}</span>`
                        ).join('')}
                    </div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Mood</div>
                    <div class="detail-value">${getMoodEmoji(match.mood)}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Looking For</div>
                    <div class="detail-value">${getPurposeLabel(match.purpose)}</div>
                </div>
            </div>
        </div>
    `).join('');
}


function showMatchDetails(match) {
    const modal = document.getElementById('matchModal');
    
    document.getElementById('modalAvatar').textContent = getAvatarEmoji(match.purpose);
    document.getElementById('modalName').textContent = match.name;
    document.getElementById('modalPercentage').textContent = match.matchScore + '% Match';
    
    document.getElementById('modalInterests').innerHTML = match.commonInterests.map(i => 
        `<span class="interest-tag">${i}</span>`
    ).join('');
    
    document.getElementById('modalMood').textContent = getMoodEmoji(match.mood);
    document.getElementById('modalPurpose').textContent = getPurposeLabel(match.purpose);
    document.getElementById('modalIcebreaker').textContent = match.icebreaker;
    
    modal.classList.add('active');
}


function closeModal() {
    document.getElementById('matchModal').classList.remove('active');
}


async function confirmMeet() {
    try {
        const response = await fetch('/api/confirm-meet', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('userToken')}`
            },
            body: JSON.stringify({
                room: currentRoom,
                user: currentUser
            })
        });
        
        closeModal();
        showNotification('🎉 Great! Go say hi in person!');
        
      
        const currentCount = parseInt(document.getElementById('connectionCount').textContent);
        document.getElementById('connectionCount').textContent = currentCount + 1;
    } catch (error) {
        console.error('Confirm meet error:', error);
        closeModal();
        showNotification('🎉 Great! Go say hi in person!');
    }
}


async function refreshMatches() {
    if (!currentRoom) return;
    
    try {
        await loadRoomUsers();
        matches = calculateMatches(allUsers);
        renderMatches();
    } catch (error) {
        console.error('Refresh error:', error);
    }
}


function logout() {
    localStorage.clear();
    window.location.href = 'index.html';
}

function getMoodEmoji(mood) {
    const moodMap = {
        'energized': '🚀 Energized',
        'calm': '😌 Calm',
        'curious': '🤔 Curious',
        'lonely': '😔 Isolated',
        'focused': '🎯 Focused'
    };
    return moodMap[mood] || '😊 Good';
}

function getAvatarEmoji(purpose) {
    const avatarMap = {
        'study': '📚',
        'network': '🤝',
        'collaborate': '💡',
        'socialize': '🎉',
        'mentor': '🎓'
    };
    return avatarMap[purpose] || '👤';
}

function getPurposeLabel(purpose) {
    const labelMap = {
        'study': 'Study Buddies',
        'network': 'Professional Networking',
        'collaborate': 'Project Collaboration',
        'socialize': 'Making Friends',
        'mentor': 'Mentorship'
    };
    return labelMap[purpose] || 'Connect';
}

function showNotification(message) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(135deg, #FF6B6B, #FF9F5A);
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 12px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.2);
        z-index: 10000;
        animation: slideIn 0.3s ease-out;
        font-weight: 600;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

document.addEventListener('DOMContentLoaded', () => {
    initializeLonelinessChart();
    startRealTimeUpdates();
});

function initializeLonelinessChart() {
    const ctx = document.getElementById('lonelinessChart');
    
    if (!ctx) return;
    
    const data = {
        labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
        datasets: [
            {
                label: 'Loneliness Index',
                data: [65, 52, 41, 32],
                borderColor: '#FF6B6B',
                backgroundColor: 'rgba(255, 107, 107, 0.1)',
                tension: 0.4,
                fill: true,
                borderWidth: 3,
                pointRadius: 6,
                pointHoverRadius: 8,
                pointBackgroundColor: '#FF6B6B',
                pointBorderColor: '#fff',
                pointBorderWidth: 2
            },
            {
                label: 'Connection Rate',
                data: [35, 48, 59, 68],
                borderColor: '#4ECDC4',
                backgroundColor: 'rgba(78, 205, 196, 0.1)',
                tension: 0.4,
                fill: true,
                borderWidth: 3,
                pointRadius: 6,
                pointHoverRadius: 8,
                pointBackgroundColor: '#4ECDC4',
                pointBorderColor: '#fff',
                pointBorderWidth: 2
            }
        ]
    };
    
    const config = {
        type: 'line',
        data: data,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'rgba(26, 26, 46, 0.9)',
                    padding: 12,
                    titleFont: {
                        size: 14,
                        weight: 'bold'
                    },
                    bodyFont: {
                        size: 13
                    },
                    borderColor: '#FF6B6B',
                    borderWidth: 1,
                    displayColors: true,
                    callbacks: {
                        label: function(context) {
                            return context.dataset.label + ': ' + context.parsed.y + '%';
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)',
                        drawBorder: false
                    },
                    ticks: {
                        callback: function(value) {
                            return value + '%';
                        },
                        font: {
                            size: 12,
                            weight: '600'
                        },
                        color: '#6B7280'
                    }
                },
                x: {
                    grid: {
                        display: false,
                        drawBorder: false
                    },
                    ticks: {
                        font: {
                            size: 12,
                            weight: '600'
                        },
                        color: '#6B7280'
                    }
                }
            },
            interaction: {
                intersect: false,
                mode: 'index'
            }
        }
    };
    
    new Chart(ctx, config);
}

function startRealTimeUpdates() {

    setInterval(updateMetrics, 5000);
    setInterval(addNewActivity, 15000);
}

function updateMetrics() {
    const metrics = [
        { id: 'totalUsers', current: 2847, change: 5 },
        { id: 'totalMatches', current: 1243, change: 3 },
        { id: 'activeRooms', current: 15, change: 1 },
        { id: 'connectionScore', current: 87, change: 2 }
    ];
    
    metrics.forEach(metric => {
        const element = document.getElementById(metric.id);
        if (element) {
            const randomChange = Math.random() > 0.5 ? metric.change : -metric.change;
            const newValue = metric.current + Math.floor(Math.random() * randomChange);
            
            if (metric.id === 'connectionScore') {
                element.textContent = Math.min(100, Math.max(0, newValue)) + '%';
            } else {
                element.textContent = newValue.toLocaleString();
            }
        }
    });
}

function addNewActivity() {
    const activities = [
        {
            icon: '🚀',
            title: 'New Match',
            desc: 'Two users matched in HACK2026',
            time: 'Just now'
        },
        {
            icon: '🎉',
            title: 'Connection Made',
            desc: 'Face-to-face meeting confirmed',
            time: 'Just now'
        },
        {
            icon: '📍',
            title: 'Room Activity',
            desc: 'CAMPUS101 growing rapidly',
            time: 'Just now'
        },
        {
            icon: '💡',
            title: 'High Match',
            desc: '92% compatibility detected',
            time: 'Just now'
        }
    ];
    
    const randomActivity = activities[Math.floor(Math.random() * activities.length)];
    const activityGrid = document.querySelector('.activity-grid');
    
    if (activityGrid && activityGrid.children.length >= 4) {
        activityGrid.removeChild(activityGrid.lastElementChild);
    }
    
    const newActivity = document.createElement('div');
    newActivity.className = 'activity-card';
    newActivity.style.animation = 'fadeInUp 0.5s ease-out';
    newActivity.innerHTML = `
        <div class="activity-icon">${randomActivity.icon}</div>
        <div class="activity-content">
            <div class="activity-title">${randomActivity.title}</div>
            <div class="activity-desc">${randomActivity.desc}</div>
            <div class="activity-time">${randomActivity.time}</div>
        </div>
    `;
    
    if (activityGrid) {
        activityGrid.insertBefore(newActivity, activityGrid.firstChild);
    }
}

function exportData() {
    const data = {
        timestamp: new Date().toISOString(),
        metrics: {
            totalUsers: document.getElementById('totalUsers').textContent,
            totalMatches: document.getElementById('totalMatches').textContent,
            activeRooms: document.getElementById('activeRooms').textContent,
            connectionScore: document.getElementById('connectionScore').textContent
        },
        rooms: getRoomData()
    };
    
    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `human-wifi-analytics-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
    
    showNotification('📊 Data exported successfully!');
}

function getRoomData() {
    const rows = document.querySelectorAll('#roomsTableBody tr');
    const rooms = [];
    
    rows.forEach(row => {
        const cells = row.querySelectorAll('td');
        rooms.push({
            code: cells[0].textContent.trim(),
            activeUsers: parseInt(cells[1].textContent),
            matchesMade: parseInt(cells[2].textContent),
            avgMatchScore: cells[3].textContent.trim(),
            status: cells[4].textContent.trim()
        });
    });
    
    return rooms;
}

document.getElementById('lonelinessFilter')?.addEventListener('change', (e) => {
    const period = e.target.value;
    showNotification(`📊 Updated chart for: ${period}`);
});

function logout() {
    localStorage.clear();
    window.location.href = 'index.html';
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

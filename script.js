// Configuration: Edit these for your needs
const TARGET_DATE = new Date('2026-05-24T00:00:00').getTime(); // Future date for countdown (changed from 2024 to make sense)
let dailyData = JSON.parse(localStorage.getItem('dailyTimeData')) || {}; // { '2025-11-09': {productive: 8, wasted: 4} }
let weeklyChart, dailyChart;

// Countdown Timer
function updateCountdown() {
    const now = new Date().getTime();
    const distance = TARGET_DATE - now;

    if (distance > 0) {
        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);
        const milliseconds = distance % 1000;

        document.getElementById('days').textContent = days.toString().padStart(2, '0');
        document.getElementById('hours').textContent = hours.toString().padStart(2, '0');
        document.getElementById('minutes').textContent = minutes.toString().padStart(2, '0');
        document.getElementById('seconds').textContent = seconds.toString().padStart(2, '0');
        document.getElementById('milliseconds').textContent = milliseconds.toString().padStart(3, '0');
    } else {
        document.getElementById('timer').innerHTML = '<h2>Target Date Reached!</h2>';
    }
}

// Log Daily Time
function logDailyTime() {
    const productive = parseInt(document.getElementById('productive-hours').value) || 0;
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const wasted = 24 - productive; // Simple assumption: rest is wasted

    dailyData[today] = { productive, wasted };
    localStorage.setItem('dailyTimeData', JSON.stringify(dailyData));

    updateDailySummary();
    updateDailyChart();
    updateWeeklyChart();
    document.getElementById('productive-hours').value = ''; // Reset input
}

// Update Daily Summary
function updateDailySummary() {
    const today = new Date().toISOString().split('T')[0];
    const data = dailyData[today] || { productive: 0, wasted: 0 };
    document.getElementById('daily-productive').textContent = data.productive;
    document.getElementById('daily-wasted').textContent = data.wasted;
    document.getElementById('daily-total').textContent = data.productive + data.wasted;
}

// Daily Pie Chart
function updateDailyChart() {
    const today = new Date().toISOString().split('T')[0];
    const data = dailyData[today] || { productive: 0, wasted: 0 };
    const ctx = document.getElementById('dailyChart').getContext('2d');
    
    if (dailyChart) dailyChart.destroy();
    dailyChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: ['Productive', 'Wasted'],
            datasets: [{
                data: [data.productive, data.wasted],
                backgroundColor: ['#4CAF50', '#f44336']
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { position: 'bottom' } }
        }
    });
}

// Weekly Bar Chart (Last 7 days)
function updateWeeklyChart() {
    const now = new Date();
    const days = [];
    const productiveHours = [];
    
    for (let i = 6; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(now.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        days.push(date.toLocaleDateString('en-US', { weekday: 'short' }));
        productiveHours.push(dailyData[dateStr]?.productive || 0);
    }
    
    const ctx = document.getElementById('weeklyChart').getContext('2d');
    if (weeklyChart) weeklyChart.destroy();
    weeklyChart = new Chart(ctx, {
        type: 'bar', // Change to 'line' for line chart
        data: {
            labels: days,
            datasets: [{
                label: 'Productive Hours',
                data: productiveHours,
                backgroundColor: 'rgba(75, 192, 192, 0.6)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: { beginAtZero: true, max: 24 }
            }
        }
    });
}

// Smooth Scrolling
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        document.querySelector(this.getAttribute('href')).scrollIntoView({
            behavior: 'smooth'
        });
    });
});

// Initialize
updateCountdown();
setInterval(updateCountdown, 1); // Update every ms for ms precision (but ms rolls over)
updateDailySummary();
updateDailyChart();
updateWeeklyChart();
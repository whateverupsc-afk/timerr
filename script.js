// App Configuration
const App = {
    config: {
        defaultExamDate: new Date('2026-05-24T00:00:00'),
        dailyGoalHours: 8,
        sectionLabels: ['Study GS', 'CSAT Practice', 'Revision', 'Mock Test', 'Breaks', 'Notes']
    },

    // Timer Module (Unchanged from Previous)
    timer: {
        state: {
            sessionActive: false,
            idleTime: 0,
            lastActivity: Date.now(),
            activeTime: 0,
            afkTime: 0,
            sessionStart: null,
            intervalId: null,
            threshold: 5 * 60 * 1000
        },

        elements: {},

        init: function(elements) {
            this.elements = elements;
            this.elements.thresholdInput.addEventListener('input', (e) => {
                this.state.threshold = parseInt(e.target.value) * 60 * 1000;
            });
            document.addEventListener('mousemove', () => this.resetActivity());
            document.addEventListener('keydown', () => this.resetActivity());
            document.addEventListener('click', () => this.resetActivity());
            this.elements.startBtn.addEventListener('click', () => this.toggleSession());
            this.elements.resetBtn.addEventListener('click', () => this.resetSession());
            this.elements.exportBtn.addEventListener('click', () => this.exportLogs());
        },

        resetActivity: function() {
            if (this.state.sessionActive) {
                this.state.lastActivity = Date.now();
                this.state.idleTime = 0;
                this.elements.statusEl.textContent = 'Active - Keep going!';
                this.elements.statusEl.style.color = 'green';
            }
        },

        updateTimers: function() {
            if (!this.state.sessionActive) return;
            const now = Date.now();
            const delta = now - this.state.lastActivity;
            if (delta > this.state.threshold) {
                this.state.idleTime += 1000;
                this.state.afkTime += 1 / 3600;
                this.elements.statusEl.textContent = 'AFK Detected!';
                this.elements.statusEl.style.color = 'red';
                if (this.state.idleTime % this.state.threshold === 0) {
                    alert(`AFK for ${Math.floor(this.state.idleTime / 60000)} mins!`);
                }
            } else {
                this.state.activeTime += 1 / 3600;
                this.state.idleTime = 0;
            }
            this.elements.activeTimeEl.textContent = this.formatTime(this.state.activeTime * 3600);
            this.elements.afkTimeEl.textContent = this.formatTime(this.state.afkTime * 3600);
            this.updateProgress();
        },

        toggleSession: function() {
            if (!this.state.sessionActive) {
                this.startSession();
            } else {
                this.stopSession();
            }
        },

        startSession: function() {
            this.state.sessionActive = true;
            this.state.sessionStart = Date.now();
            this.state.activeTime = this.state.afkTime = this.state.idleTime = 0;
            this.state.lastActivity = Date.now();
            this.elements.startBtn.textContent = 'Stop Session';
            this.elements.statusEl.textContent = 'Session started!';
            this.elements.statusEl.style.color = 'green';
            this.state.intervalId = setInterval(() => this.updateTimers(), 1000);
        },

        stopSession: function() {
            clearInterval(this.state.intervalId);
            this.saveSession();
            this.state.sessionActive = false;
            this.elements.startBtn.textContent = 'Start Session';
            this.elements.statusEl.textContent = 'Session ended';
        },

        resetSession: function() {
            if (this.state.sessionActive) {
                this.stopSession();
            }
            this.state.sessionActive = false;
            this.state.activeTime = this.state.afkTime = this.state.idleTime = 0;
            this.elements.startBtn.textContent = 'Start Session';
            this.elements.statusEl.textContent = 'Session inactive';
            this.elements.activeTimeEl.textContent = this.elements.afkTimeEl.textContent = '00:00:00';
            this.loadDailyStats();
        },

        saveSession: function() {
            if (this.state.activeTime + this.state.afkTime === 0) return;
            const today = new Date().toDateString();
            const logs = JSON.parse(localStorage.getItem(today) || '[]');
            logs.push({
                start: this.state.sessionStart,
                active: this.state.activeTime,
                afk: this.state.afkTime,
                end: new Date().toISOString()
            });
            localStorage.setItem(today, JSON.stringify(logs));
            this.loadDailyStats();
        },

        loadDailyStats: function() {
            const today = new Date().toDateString();
            const logs = JSON.parse(localStorage.getItem(today) || '[]');
            const totalActive = logs.reduce((sum, log) => sum + log.active, 0);
            const totalAfk = logs.reduce((sum, log) => sum + log.afk, 0);
            this.elements.dailyActiveEl.textContent = this.formatHours(totalActive);
            this.elements.dailyAfkEl.textContent = this.formatHours(totalAfk);
        },

        exportLogs: function() {
            const today = new Date().toDateString();
            const logs = JSON.parse(localStorage.getItem(today) || '[]');
            if (logs.length === 0) return alert('No logs!');
            let csv = 'Start,Active,AFK,End\n';
            logs.forEach(log => {
                csv += `${new Date(log.start).toLocaleString()},${log.active.toFixed(2)},${log.afk.toFixed(2)},${new Date(log.end).toLocaleString()}\n`;
            });
            const blob = new Blob([csv], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `afk-logs-${today}.csv`;
            a.click();
            URL.revokeObjectURL(url);
        },

        updateProgress: function() {
            const today = new Date().toDateString();
            const logs = JSON.parse(localStorage.getItem(today) || '[]');
            const totalActiveToday = logs.reduce((sum, log) => sum + log.active, 0);
            const progressPercent = Math.min((totalActiveToday / App.config.dailyGoalHours) * 100, 100);
            this.elements.progressFill.style.width = progressPercent + '%';
            this.elements.progressText.textContent = `${this.formatHours(totalActiveToday)} / ${App.config.dailyGoalHours} hours active today`;
        },

        formatTime: function(seconds) {
            const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
            const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
            const s = Math.floor(seconds % 60).toString().padStart(2, '0');
            return `${h}:${m}:${s}`;
        },

        formatHours: function(hours) {
            const h = Math.floor(hours);
            const m = Math.floor((hours % 1) * 60);
            return `${h}h ${m}m`;
        }
    },

    // Countdown Module (Unchanged)
    countdown: {
        state: {
            currentEndDate: App.config.defaultExamDate
        },

        elements: {},

        init: function(elements) {
            this.elements = elements;
            this.elements.useCustomBtn.addEventListener('click', () => this.applyCustomDate());
            this.elements.showHoursChk.addEventListener('change', () => this.update());
        },

        update: function() {
            const now = new Date();
            const diff = this.state.currentEndDate - now;
            if (diff > 0) {
                if (this.elements.showHoursChk.checked) {
                    const hours = Math.floor(diff / (1000 * 60 * 60));
                    this.elements.countdownDisplay.textContent = `${hours} total hours left`;
                } else {
                    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
                    const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                    const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                    const s = Math.floor((diff % (1000 * 60)) / 1000);
                    this.elements.countdownDisplay.textContent = `${days}d ${h}h ${m}m ${s}s`;
                }
            } else {
                this.elements.countdownDisplay.textContent = 'Exam Day!';
            }
        },

        applyCustomDate: function() {
            const dateStr = this.elements.customDateInput.value;
            if (dateStr) {
                this.state.currentEndDate = new Date(dateStr + 'T00:00:00');
            }
            this.update();
        }
    },

    // Calendar Module (Unchanged)
    calendar: {
        state: {
            currentMonth: new Date().getMonth(),
            currentYear: new Date().getFullYear(),
            data: JSON.parse(localStorage.getItem('calendarData') || '{}')
        },

        elements: {},

        init: function(elements) {
            this.elements = elements;
            this.elements.prevMonthBtn.addEventListener('click', () => this.prevMonth());
            this.elements.nextMonthBtn.addEventListener('click', () => this.nextMonth());
            this.render();
        },

        render: function() {
            const firstDay = new Date(this.state.currentYear, this.state.currentMonth, 1).getDay();
            const daysInMonth = new Date(this.state.currentYear, this.state.currentMonth + 1, 0).getDate();
            this.elements.monthYearEl.textContent = new Date(this.state.currentYear, this.state.currentMonth, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
            this.elements.calendarTableBody.innerHTML = '';
            let row = document.createElement('tr');
            for (let i = 0; i < firstDay; i++) {
                row.innerHTML += '<td></td>';
            }
            for (let day = 1; day <= daysInMonth; day++) {
                if ((firstDay + day - 1) % 7 === 0 && day !== 1) {
                    this.elements.calendarTableBody.appendChild(row);
                    row = document.createElement('tr');
                }
                const dateKey = `${this.state.currentYear}-${String(this.state.currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const status = this.state.data[dateKey] || '';
                const cell = document.createElement('td');
                cell.className = `calendar-day ${status}`;
                cell.textContent = day;
                cell.title = status ? (status === 'p' ? 'Productive' : 'Wasted') : 'Click to mark';
                cell.addEventListener('click', (e) => this.toggleDay(dateKey, cell));
                row.appendChild(cell);
            }
            this.elements.calendarTableBody.appendChild(row);
            this.updateSummaries();
        },

        toggleDay: function(dateKey, cell) {
            if (this.state.data[dateKey] === 'p') {
                this.state.data[dateKey] = 'w';
                cell.className = 'calendar-day w';
                cell.textContent = 'W';
            } else if (this.state.data[dateKey] === 'w') {
                delete this.state.data[dateKey];
                cell.className = 'calendar-day empty';
                cell.textContent = parseInt(cell.textContent) || '';
            } else {
                this.state.data[dateKey] = 'p';
                cell.className = 'calendar-day p';
                cell.textContent = 'P';
            }
            localStorage.setItem('calendarData', JSON.stringify(this.state.data));
            this.updateSummaries();
        },

        prevMonth: function() {
            this.state.currentMonth--;
            if (this.state.currentMonth < 0) {
                this.state.currentMonth = 11;
                this.state.currentYear--;
            }
            this.render();
        },

        nextMonth: function() {
            this.state.currentMonth++;
            if (this.state.currentMonth > 11) {
                this.state.currentMonth = 0;
                this.state.currentYear++;
            }
            this.render();
        },

        updateSummaries: function() {
            // Placeholder calculations - expand as needed
            this.elements.weekProgressEl.textContent = '50%';
            this.elements.day15ProgressEl.textContent = '40%';
            this.elements.monthProgressEl.textContent = '60%';
        }
    },

    // Chart Module (Enhanced with Line Chart)
    chart: {
        state: {
            chart: null
        },

        elements: {},

        init: function(elements, ctx) {
            this.elements = elements;
            this.elements.updateChartBtn.addEventListener('click', () => this.update());
            this.elements.chartTypeSelect.addEventListener('change', () => this.update()); // Auto-update on type change
            this.update();
        },

        update: function() {
            const chartType = this.elements.chartTypeSelect.value;
            const start = this.elements.chartStartInput.value || new Date().toISOString().split('T')[0];
            const end = this.elements.chartEndInput.value || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
            
            if (chartType === 'pie') {
                this.renderPieChart(start, end);
            } else if (chartType === 'line') {
                this.renderLineChart(start, end);
            }
        },

        renderPieChart: function(start, end) {
            let totalActive = 0, totalAfk = 0;
            for (let d = new Date(start); d <= new Date(end); d.setDate(d.getDate() + 1)) {
                const dateStr = d.toDateString();
                const logs = JSON.parse(localStorage.getItem(dateStr) || '[]');
                totalActive += logs.reduce((sum, log) => sum + log.active, 0);
                totalAfk += logs.reduce((sum, log) => sum + log.afk, 0);
            }
            if (this.state.chart) this.state.chart.destroy();
            this.state.chart = new Chart(this.elements.ctx, {
                type: 'pie',
                data: {
                    labels: ['Active (Productive)', 'AFK (Wasted)'],
                    datasets: [{ data: [totalActive, totalAfk], backgroundColor: ['#48bb78', '#e53e3e'] }]
                },
                options: { responsive: true }
            });
        },

        renderLineChart: function(start, end) {
            const labels = [];
            const activeData = [];
            const afkData = [];
            for (let d = new Date(start); d <= new Date(end); d.setDate(d.getDate() + 1)) {
                const dateStr = d.toDateString();
                labels.push(d.toLocaleDateString());
                const logs = JSON.parse(localStorage.getItem(dateStr) || '[]');
                activeData.push(logs.reduce((sum, log) => sum + log.active, 0));
                afkData.push(logs.reduce((sum, log) => sum + log.afk, 0));
            }
            if (this.state.chart) this.state.chart.destroy();
            this.state.chart = new Chart(this.elements.ctx, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [
                        {
                            label: 'Active Hours',
                            data: activeData,
                            borderColor: '#48bb78',
                            backgroundColor: 'rgba(72, 187, 120, 0.2)',
                            tension: 0.1
                        },
                        {
                            label: 'AFK Hours',
                            data: afkData,
                            borderColor: '#e53e3e',
                            backgroundColor: 'rgba(229, 62, 62, 0.2)',
                            tension: 0.1
                        }
                    ]
                },
                options: {
                    responsive: true,
                    scales: {
                        y: { beginAtZero: true, title: { display: true, text: 'Hours' } }
                    }
                }
            });
        }
    },

    // To-Do Module (Unchanged)
    todo: {
        state: {
            data: JSON.parse(localStorage.getItem('todoData') || '{}')
        },

        elements: {},

        init: function(elements) {
            this.elements = elements;
            this.elements.generateTodoBtn.addEventListener('click', () => this.generateGrid());
            this.generateGrid(); // Default init
        },

        generateGrid: function() {
            const start = new Date(this.elements.todoStartInput.value || new Date().toISOString().split('T')[0]);
            const end = new Date(this.elements.todoEndInput.value);
            this.elements.todoGrid.innerHTML = '';
            for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
                const dateKey = date.toISOString().split('T')[0];
                const header = document.createElement('h4');
                header.textContent = date.toLocaleDateString();
                this.elements.todoGrid.appendChild(header);
                App.config.sectionLabels.forEach(section => {
                    const sectionDiv = document.createElement('div');
                    sectionDiv.className = 'todo-section';
                    sectionDiv.innerHTML = `<strong>${section}:</strong>`;
                    for (let col = 1; col <= 4; col++) {
                        const taskDiv = document.createElement('div');
                        taskDiv.className = 'todo-task';
                        const id = `${section}_${col}`;
                        const item = this.state.data[dateKey]?.[id] || { task: '', checked: false };
                        taskDiv.innerHTML = `
                            <input type="checkbox" ${item.checked ? 'checked' : ''} onchange="App.todo.toggleTask('${dateKey}', '${id}', this)">
                            <input type="text" value="${item.task}" placeholder="Task ${col}" onblur="App.todo.saveTask('${dateKey}', '${id}', this.value)">
                        `;
                        sectionDiv.appendChild(taskDiv);
                    }
                    this.elements.todoGrid.appendChild(sectionDiv);
                });
            }
        },

        toggleTask: function(dateKey, id, chk) {
            if (!this.state.data[dateKey]) this.state.data[dateKey] = {};
            if (!this.state.data[dateKey][id]) this.state.data[dateKey][id] = { task: '', checked: false };
            this.state.data[dateKey][id].checked = chk.checked;
            localStorage.setItem('todoData', JSON.stringify(this.state.data));
        },

        saveTask: function(dateKey, id, value) {
            if (!this.state.data[dateKey]) this.state.data[dateKey] = {};
            if (!this.state.data[dateKey][id]) this.state.data[dateKey][id] = { task: '', checked: false };
            this.state.data[dateKey][id].task = value;
            localStorage.setItem('todoData', JSON.stringify(this.state.data));
        }
    },

    // Main Init (Updated for New Chart Elements)
    init: function() {
        // Cache DOM elements
        const elements = {
            // Timer
            thresholdInput: document.getElementById('threshold'),
            startBtn: document.getElementById('start-btn'),
            resetBtn: document.getElementById('reset-btn'),
            exportBtn: document.getElementById('export-btn'),
            activeTimeEl: document.getElementById('active-time'),
            afkTimeEl: document.getElementById('afk-time'),
            statusEl: document.getElementById('status'),
            progressFill: document.getElementById('progress-fill'),
            progressText: document.getElementById('progress-text'),
            dailyActiveEl: document.getElementById('daily-active'),
            dailyAfkEl: document.getElementById('daily-afk'),
            // Countdown
            customDateInput: document.getElementById('custom-date'),
            useCustomBtn: document.getElementById('use-custom'),
            showHoursChk: document.getElementById('show-hours'),
            countdownDisplay: document.getElementById('countdown-display'),
            // Calendar
            prevMonthBtn: document.getElementById('prev-month'),
            nextMonthBtn: document.getElementById('next-month'),
            monthYearEl: document.getElementById('month-year'),
            calendarTableBody: document.querySelector('#calendar-table tbody'),
            weekProgressEl: document.getElementById('week-progress'),
            day15ProgressEl: document.getElementById('15days-progress'),
            monthProgressEl: document.getElementById('month-progress'),
            // Chart (Updated)
            chartTypeSelect: document.getElementById('chart-type'),
            chartStartInput: document.getElementById('chart-start'),
            chartEndInput: document.getElementById('chart-end'),
            updateChartBtn: document.getElementById('update-chart'),
            // Todo
            todoStartInput: document.getElementById('todo-start'),
            todoEndInput: document.getElementById('todo-end'),
            generateTodoBtn: document.getElementById('generate-todo'),
            todoGrid: document.getElementById('todo-grid')
        };

        // Initialize modules
        this.timer.init(elements);
        this.countdown.init(elements);
        this.calendar.init(elements);
        const ctx = document.getElementById('productivity-chart').getContext('2d');
        elements.ctx = ctx; // Pass ctx to chart
        this.chart.init(elements, ctx);
        this.todo.init(elements);

        // Initial updates
        this.countdown.update();
        setInterval(() => this.countdown.update(), 1000);
        this.timer.loadDailyStats();
        this.timer.updateProgress();
    }
};

// Bootstrap on DOM load
document.addEventListener('DOMContentLoaded', () => App.init());

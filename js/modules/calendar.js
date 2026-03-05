import { Modal } from '../components/Modal.js';
import { ProjectsService } from '../services/projects.service.js';
import { GoalsService } from '../services/goals.service.js';

export const CalendarModule = {
    currentDate: new Date(),
    allTasks: [],
    allGoals: [],

    render: async () => {
        const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
        const monthOptions = monthNames.map((m, i) => `<option value="${i}">${m}</option>`).join('');

        const pageContent = `
            <style>
                /* HEADER CON SELECTORES */
                .cal-top-bar {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 25px;
                    background: var(--bg-card);
                    padding: 15px 20px;
                    border-radius: 12px;
                    border: 1px solid var(--border-color);
                    flex-wrap: wrap;
                    gap: 15px;
                }

                .cal-controls-left {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }

                .cal-nav-buttons {
                    display: flex; 
                    gap: 10px;
                }

                .cal-select {
                    padding: 8px 12px;
                    border: 1px solid var(--border-color);
                    border-radius: 8px;
                    font-weight: 700;
                    color: var(--text-main);
                    font-size: 1rem;
                    cursor: pointer;
                    background: var(--bg-input);
                }

                .cal-year-input {
                    width: 80px;
                    padding: 8px 10px;
                    border: 1px solid var(--border-color);
                    border-radius: 8px;
                    font-weight: 700;
                    color: var(--text-main);
                    font-size: 1rem;
                    background: var(--bg-input);
                }

                .nav-btn {
                    background: transparent;
                    border: 1px solid var(--border-color);
                    border-radius: 8px;
                    width: 32px; height: 32px;
                    display: flex; align-items: center; justify-content: center;
                    cursor: pointer; color: var(--text-muted); transition: all 0.2s;
                }
                .nav-btn:hover { background: var(--bg-body); color: var(--primary); border-color: var(--primary); }

                /* GRILLA */
                .calendar-wrapper { 
                    background: var(--bg-card); 
                    border-radius: 16px; 
                    border: 1px solid var(--border-color); 
                    overflow: hidden; 
                }
                
                .days-header { 
                    display: grid; 
                    grid-template-columns: repeat(7, 1fr); 
                    background: var(--bg-body); 
                    border-bottom: 1px solid var(--border-color); 
                }
                
                .day-name { 
                    padding: 12px 0; 
                    text-align: center; 
                    font-size: 0.75rem; 
                    font-weight: 700; 
                    color: var(--text-muted); 
                    text-transform: uppercase; 
                }
                
                .calendar-grid { 
                    display: grid; 
                    grid-template-columns: repeat(7, 1fr); 
                    background: var(--bg-card); 
                    border-top: 1px solid var(--border-color);
                    border-left: 1px solid var(--border-color);
                }

                .cal-cell { 
                    background: var(--bg-card); 
                    min-height: 100px; 
                    padding: 8px; 
                    cursor: pointer; 
                    transition: background 0.2s; 
                    display: flex; 
                    flex-direction: column; 
                    gap: 4px;
                    border-right: 1px solid var(--border-color);
                    border-bottom: 1px solid var(--border-color);
                }
                .cal-cell:hover { background: var(--bg-body); }
                
                .cell-number { 
                    font-size: 0.9rem; 
                    font-weight: 600; 
                    color: var(--text-main); 
                    width: 28px; height: 28px; 
                    display: flex; align-items: center; justify-content: center; 
                    border-radius: 50%; 
                }
                .cell-number.today { background: var(--primary); color: white; }

                .task-pill { 
                    font-size: 0.7rem; 
                    padding: 2px 6px; 
                    border-radius: 4px; 
                    background: rgba(59, 130, 246, 0.1); 
                    color: #3B82F6; 
                    border-left: 2px solid #3B82F6; 
                    white-space: nowrap; 
                    overflow: hidden; 
                    text-overflow: ellipsis; 
                    font-weight: 500; 
                }
                .delivery-pill { background: rgba(16, 185, 129, 0.1); color: #10B981; border-left-color: #10B981; }
                .goal-pill { background: rgba(245, 158, 11, 0.1); color: #F59E0B; border-left-color: #F59E0B; }

                /* POPUP MODERNO */
                .day-popup-date {
                    font-size: 1.1rem;
                    font-weight: 700;
                    color: var(--primary);
                    text-transform: capitalize;
                    margin-bottom: 20px;
                    padding-bottom: 12px;
                    border-bottom: 1px solid var(--border-color);
                }

                .popup-section {
                    margin-bottom: 20px;
                }

                .popup-section-title {
                    font-size: 0.75rem;
                    font-weight: 700;
                    color: var(--text-muted);
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    margin-bottom: 10px;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                }

                .popup-item {
                    background: var(--bg-body);
                    padding: 14px;
                    border-radius: 12px;
                    margin-bottom: 10px;
                    border-left: 3px solid #3B82F6;
                }

                .popup-item.delivery { border-left-color: #10B981; }
                .popup-item.goal { border-left-color: #F59E0B; }

                .popup-item-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    gap: 10px;
                    flex-wrap: wrap;
                }

                .popup-item-title {
                    font-weight: 600;
                    color: var(--text-main);
                    font-size: 0.95rem;
                    flex: 1;
                }

                .btn-wa-small {
                    display: inline-flex;
                    align-items: center;
                    gap: 4px;
                    padding: 5px 10px;
                    background: #22C55E;
                    color: white;
                    border-radius: 6px;
                    font-size: 0.75rem;
                    font-weight: 600;
                    text-decoration: none;
                    white-space: nowrap;
                    transition: all 0.2s;
                }
                .btn-wa-small:hover { background: #16A34A; transform: scale(1.02); }

                .popup-item-meta {
                    font-size: 0.8rem;
                    color: var(--text-muted);
                    margin-top: 8px;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    flex-wrap: wrap;
                }

                .popup-empty {
                    text-align: center;
                    padding: 30px 20px;
                    color: var(--text-muted);
                }

                .popup-empty-icon {
                    font-size: 2.5rem;
                    margin-bottom: 10px;
                    opacity: 0.5;
                }

                /* RESPONSIVE */
                @media (max-width: 640px) {
                    .cal-cell { min-height: 70px; padding: 4px; }
                    .cell-number { font-size: 0.8rem; width: 24px; height: 24px; }
                    .task-pill, .delivery-pill, .goal-pill { 
                        font-size: 0; height: 6px; width: 6px; 
                        padding: 0; border-radius: 50%; border: none; 
                    }
                    .task-pill { background: #3B82F6; }
                    .delivery-pill { background: #10B981; }
                    .goal-pill { background: #F59E0B; }
                    
                    .cal-controls-left { width: 100%; justify-content: space-between; }
                    .cal-select { flex: 1; }
                    .cal-nav-buttons { width: 100%; justify-content: center; margin-top: 5px; }

                    .popup-item-header { flex-direction: column; align-items: flex-start; }
                    .btn-wa-small { width: 100%; justify-content: center; margin-top: 8px; }
                }
            </style>

            <div class="page-header">
                <h2 style="font-size: 1.5rem; font-weight: 700; color: var(--text-main);">Calendario</h2>
                <p style="color: var(--text-muted); font-size: 0.9rem;">Agenda, Entregas y Metas</p>
            </div>

            <div class="cal-top-bar">
                <div class="cal-controls-left">
                    <select id="calMonthSelect" class="cal-select">
                        ${monthOptions}
                    </select>
                    <input type="number" id="calYearInput" class="cal-year-input" value="${new Date().getFullYear()}" min="2020" max="2030">
                </div>

                <div class="cal-nav-buttons">
                    <button id="btnPrevMonth" class="nav-btn">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"></polyline></svg>
                    </button>
                    <button id="btnToday" class="nav-btn" style="width:auto; padding:0 15px; font-size:0.8rem; font-weight:600;">Hoy</button>
                    <button id="btnNextMonth" class="nav-btn">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
                    </button>
                </div>
            </div>

            <div class="calendar-wrapper">
                <div class="days-header">
                    <div class="day-name">Lun</div><div class="day-name">Mar</div><div class="day-name">Mié</div>
                    <div class="day-name">Jue</div><div class="day-name">Vie</div><div class="day-name">Sáb</div>
                    <div class="day-name">Dom</div>
                </div>
                <div id="calendarGrid" class="calendar-grid"></div>
            </div>
            
            ${Modal.render('Agenda del Día', '<div id="dayDetailsContent"></div>', 'modalCalendar')}
        `;

        return pageContent;
    },

    init: async () => {
        Modal.initEvents('modalCalendar');
        CalendarModule.currentDate = new Date();
        await CalendarModule.updateCalendarView();

        const monthSelect = document.getElementById('calMonthSelect');
        const yearInput = document.getElementById('calYearInput');

        if (monthSelect) {
            monthSelect.addEventListener('change', (e) => {
                CalendarModule.currentDate.setMonth(parseInt(e.target.value));
                CalendarModule.updateCalendarView();
            });
        }

        if (yearInput) {
            yearInput.addEventListener('change', (e) => {
                CalendarModule.currentDate.setFullYear(parseInt(e.target.value));
                CalendarModule.updateCalendarView();
            });
        }

        document.getElementById('btnPrevMonth')?.addEventListener('click', () => {
            CalendarModule.currentDate.setMonth(CalendarModule.currentDate.getMonth() - 1);
            CalendarModule.updateCalendarView();
        });

        document.getElementById('btnNextMonth')?.addEventListener('click', () => {
            CalendarModule.currentDate.setMonth(CalendarModule.currentDate.getMonth() + 1);
            CalendarModule.updateCalendarView();
        });

        document.getElementById('btnToday')?.addEventListener('click', () => {
            CalendarModule.currentDate = new Date();
            CalendarModule.updateCalendarView();
        });
    },

    updateCalendarView: async () => {
        const mSelect = document.getElementById('calMonthSelect');
        const yInput = document.getElementById('calYearInput');

        if (mSelect) mSelect.value = CalendarModule.currentDate.getMonth();
        if (yInput) yInput.value = CalendarModule.currentDate.getFullYear();

        await CalendarModule.loadCalendar(CalendarModule.currentDate);
    },

    loadCalendar: async (date) => {
        const grid = document.getElementById('calendarGrid');

        let allTasks = [];
        let allGoals = [];

        // Cargar proyectos
        try {
            const projects = await ProjectsService.getAll();
            projects.forEach(p => {
                if (p.tasks && p.tasks.length > 0) {
                    p.tasks.forEach(t => {
                        allTasks.push({
                            ...t,
                            type: 'task',
                            projectName: p.name,
                            clientName: p.client || 'Sin cliente',
                            clientPhone: p.clientPhone || ''
                        });
                    });
                }
                if (p.endDate) {
                    allTasks.push({
                        description: `Entrega: ${p.name}`,
                        date: p.endDate,
                        type: 'delivery',
                        projectName: p.name,
                        clientName: p.client || 'Sin cliente',
                        clientPhone: p.clientPhone || ''
                    });
                }
            });
        } catch (error) {
            console.warn("No se pudieron cargar los proyectos", error);
        }

        // Cargar metas
        try {
            const goals = await GoalsService.getAll();
            goals.forEach(g => {
                // Agregar fecha inicio y fin de meta
                if (g.startDate) {
                    allGoals.push({
                        id: g.id,
                        description: `🎯 Inicio: ${g.name}`,
                        date: g.startDate,
                        type: 'goal',
                        goalName: g.name,
                        goalType: g.type,
                        target: g.target,
                        current: g.current
                    });
                }
                if (g.targetDate) {
                    allGoals.push({
                        id: g.id,
                        description: `🏁 Meta: ${g.name}`,
                        date: g.targetDate,
                        type: 'goal',
                        goalName: g.name,
                        goalType: g.type,
                        target: g.target,
                        current: g.current
                    });
                }
            });
        } catch (error) {
            console.warn("No se pudieron cargar las metas", error);
        }

        // Guardar para el popup
        CalendarModule.allTasks = allTasks;
        CalendarModule.allGoals = allGoals;

        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startDayOfWeek = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;

        let html = '';
        for (let i = 0; i < startDayOfWeek; i++) {
            html += `<div class="cal-cell" style="background:var(--bg-body); cursor:default;"></div>`;
        }

        const today = new Date();
        for (let day = 1; day <= daysInMonth; day++) {
            const currentDayStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const isToday = (day === today.getDate() && month === today.getMonth() && year === today.getFullYear());

            const dayTasks = allTasks.filter(t => t.date === currentDayStr);
            const dayGoals = allGoals.filter(g => g.date === currentDayStr);

            const taskPills = dayTasks.map(t => `<div class="task-pill ${t.type === 'delivery' ? 'delivery-pill' : ''}">${t.description}</div>`).join('');
            const goalPills = dayGoals.map(g => `<div class="task-pill goal-pill">${g.description}</div>`).join('');

            html += `
                <div class="cal-cell" onclick="window.openDayDetail('${currentDayStr}')">
                    <span class="cell-number ${isToday ? 'today' : ''}">${day}</span>
                    <div style="display:flex; flex-direction:column; gap:2px; width:100%;">${taskPills}${goalPills}</div>
                </div>
            `;
        }
        grid.innerHTML = html;

        // Función para abrir popup
        window.openDayDetail = (dateStr) => {
            const tasks = CalendarModule.allTasks.filter(t => t.date === dateStr);
            const goals = CalendarModule.allGoals.filter(g => g.date === dateStr);
            const container = document.getElementById('dayDetailsContent');
            const dateObj = new Date(dateStr + 'T00:00:00');
            const datePretty = dateObj.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });

            let html = `<div class="day-popup-date">${datePretty}</div>`;

            if (tasks.length === 0 && goals.length === 0) {
                html += `
                    <div class="popup-empty">
                        <div class="popup-empty-icon">☕</div>
                        <p>Sin actividad programada</p>
                    </div>
                `;
            } else {
                // Sección de Proyectos
                if (tasks.length > 0) {
                    html += `
                        <div class="popup-section">
                            <div class="popup-section-title">📂 Proyectos</div>
                            ${tasks.map(t => `
                                <div class="popup-item ${t.type === 'delivery' ? 'delivery' : ''}">
                                    <div class="popup-item-header">
                                        <span class="popup-item-title">${t.description}</span>
                                        ${t.clientPhone ? `
                                            <a href="https://wa.me/${t.clientPhone}?text=${encodeURIComponent('Hola ' + t.clientName + ', consulta sobre: ' + t.projectName)}" 
                                               target="_blank" class="btn-wa-small">
                                                <i class="fab fa-whatsapp"></i> WhatsApp
                                            </a>
                                        ` : ''}
                                    </div>
                                    <div class="popup-item-meta">
                                        <span>📁 ${t.projectName}</span>
                                        <span>👤 ${t.clientName}</span>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    `;
                }

                // Sección de Metas
                if (goals.length > 0) {
                    html += `
                        <div class="popup-section">
                            <div class="popup-section-title">🎯 Metas</div>
                            ${goals.map(g => {
                        const percent = g.target > 0 ? Math.min(100, Math.round((g.current / g.target) * 100)) : 0;
                        const isLeads = g.goalType === 'leads';
                        const formatVal = isLeads ? Math.round(g.current) : g.current.toLocaleString('es-ES', { minimumFractionDigits: 2 });
                        const formatTarget = isLeads ? Math.round(g.target) : g.target.toLocaleString('es-ES', { minimumFractionDigits: 2 });

                        return `
                                    <div class="popup-item goal">
                                        <div class="popup-item-header">
                                            <span class="popup-item-title">${g.goalName}</span>
                                            <span style="font-weight:700; color:#F59E0B;">${percent}%</span>
                                        </div>
                                        <div class="popup-item-meta">
                                            <span>${isLeads ? '📊 Leads' : '💰 Facturación'}</span>
                                            <span>Actual: ${formatVal} / ${formatTarget}</span>
                                        </div>
                                        <div style="margin-top:8px; height:6px; background:var(--border-color); border-radius:3px; overflow:hidden;">
                                            <div style="height:100%; width:${percent}%; background:#F59E0B; border-radius:3px;"></div>
                                        </div>
                                    </div>
                                `;
                    }).join('')}
                        </div>
                    `;
                }
            }

            container.innerHTML = html;
            Modal.open('modalCalendar');
        };
    },

    destroy: () => {
        delete window.openDayDetail;
        CalendarModule.allTasks = [];
        CalendarModule.allGoals = [];
    }
};

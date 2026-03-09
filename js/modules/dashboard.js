import { DashboardService } from '../services/dashboard.service.js';
import { ProjectsService } from '../services/projects.service.js';
import { Formatters } from '../utils/formatters.js';

export const DashboardModule = {
    render: async () => {
        return `
            <style>
                .dashboard-page {
                    padding: 0;
                }

                .dashboard-header {
                    margin-bottom: 28px;
                }

                .dashboard-header h2 {
                    font-size: 1.75rem;
                    font-weight: 800;
                    color: var(--text-main);
                    margin: 0 0 4px 0;
                    letter-spacing: -0.02em;
                }

                .dashboard-header p {
                    color: var(--text-muted);
                    font-size: 0.9rem;
                    margin: 0;
                }

                /* Stats Grid - Modern Cards */
                .stats-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 20px;
                    margin-bottom: 32px;
                }

                .stat-card {
                    background: var(--bg-card);
                    border: 1px solid var(--border-color);
                    border-radius: 20px;
                    padding: 24px;
                    position: relative;
                    overflow: hidden;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                }

                .stat-card:hover {
                    transform: translateY(-4px);
                    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.08);
                }

                .stat-card::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    height: 4px;
                    border-radius: 20px 20px 0 0;
                }

                .stat-card.blue::before { background: linear-gradient(90deg, #3B82F6, #60A5FA); }
                .stat-card.purple::before { background: linear-gradient(90deg, #8B5CF6, #A78BFA); }
                .stat-card.amber::before { background: linear-gradient(90deg, #F59E0B, #FBBF24); }
                .stat-card.green::before { background: linear-gradient(90deg, #3B82F6, #60A5FA); }
                .stat-card.rose::before { background: linear-gradient(90deg, #F43F5E, #FB7185); }
                .stat-card.cyan::before { background: linear-gradient(90deg, #06B6D4, #22D3EE); }

                .stat-icon {
                    width: 48px;
                    height: 48px;
                    border-radius: 14px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 1.25rem;
                    margin-bottom: 16px;
                }

                .stat-card.blue .stat-icon { background: rgba(59, 130, 246, 0.12); color: #3B82F6; }
                .stat-card.purple .stat-icon { background: rgba(139, 92, 246, 0.12); color: #8B5CF6; }
                .stat-card.amber .stat-icon { background: rgba(245, 158, 11, 0.12); color: #F59E0B; }
                .stat-card.green .stat-icon { background: rgba(59, 130, 246, 0.12); color: #3B82F6; }
                .stat-card.rose .stat-icon { background: rgba(244, 63, 94, 0.12); color: #F43F5E; }
                .stat-card.cyan .stat-icon { background: rgba(6, 182, 212, 0.12); color: #06B6D4; }

                .stat-label {
                    font-size: 0.75rem;
                    font-weight: 600;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    color: var(--text-muted);
                    margin-bottom: 6px;
                }

                .stat-value {
                    font-size: 2rem;
                    font-weight: 800;
                    color: var(--text-main);
                    line-height: 1.1;
                    letter-spacing: -0.02em;
                }

                .stat-value.money {
                    font-size: 1.5rem;
                    background: linear-gradient(135deg, #3B82F6, #2563EB);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                }

                .stat-subtitle {
                    font-size: 0.8rem;
                    color: var(--text-muted);
                    margin-top: 4px;
                }

                /* Sections Grid */
                .sections-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 24px;
                }

                @media (max-width: 900px) {
                    .sections-grid { grid-template-columns: 1fr; }
                }

                /* Mobile Responsive */
                @media (max-width: 600px) {
                    .dashboard-page {
                        padding: 0;
                        overflow-x: hidden;
                        width: 100%;
                        box-sizing: border-box;
                    }

                    .dashboard-header {
                        margin-bottom: 20px;
                    }

                    .dashboard-header h2 {
                        font-size: 1.4rem;
                    }

                    .stats-grid {
                        grid-template-columns: repeat(2, 1fr);
                        gap: 12px;
                        margin-bottom: 20px;
                        width: 100%;
                        box-sizing: border-box;
                    }

                    .stat-card {
                        padding: 14px;
                        border-radius: 16px;
                        box-sizing: border-box;
                        min-width: 0;
                    }

                    .stat-card:hover {
                        transform: none;
                    }

                    .stat-icon {
                        width: 36px;
                        height: 36px;
                        font-size: 0.9rem;
                        margin-bottom: 10px;
                    }

                    .stat-value {
                        font-size: 1.3rem;
                    }

                    .stat-value.money {
                        font-size: 1rem;
                        word-break: break-word;
                    }

                    .stat-label {
                        font-size: 0.6rem;
                    }

                    .stat-subtitle {
                        font-size: 0.65rem;
                    }

                    .sections-grid {
                        gap: 16px;
                        width: 100%;
                        box-sizing: border-box;
                    }

                    .section-card {
                        padding: 14px;
                        border-radius: 16px;
                        width: 100%;
                        box-sizing: border-box;
                        overflow: hidden;
                    }

                    .section-title {
                        font-size: 0.9rem;
                        margin-bottom: 14px;
                    }

                    .section-title i {
                        width: 26px;
                        height: 26px;
                        font-size: 0.75rem;
                        flex-shrink: 0;
                    }

                    .leads-list,
                    .goals-list {
                        width: 100%;
                        box-sizing: border-box;
                    }

                    .lead-item {
                        padding: 12px;
                        gap: 12px;
                        width: 100%;
                        box-sizing: border-box;
                        display: flex;
                        flex-direction: row;
                        align-items: center;
                    }

                    .lead-avatar {
                        width: 40px;
                        height: 40px;
                        font-size: 0.9rem;
                        flex-shrink: 0;
                    }

                    .lead-info {
                        flex: 1;
                        min-width: 0;
                        overflow: hidden;
                    }

                    .lead-name {
                        font-size: 0.85rem;
                        white-space: nowrap;
                        overflow: hidden;
                        text-overflow: ellipsis;
                    }

                    .lead-company {
                        font-size: 0.72rem;
                        white-space: nowrap;
                        overflow: hidden;
                        text-overflow: ellipsis;
                    }

                    .lead-value {
                        font-size: 0.8rem;
                        font-weight: 700;
                        white-space: nowrap;
                        flex-shrink: 0;
                        text-align: right;
                        padding-left: 8px;
                    }

                    .goal-item {
                        padding: 12px;
                        width: 100%;
                        box-sizing: border-box;
                    }

                    .goal-header {
                        flex-wrap: wrap;
                        gap: 4px;
                    }

                    .goal-name {
                        font-size: 0.8rem;
                        flex: 1;
                        min-width: 0;
                        white-space: nowrap;
                        overflow: hidden;
                        text-overflow: ellipsis;
                    }

                    .goal-percent {
                        font-size: 0.8rem;
                        flex-shrink: 0;
                    }

                    .goal-values {
                        font-size: 0.65rem;
                    }

                    .goal-values span {
                        white-space: nowrap;
                        overflow: hidden;
                        text-overflow: ellipsis;
                        max-width: 45%;
                    }
                }

                @media (max-width: 380px) {
                    .stats-grid {
                        grid-template-columns: 1fr;
                    }

                    .stat-value.money {
                        font-size: 0.95rem;
                    }

                    .lead-avatar {
                        width: 36px;
                        height: 36px;
                    }

                    .lead-name {
                        font-size: 0.8rem;
                    }

                    .lead-value {
                        font-size: 0.75rem;
                    }
                }

                .section-card {
                    background: var(--bg-card);
                    border: 1px solid var(--border-color);
                    border-radius: 20px;
                    padding: 24px;
                }

                .section-title {
                    font-size: 1rem;
                    font-weight: 700;
                    color: var(--text-main);
                    margin: 0 0 20px 0;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }

                .section-title i {
                    width: 32px;
                    height: 32px;
                    border-radius: 10px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 0.9rem;
                }

                .section-title.leads i { background: rgba(139, 92, 246, 0.12); color: #8B5CF6; }
                .section-title.goals i { background: rgba(245, 158, 11, 0.12); color: #F59E0B; }
                .section-title.actions-upcoming i { background: rgba(239, 68, 68, 0.12); color: #EF4444; }

                /* Upcoming Actions */
                .actions-upcoming-list {
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                }

                .action-upcoming-item {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 12px;
                    background: var(--bg-body);
                    border-radius: 12px;
                    border-left: 4px solid #3B82F6;
                    transition: all 0.2s;
                }

                .action-upcoming-item.overdue { border-left-color: #EF4444; background: rgba(239,68,68,0.05); }
                .action-upcoming-item.soon { border-left-color: #F59E0B; background: rgba(245,158,11,0.05); }
                .action-upcoming-item.completed-action { border-left-color: #9CA3AF; background: rgba(156,163,175,0.08); opacity: 0.7; }

                .action-date-badge {
                    min-width: 52px;
                    text-align: center;
                    padding: 6px 8px;
                    border-radius: 8px;
                    font-size: 0.7rem;
                    font-weight: 700;
                    flex-shrink: 0;
                }

                .action-date-badge.overdue { background: #FEE2E2; color: #DC2626; }
                .action-date-badge.soon { background: #FEF3C7; color: #D97706; }
                .action-date-badge.upcoming { background: #DBEAFE; color: #2563EB; }
                .action-date-badge.done { background: #F3F4F6; color: #6B7280; }

                .action-info {
                    flex: 1;
                    min-width: 0;
                }

                .action-text {
                    font-size: 0.85rem;
                    font-weight: 600;
                    color: var(--text-main);
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }

                .action-text.done {
                    text-decoration: line-through;
                    color: var(--text-muted);
                }

                .action-lead-name {
                    font-size: 0.75rem;
                    color: var(--text-muted);
                }

                /* Month Navigator */
                .actions-month-nav {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 16px;
                    padding: 12px 0;
                    margin-bottom: 8px;
                }

                .actions-month-nav button {
                    width: 36px;
                    height: 36px;
                    border: 1px solid var(--border-color);
                    background: var(--bg-body);
                    color: var(--text-main);
                    border-radius: 10px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 0.85rem;
                    transition: all 0.2s;
                }

                .actions-month-nav button:hover {
                    background: var(--primary-color);
                    color: white;
                    border-color: var(--primary-color);
                }

                .actions-month-label {
                    font-weight: 700;
                    font-size: 0.95rem;
                    color: var(--text-main);
                    min-width: 160px;
                    text-align: center;
                    text-transform: capitalize;
                }

                /* Filter Tabs */
                .actions-filter-tabs {
                    display: flex;
                    gap: 8px;
                    margin-bottom: 14px;
                    flex-wrap: wrap;
                }

                .actions-filter-tab {
                    padding: 8px 18px;
                    border-radius: 20px;
                    border: 2px solid #EF4444;
                    background: #FEE2E2;
                    color: #DC2626;
                    font-size: 0.82rem;
                    font-weight: 700;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .actions-filter-tab:hover {
                    background: #FECACA;
                }

                .actions-filter-tab.active {
                    background: #3B82F6;
                    color: white;
                    border-color: #2563EB;
                }

                .actions-filter-tab.active:hover {
                    background: #2563EB;
                }

                @media (max-width: 768px) {
                    .actions-filter-tabs {
                        flex-wrap: nowrap;
                    }
                    .actions-filter-tab {
                        flex: 1;
                        padding: 10px 8px;
                        font-size: 0.82rem;
                        min-height: 44px;
                        display: inline-flex;
                        align-items: center;
                        justify-content: center;
                        text-align: center;
                    }
                }

                /* Complete/Undo Buttons */
                .btn-complete-action, .btn-undo-action {
                    padding: 5px 12px;
                    border-radius: 8px;
                    border: none;
                    font-size: 0.72rem;
                    font-weight: 700;
                    cursor: pointer;
                    transition: all 0.2s;
                    white-space: nowrap;
                    flex-shrink: 0;
                }

                .btn-complete-action {
                    background: #DBEAFE;
                    color: #2563EB;
                }

                .btn-complete-action:hover {
                    background: #3B82F6;
                    color: white;
                }

                .btn-undo-action {
                    background: #F3F4F6;
                    color: #6B7280;
                }

                .btn-undo-action:hover {
                    background: #9CA3AF;
                    color: white;
                }

                /* Recent Leads List */
                .leads-list {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                }

                .lead-item {
                    display: flex;
                    align-items: center;
                    gap: 14px;
                    padding: 14px;
                    background: var(--bg-body);
                    border-radius: 14px;
                    transition: all 0.2s;
                }

                .lead-item:hover {
                    background: var(--border-color);
                }

                .lead-avatar {
                    width: 44px;
                    height: 44px;
                    border-radius: 12px;
                    background: linear-gradient(135deg, #8B5CF6, #A78BFA);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    font-weight: 700;
                    font-size: 1rem;
                    flex-shrink: 0;
                }

                .lead-info {
                    flex: 1;
                    min-width: 0;
                }

                .lead-name {
                    font-weight: 600;
                    color: var(--text-main);
                    font-size: 0.9rem;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }

                .lead-company {
                    font-size: 0.8rem;
                    color: var(--text-muted);
                }

                .lead-value {
                    font-weight: 700;
                    color: #3B82F6;
                    font-size: 0.9rem;
                    text-align: right;
                }

                /* Goals Progress */
                .goals-list {
                    display: flex;
                    flex-direction: column;
                    gap: 16px;
                }

                .goal-item {
                    padding: 16px;
                    background: var(--bg-body);
                    border-radius: 14px;
                }

                .goal-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 10px;
                }

                .goal-name {
                    font-weight: 600;
                    color: var(--text-main);
                    font-size: 0.9rem;
                }

                .goal-percent {
                    font-weight: 700;
                    font-size: 0.9rem;
                }

                .goal-percent.low { color: #EF4444; }
                .goal-percent.mid { color: #F59E0B; }
                .goal-percent.high { color: #10B981; }

                .goal-progress-bar {
                    height: 8px;
                    background: var(--border-color);
                    border-radius: 10px;
                    overflow: hidden;
                }

                .goal-progress-fill {
                    height: 100%;
                    border-radius: 10px;
                    transition: width 0.5s ease;
                }

                .goal-progress-fill.low { background: linear-gradient(90deg, #EF4444, #F87171); }
                .goal-progress-fill.mid { background: linear-gradient(90deg, #F59E0B, #FBBF24); }
                .goal-progress-fill.high { background: linear-gradient(90deg, #10B981, #34D399); }

                .goal-values {
                    display: flex;
                    justify-content: space-between;
                    margin-top: 8px;
                    font-size: 0.75rem;
                    color: var(--text-muted);
                }

                .empty-state {
                    text-align: center;
                    padding: 30px 20px;
                    color: var(--text-muted);
                }

                .empty-state i {
                    font-size: 2rem;
                    opacity: 0.3;
                    margin-bottom: 10px;
                }

                /* Dark mode adjustments */
                .theme-dark .stat-card {
                    background: var(--bg-card);
                    border-color: var(--border-color);
                }

                .theme-dark .stat-card:hover {
                    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
                }

                .theme-dark .stat-value.money {
                    background: linear-gradient(135deg, #60A5FA, #3B82F6);
                    -webkit-background-clip: text;
                    background-clip: text;
                }

                /* Dark mode: botones de monto y acciones legibles */
                .theme-dark .btn-complete-action {
                    background: #1E293B !important;
                    color: #fff !important;
                    border-color: #3B82F6 !important;
                }

                .theme-dark .btn-complete-action:hover {
                    background: #3B82F6 !important;
                }

                .theme-dark .btn-receipt-action {
                    background: #1E293B !important;
                    border-color: #475569 !important;
                }

                .theme-dark .btn-undo-action {
                    background: #1E293B !important;
                    color: #F87171 !important;
                    border-color: #7F1D1D !important;
                }

                .theme-dark .action-date-badge.upcoming {
                    background: #1E3A5F !important;
                    color: #93C5FD !important;
                }

                .theme-dark .actions-filter-tab {
                    background: #1E293B !important;
                    border-color: #475569 !important;
                    color: #94A3B8 !important;
                }

                .theme-dark .actions-filter-tab.active {
                    background: #3B82F6 !important;
                    color: #fff !important;
                    border-color: #2563EB !important;
                }
            </style>

            <div class="dashboard-page">
                <div class="dashboard-header">
                    <h2>Dashboard</h2>
                    <p>Resumen de tu negocio</p>
                </div>

                <div id="dashboardContent">
                    <div class="stats-grid">
                        ${[1, 2, 3, 4, 5, 6].map(() => `
                            <div class="stat-card" style="opacity: 0.5;">
                                <div style="height: 120px; display: flex; align-items: center; justify-content: center;">
                                    <i class="fas fa-spinner fa-spin" style="color: var(--text-muted);"></i>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
    },

    // Estado interno para navegación de acciones
    _actionsMonth: null,
    _actionsFilter: 'all',
    _allActions: [],

    init: async () => {
        // Inicializar mes actual
        const now = new Date();
        DashboardModule._actionsMonth = { year: now.getFullYear(), month: now.getMonth() };
        DashboardModule._actionsFilter = 'all';

        await DashboardModule.loadData();
    },

    loadData: async () => {
        const container = document.getElementById('dashboardContent');
        if (!container) return;

        let data;
        try {
            data = await DashboardService.getData();
            const { stats, recentLeads, goalsProgress, upcomingActions } = data;

            // Format revenue
            const revenueFormatted = Formatters.toCurrency(stats.revenue || 0, 'BOB');

            container.innerHTML = `
                <!-- Stats Cards -->
                <div class="stats-grid">
                    <div class="stat-card blue">
                        <div class="stat-icon"><i class="fas fa-users"></i></div>
                        <div class="stat-label">Clientes</div>
                        <div class="stat-value">${stats.clients || 0}</div>
                        <div class="stat-subtitle">Cartera total</div>
                    </div>

                    <div class="stat-card purple">
                        <div class="stat-icon"><i class="fas fa-user-plus"></i></div>
                        <div class="stat-label">Leads</div>
                        <div class="stat-value">${stats.leads || 0}</div>
                        <div class="stat-subtitle">En seguimiento</div>
                    </div>

                    <div class="stat-card amber">
                        <div class="stat-icon"><i class="fas fa-briefcase"></i></div>
                        <div class="stat-label">Proyectos</div>
                        <div class="stat-value">${stats.projects || 0}</div>
                        <div class="stat-subtitle">${(() => {
                    const s = stats.projectsByStatus || {};
                    const parts = [];
                    if (s.activos) parts.push(s.activos + ' Activo' + (s.activos > 1 ? 's' : ''));
                    if (s.finalizados) parts.push(s.finalizados + ' Finalizado' + (s.finalizados > 1 ? 's' : ''));
                    if (s.borradores) parts.push(s.borradores + ' Borrador' + (s.borradores > 1 ? 'es' : ''));
                    if (s.revision) parts.push(s.revision + ' Rev. Pago');
                    return parts.length ? parts.join(' · ') : 'Sin proyectos';
                })()}</div>
                    </div>

                    <div class="stat-card green">
                        <div class="stat-icon"><i class="fas fa-chart-line"></i></div>
                        <div class="stat-label">Pipeline</div>
                        <div class="stat-value money">${revenueFormatted}</div>
                        <div class="stat-subtitle">Valor total</div>
                    </div>

                    <div class="stat-card rose">
                        <div class="stat-icon"><i class="fas fa-trophy"></i></div>
                        <div class="stat-label">Metas</div>
                        <div class="stat-value">${stats.goalsCompleted || 0}</div>
                        <div class="stat-subtitle">Completadas</div>
                    </div>

                    <div class="stat-card cyan">
                        <div class="stat-icon"><i class="fas fa-tasks"></i></div>
                        <div class="stat-label">Acciones</div>
                        <div class="stat-value">${stats.pendingActions || 0}</div>
                        <div class="stat-subtitle">Pendientes</div>
                    </div>
                </div>

                <!-- Sections -->
                <div class="sections-grid">
                    <!-- Leads por Estado -->
                    <div class="section-card">
                        <h3 class="section-title leads">
                            <i class="fas fa-bolt"></i>
                            Leads
                        </h3>
                        <div class="actions-filter-tabs" id="leadsFilterTabs" style="margin-bottom:12px;">
                            <button class="actions-filter-tab active" data-filter="recientes">Recientes</button>
                            <button class="actions-filter-tab" data-filter="cerrados">Cerrados</button>
                            <button class="actions-filter-tab" data-filter="perdidos">Perdidos</button>
                        </div>
                        <div class="leads-list" id="leadsListContainer">
                        </div>
                    </div>

                    <!-- Goals Progress -->
                    <div class="section-card">
                        <h3 class="section-title goals">
                            <i class="fas fa-bullseye"></i>
                            Progreso de Metas
                        </h3>
                        <div class="goals-list">
                            ${goalsProgress.length > 0 ? goalsProgress.map(goal => {
                    const pClass = goal.percent < 40 ? 'low' : goal.percent < 75 ? 'mid' : 'high';
                    const currentVal = goal.type === 'leads'
                        ? goal.current
                        : Formatters.toCurrency(goal.current, goal.currency || 'BOB');
                    const targetVal = goal.type === 'leads'
                        ? goal.target
                        : Formatters.toCurrency(goal.target, goal.currency || 'BOB');
                    return `
                                    <div class="goal-item">
                                        <div class="goal-header">
                                            <span class="goal-name">${goal.name || 'Meta'}</span>
                                            <span class="goal-percent ${pClass}">${goal.percent || 0}%</span>
                                        </div>
                                        <div class="goal-progress-bar">
                                            <div class="goal-progress-fill ${pClass}" style="width: ${goal.percent || 0}%"></div>
                                        </div>
                                        <div class="goal-values">
                                            <span>${currentVal}</span>
                                            <span>${targetVal}</span>
                                        </div>
                                    </div>
                                `;
                }).join('') : `
                                <div class="empty-state">
                                    <i class="fas fa-flag-checkered"></i>
                                    <p>Sin metas configuradas</p>
                                </div>
                            `}
                        </div>
                    </div>
                </div>

                <!-- Acciones con Historial Navegable -->
                <div class="section-card" style="margin-top: 24px;">
                    <h3 class="section-title actions-upcoming">
                        <i class="fas fa-bell"></i>
                        Acciones
                    </h3>

                    <!-- Navegación por mes -->
                    <div class="actions-month-nav">
                        <button id="btnPrevMonth" title="Mes anterior"><i class="fas fa-chevron-left"></i></button>
                        <span class="actions-month-label" id="actionsMonthLabel">—</span>
                        <button id="btnNextMonth" title="Mes siguiente"><i class="fas fa-chevron-right"></i></button>
                    </div>

                    <!-- Filtros -->
                    <div class="actions-filter-tabs" id="actionsFilterTabs">
                        <button class="actions-filter-tab active" data-filter="all">Todas</button>
                        <button class="actions-filter-tab" data-filter="pending">Pendientes</button>
                        <button class="actions-filter-tab" data-filter="completed">Completadas</button>
                    </div>

                    <div class="actions-upcoming-list" id="actionsListContainer">
                        <div class="empty-state">
                            <i class="fas fa-spinner fa-spin"></i>
                            <p>Cargando...</p>
                        </div>
                    </div>
                </div>

                <!-- Proyectos - Pagos Pendientes -->
                <div class="section-card" style="margin-top: 24px;" id="projectsAlertSection">
                    <h3 class="section-title" style="color: #DC2626;">
                        <i class="fas fa-exclamation-triangle"></i>
                        Proyectos — Pagos Pendientes
                    </h3>
                    <div id="unpaidProjectsList">
                        <div class="empty-state"><i class="fas fa-spinner fa-spin"></i><p>Cargando...</p></div>
                    </div>
                </div>
            `;

        } catch (error) {
            console.error('Error loading dashboard:', error);
            container.innerHTML = '<p style="text-align:center; color:var(--text-muted);">Error cargando datos</p>';
            return; // Salir temprano si hubo error
        }

        // Mostrar alerta si hay acciones vencidas o de hoy (usando datos ya cargados)
        try {
            const actions = (data.upcomingActions || []).filter(a => !a.completed);
            const overdueActions = actions.filter(a => a.diffDays < 0);
            const todayActions = actions.filter(a => a.diffDays === 0);

            // Collect alert sections (unified)
            const alertParts = [];

            if (overdueActions.length > 0) {
                alertParts.push(`<div style="text-align:left; margin-bottom:8px;"><strong style="color:#F87171 !important;">🔴 ${overdueActions.length} cobro${overdueActions.length > 1 ? 's' : ''} vencido${overdueActions.length > 1 ? 's' : ''}</strong></div>`);
                overdueActions.forEach(a => {
                    const days = Math.abs(a.diffDays);
                    alertParts.push(`<div style="text-align:left; font-size:0.88rem; padding:4px 0; color:#FCA5A5 !important;">⚠️ ${a.leadName || a.client} — ${days}d de retraso · ${a.currency || 'Bs.'} ${(a.amount || 0).toLocaleString('es-ES')}</div>`);
                });
            }

            if (todayActions.length > 0) {
                alertParts.push(`<div style="text-align:left; margin-top:8px; margin-bottom:4px;"><strong style="color:#FBBF24 !important;">🟡 ${todayActions.length} cobro${todayActions.length > 1 ? 's' : ''} para hoy</strong></div>`);
                todayActions.forEach(a => {
                    alertParts.push(`<div style="text-align:left; font-size:0.88rem; padding:4px 0; color:#FCD34D !important;">📅 ${a.leadName || a.client} · ${a.currency || 'Bs.'} ${(a.amount || 0).toLocaleString('es-ES')}</div>`);
                });
            }

            // Cargar proyectos con pagos pendientes
            let unpaid = [];
            try {
                const allProjects = await ProjectsService.getAll();
                unpaid = allProjects.filter(p => !p.paymentConfirmed && p.status !== 'Finalizado');
                const unpaidContainer = document.getElementById('unpaidProjectsList');
                const alertSection = document.getElementById('projectsAlertSection');

                if (unpaid.length === 0) {
                    if (alertSection) alertSection.style.display = 'none';
                } else {
                    const currSym = (c) => c === 'USD' ? '$us.' : c === 'EUR' ? '€' : 'Bs.';
                    unpaidContainer.innerHTML = unpaid.map(p => `
                        <div style="display:flex; align-items:center; gap:12px; padding:12px; background:#FEF2F2; border:1px solid #FECACA; border-radius:10px; margin-bottom:8px;">
                            <span style="font-size:1.3rem;">❌</span>
                            <div style="flex:1;">
                                <div style="font-weight:700; font-size:0.88rem; color:#991B1B;">${p.name}</div>
                                <div style="font-size:0.78rem; color:#7F1D1D;">${p.client} · ${p.status}</div>
                            </div>
                            <div style="text-align:right;">
                                <div style="font-weight:800; font-size:1rem; color:#DC2626;">${currSym(p.currency)} ${(p.budget || 0).toLocaleString('es-ES', { minimumFractionDigits: 2 })}</div>
                                <div style="font-size:0.7rem; color:#991B1B;">Sin confirmar</div>
                            </div>
                        </div>
                    `).join('');

                    // Add to unified alert
                    alertParts.push(`<div style="text-align:left; margin-top:10px; padding-top:10px; border-top:1px solid #374151;"><strong style="color:#F87171 !important;">❌ ${unpaid.length} proyecto${unpaid.length > 1 ? 's' : ''} sin pago</strong></div>`);
                    unpaid.forEach(p => {
                        alertParts.push(`<div style="text-align:left; font-size:0.88rem; padding:4px 0; color:#FCA5A5 !important;">💰 ${p.name} (${p.client})</div>`);
                    });
                }
            } catch (e) { console.error('Error loading projects:', e); }

            // Show unified alert
            if (alertParts.length > 0 && typeof Swal !== 'undefined') {
                Swal.fire({
                    icon: 'warning',
                    title: '🚨 Alertas del CRM',
                    html: alertParts.join(''),
                    confirmButtonColor: '#DC2626',
                    confirmButtonText: 'Entendido',
                    timer: 8000,
                    timerProgressBar: true
                });
            }
        } catch (e) { console.error('Error loading projects:', e); }

        // Renderizar acciones con navegación por mes
        DashboardModule._allActions = data.upcomingActions || [];
        DashboardModule._allLeads = data.allLeads || [];
        DashboardModule._leadsFilter = 'recientes';
        DashboardModule.bindActionControls();
        DashboardModule.renderActions();
        DashboardModule.bindLeadsFilter();
        DashboardModule.renderLeads();
    },

    // Renderizar leads filtrados por estado
    renderLeads: () => {
        const container = document.getElementById('leadsListContainer');
        if (!container) return;

        const filter = DashboardModule._leadsFilter;
        let filtered = [];

        if (filter === 'cerrados') {
            filtered = DashboardModule._allLeads.filter(l =>
                (l.status || '').toLowerCase() === 'cerrado'
            );
        } else if (filter === 'perdidos') {
            filtered = DashboardModule._allLeads.filter(l => {
                const s = (l.status || '').toLowerCase();
                return s === 'perdido' || s === 'abandono' || s === 'descartado';
            });
        } else {
            // Recientes: no cerrados/perdidos, ordenados por fecha
            filtered = DashboardModule._allLeads.filter(l => {
                const s = (l.status || '').toLowerCase();
                return s !== 'perdido' && s !== 'abandono' && s !== 'descartado';
            });
        }

        // Ordenar por fecha de creación (más reciente primero)
        filtered.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

        if (filtered.length === 0) {
            const labels = { recientes: 'recientes', cerrados: 'cerrados', perdidos: 'perdidos' };
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-inbox"></i>
                    <p>Sin leads ${labels[filter] || ''}</p>
                </div>`;
            return;
        }

        container.innerHTML = filtered.map(lead => `
            <div class="lead-item">
                <div class="lead-avatar">${(lead.name || 'L')[0].toUpperCase()}</div>
                <div class="lead-info">
                    <div class="lead-name">${lead.name || 'Sin nombre'}</div>
                    <div class="lead-company">${lead.company || lead.source || 'Sin empresa'}</div>
                </div>
                <div class="lead-value">${Formatters.toCurrency(lead.total || 0, lead.currency || 'BOB')}</div>
            </div>
        `).join('');
    },

    // Bind de filtros de leads
    bindLeadsFilter: () => {
        const filterTabs = document.getElementById('leadsFilterTabs');
        if (!filterTabs) return;

        filterTabs.addEventListener('click', (e) => {
            const tab = e.target.closest('.actions-filter-tab');
            if (!tab) return;
            filterTabs.querySelectorAll('.actions-filter-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            DashboardModule._leadsFilter = tab.dataset.filter;
            DashboardModule.renderLeads();
        });
    },

    // Renderizar acciones filtradas por mes y estado
    renderActions: () => {
        const container = document.getElementById('actionsListContainer');
        const label = document.getElementById('actionsMonthLabel');
        if (!container || !label) return;

        const { year, month } = DashboardModule._actionsMonth;
        const filter = DashboardModule._actionsFilter;

        // Actualizar label del mes
        const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
        label.textContent = `${monthNames[month]} ${year}`;

        // Filtrar acciones por mes
        let filtered = DashboardModule._allActions.filter(a => {
            const d = new Date(a.date + 'T00:00:00');
            return d.getFullYear() === year && d.getMonth() === month;
        });

        // Filtrar por estado
        if (filter === 'pending') filtered = filtered.filter(a => !a.completed);
        else if (filter === 'completed') filtered = filtered.filter(a => a.completed);

        // Ordenar: pendientes primero (por fecha asc), luego completadas
        filtered.sort((a, b) => {
            if (a.completed !== b.completed) return a.completed ? 1 : -1;
            return new Date(a.date) - new Date(b.date);
        });

        if (filtered.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-${filter === 'completed' ? 'check-circle' : 'calendar-times'}"></i>
                    <p>${filter === 'completed' ? 'Sin acciones completadas' : filter === 'pending' ? 'Sin acciones pendientes' : 'Sin acciones'} en ${monthNames[month]}</p>
                </div>`;
            return;
        }

        container.innerHTML = filtered.map((action, filteredIdx) => {
            const dueDate = new Date(action.date + 'T00:00:00');
            const dateStr = dueDate.toLocaleDateString('es-BO', { day: '2-digit', month: 'short' });
            let labelText = dateStr;
            if (!action.completed) {
                if (action.diffDays === 0) labelText = 'Hoy';
                else if (action.diffDays === 1) labelText = 'Mañana';
                else if (action.diffDays < 0) labelText = `${Math.abs(action.diffDays)}d vencida`;
            } else {
                labelText = `✓ ${dateStr}`;
            }

            const statusClass = action.completed ? 'completed-action' : action.status;
            const badgeClass = action.completed ? 'done' : action.status;
            const textClass = action.completed ? 'done' : '';

            const recurLabel = action.recurring ? `<span style="font-size:0.6rem; color:#3B82F6; margin-left:4px; background:#DBEAFE; padding:1px 4px; border-radius:4px;">${action.recurring === 'yearly' ? '🔄Anual' : '🔄Mes'}</span>` : '';

            const isRecurring = action.recurring && action.recurring !== false;
            const isBilling = action.isBilling || false;
            const currSymbol = action.leadCurrency === 'USD' ? '$us.' : 'Bs.';
            const amountShort = isBilling && action.leadTotal ? `${currSymbol}${Number(action.leadTotal).toLocaleString('es-BO')}` : '';

            let actionBtns = '';
            if (action.completed) {
                if (isBilling) {
                    // Billing completado: ojo para recibo + deshacer
                    actionBtns = `
                        <div style="display:flex; gap:6px; align-items:center;">
                            <button class="btn-receipt-action" data-action-idx="${filteredIdx}" style="width:36px;height:36px;border:1px solid #D1D5DB;background:#EFF6FF;border-radius:8px;cursor:pointer;font-size:1rem;" title="Ver Recibo PDF">👁️</button>
                            <button class="btn-undo-action" data-lead="${action.leadId}" data-idx="${action.actionIndex}" data-date="${action.date}" data-recurring="true" style="font-size:0.7rem;padding:6px 10px;border:1px solid #FCA5A5;background:#FEF2F2;color:#DC2626;border-radius:8px;cursor:pointer;">↩</button>
                        </div>`;
                } else {
                    // Acción normal completada: solo deshacer
                    actionBtns = `<button class="btn-undo-action" data-lead="${action.leadId}" data-idx="${action.actionIndex}" data-date="${action.date}" data-recurring="${isRecurring}" style="font-size:0.7rem;padding:6px 10px;border:1px solid #FCA5A5;background:#FEF2F2;color:#DC2626;border-radius:8px;cursor:pointer;">↩ Deshacer</button>`;
                }
            } else {
                if (isBilling) {
                    // Billing pendiente: botón con monto
                    actionBtns = `
                        <button class="btn-complete-action" data-lead="${action.leadId}" data-idx="${action.actionIndex}" data-date="${action.date}" data-recurring="true" style="font-size:0.72rem;padding:6px 12px;border:1px solid #93C5FD;background:#EFF6FF;color:#1E40AF;border-radius:8px;cursor:pointer;white-space:nowrap;font-weight:600;">
                            ${amountShort ? '💰 ' + amountShort : '💰 Cobrar'}
                        </button>`;
                } else {
                    // Acción normal pendiente: ojo + completar
                    actionBtns = `
                        <div style="display:flex; gap:6px; align-items:center;">
                            <button class="btn-ficha-action" data-action-idx="${filteredIdx}" style="width:36px;height:36px;border:1px solid #D1D5DB;background:#EFF6FF;border-radius:8px;cursor:pointer;font-size:1rem;" title="Ver Ficha PDF">👁️</button>
                            <button class="btn-complete-action" data-lead="${action.leadId}" data-idx="${action.actionIndex}" data-date="${action.date}" data-recurring="${isRecurring}" style="font-size:0.72rem;padding:6px 12px;border:1px solid #93C5FD;background:#EFF6FF;color:#1E40AF;border-radius:8px;cursor:pointer;white-space:nowrap;font-weight:600;">
                                ✅ Completar
                            </button>
                        </div>`;
                }
            }

            const delayInfo = !action.completed && action.diffDays < 0
                ? `<span style="color:#DC2626;font-size:0.65rem;font-weight:600;"> · ${Math.abs(action.diffDays)}d retraso</span>` : '';

            return `
                <div class="action-upcoming-item ${statusClass}">
                    <div class="action-date-badge ${badgeClass}">${labelText}</div>
                    <div class="action-info">
                        <div class="action-text ${textClass}">${action.actionText}${recurLabel}</div>
                        <div class="action-lead-name">${action.leadName}${delayInfo}${action.completedAt ? ` · Completada ${action.completedAt}` : ''}</div>
                    </div>
                    ${actionBtns}
                </div>`;
        }).join('');

        // Bind event listeners para botones
        container.querySelectorAll('.btn-complete-action').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const leadId = e.currentTarget.dataset.lead;
                const idx = parseInt(e.currentTarget.dataset.idx);
                const dateStr = e.currentTarget.dataset.date;
                const isRecurring = e.currentTarget.dataset.recurring === 'true';
                e.currentTarget.disabled = true;
                e.currentTarget.textContent = '⏳...';
                try {
                    const result = await DashboardService.completeAction(leadId, idx, true, isRecurring ? dateStr : null);
                    if (result.ok) {
                        // Si es billing, auto-completar acciones no monetarias del mismo lead
                        if (idx === -1) {
                            const allActions = DashboardModule._allActions;
                            const relatedActions = allActions.filter(a => a.leadId === leadId && !a.isBilling && !a.completed && a.actionIndex >= 0);
                            for (const ra of relatedActions) {
                                try {
                                    await DashboardService.completeAction(ra.leadId, ra.actionIndex, true, null);
                                } catch (e) { console.error('Error auto-completando acción:', e); }
                            }
                        }
                        const data = await DashboardService.getData(true);
                        DashboardModule._allActions = data.upcomingActions || [];
                        DashboardModule.renderActions();
                        const pendingEl = document.querySelector('.stat-card.cyan .stat-value');
                        if (pendingEl) pendingEl.textContent = data.stats.pendingActions || 0;
                    } else {
                        if (typeof Swal !== 'undefined') Swal.fire({ icon: 'error', title: 'Error', text: result.error || 'No se pudo completar la acción' });
                        DashboardModule.renderActions();
                    }
                } catch (err) {
                    console.error('Error completando acción:', err);
                    if (typeof Swal !== 'undefined') Swal.fire({ icon: 'error', title: 'Error', text: err.message || 'Error inesperado' });
                    DashboardModule.renderActions();
                }
            });
        });

        container.querySelectorAll('.btn-undo-action').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const leadId = e.currentTarget.dataset.lead;
                const idx = parseInt(e.currentTarget.dataset.idx);
                const dateStr = e.currentTarget.dataset.date;
                const isRecurring = e.currentTarget.dataset.recurring === 'true';
                e.currentTarget.disabled = true;
                e.currentTarget.textContent = '⏳...';
                try {
                    const result = await DashboardService.completeAction(leadId, idx, false, isRecurring ? dateStr : null);
                    if (result.ok) {
                        const data = await DashboardService.getData(true);
                        DashboardModule._allActions = data.upcomingActions || [];
                        DashboardModule.renderActions();
                        const pendingEl = document.querySelector('.stat-card.cyan .stat-value');
                        if (pendingEl) pendingEl.textContent = data.stats.pendingActions || 0;
                    } else {
                        if (typeof Swal !== 'undefined') Swal.fire({ icon: 'error', title: 'Error', text: result.error || 'No se pudo deshacer la acción' });
                        DashboardModule.renderActions();
                    }
                } catch (err) {
                    console.error('Error deshaciendo acción:', err);
                    DashboardModule.renderActions();
                }
            });
        });

        // Bind receipt buttons (👁️) - billing completado
        DashboardModule._filteredActions = filtered;
        container.querySelectorAll('.btn-receipt-action').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const actionIdx = parseInt(e.currentTarget.dataset.actionIdx);
                const action = DashboardModule._filteredActions[actionIdx];
                if (!action) return;
                await DashboardModule.generateReceipt(action);
            });
        });

        // Bind ficha buttons (👁️) - acciones no monetarias
        container.querySelectorAll('.btn-ficha-action').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const actionIdx = parseInt(e.currentTarget.dataset.actionIdx);
                const action = DashboardModule._filteredActions[actionIdx];
                if (!action) return;
                await DashboardModule.generateFichaPDF(action);
            });
        });
    },

    // Generador de Recibo PDF (HTML2PDF profesional)
    generateReceipt: async (action) => {
        const now = new Date();
        const receiptNum = `REC-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;

        // Datos del recibo
        const currSymbol = action.leadCurrency === 'USD' ? '$us.' : 'Bs.';
        const rawAmount = Number(action.leadTotal || 0);
        const amount = rawAmount.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

        // Período: mes anterior → fecha cobro
        const dueDate = new Date(action.date + 'T00:00:00');
        const prevMonth = new Date(dueDate);
        prevMonth.setMonth(prevMonth.getMonth() - 1);
        const fmtFull = (d) => {
            const day = String(d.getDate()).padStart(2, '0');
            const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
            return `${day} de ${meses[d.getMonth()]} de ${d.getFullYear()}`;
        };
        const periodoDesde = fmtFull(prevMonth);
        const periodoHasta = fmtFull(dueDate);
        const fechaHoy = fmtFull(now);
        const horaHoy = now.toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' });

        // Frecuencia legible
        const freqMap = { monthly: 'Mensual', yearly: 'Anual', custom: 'Personalizado' };
        const freqLabel = freqMap[action.recurring] || (action.recurring ? action.recurring : 'Mensual');

        // Monto en letras (bolivianos)
        const numberToWords = (n) => {
            const unidades = ['', 'un', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve'];
            const decenas = ['', 'diez', 'veinte', 'treinta', 'cuarenta', 'cincuenta', 'sesenta', 'setenta', 'ochenta', 'noventa'];
            const especiales = ['diez', 'once', 'doce', 'trece', 'catorce', 'quince', 'dieciséis', 'diecisiete', 'dieciocho', 'diecinueve'];
            const centenas = ['', 'ciento', 'doscientos', 'trescientos', 'cuatrocientos', 'quinientos', 'seiscientos', 'setecientos', 'ochocientos', 'novecientos'];

            if (n === 0) return 'cero';
            if (n === 100) return 'cien';

            let result = '';
            const miles = Math.floor(n / 1000);
            const resto = n % 1000;

            if (miles > 0) {
                if (miles === 1) result += 'mil';
                else {
                    const centenasMil = Math.floor(miles / 100);
                    const restoMil = miles % 100;
                    if (centenasMil > 0) result += (centenasMil === 1 && restoMil === 0 && miles === 100) ? 'cien' : centenas[centenasMil];
                    if (restoMil > 0) {
                        if (centenasMil > 0) result += ' ';
                        if (restoMil < 10) result += unidades[restoMil];
                        else if (restoMil < 20) result += especiales[restoMil - 10];
                        else {
                            result += decenas[Math.floor(restoMil / 10)];
                            if (restoMil % 10 > 0) result += ' y ' + unidades[restoMil % 10];
                        }
                    }
                    result += ' mil';
                }
                if (resto > 0) result += ' ';
            }

            if (resto > 0 || miles === 0) {
                const c = Math.floor(resto / 100);
                const d = resto % 100;
                if (c > 0) result += (c === 1 && d === 0) ? 'cien' : centenas[c];
                if (d > 0) {
                    if (c > 0) result += ' ';
                    if (d < 10) result += unidades[d];
                    else if (d < 20) result += especiales[d - 10];
                    else {
                        result += decenas[Math.floor(d / 10)];
                        if (d % 10 > 0) result += ' y ' + unidades[d % 10];
                    }
                }
            }

            return result.charAt(0).toUpperCase() + result.slice(1);
        };

        const intPart = Math.floor(rawAmount);
        const decPart = Math.round((rawAmount - intPart) * 100);
        const currWord = action.leadCurrency === 'USD' ? 'Dólares Americanos' : 'Bolivianos';
        const amountWords = `(${numberToWords(intPart)} ${String(decPart).padStart(2, '0')}/100 ${currWord})`;

        const serviceText = action.billingService || action.actionText || 'Servicio contratado';
        const conceptText = action.billingConcept || '';

        const logoUrl = 'https://raw.githubusercontent.com/magicdesignefecto/Magic-Design-Efecto-Servicios-Gestion-de-Redes-Sociales/77cbcdf9e5992cc519ac102d1182d9397f23f12a/logo%20svg%20magic%20design%20efecto.svg';

        const html = `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Recibo - ${action.leadName}</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
    <style>
        *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
        html, body { margin: 0; padding: 0; width: 480px; overflow-x: hidden; }
        body { font-family: 'Inter', 'Segoe UI', system-ui, sans-serif; color: #1E293B; background: white; -webkit-text-size-adjust: 100%; }

        .page { width: 100%; max-width: 480px; margin: 0 auto; background: white; overflow: hidden; }

        /* ═══ HEADER ═══ */
        .receipt-header {
            background: linear-gradient(135deg, #0F172A 0%, #1E3A5F 50%, #2563EB 100%);
            color: white;
            padding: 28px 28px 24px;
            display: flex;
            align-items: center;
            justify-content: space-between;
        }
        .header-left { display: flex; align-items: center; gap: 14px; }
        .header-logo {
            width: 44px; height: 44px;
            background: white;
            border-radius: 10px;
            padding: 6px;
            display: flex; align-items: center; justify-content: center;
            box-shadow: 0 2px 8px rgba(0,0,0,0.15);
        }
        .header-logo img { width: 100%; height: 100%; object-fit: contain; }
        .header-brand { font-size: 1rem; font-weight: 800; letter-spacing: -0.3px; text-transform: uppercase; }
        .header-sub { font-size: 0.72rem; font-weight: 400; color: rgba(255,255,255,0.65); margin-top: 3px; line-height: 1.3; }
        .header-slogan { font-size: 0.68rem; font-style: italic; color: rgba(255,255,255,0.5); margin-top: 2px; }

        /* ═══ TÍTULO RECIBO ═══ */
        .receipt-title-bar {
            background: #F8FAFC;
            border-bottom: 2px solid #E2E8F0;
            padding: 18px 28px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .receipt-title {
            font-size: 0.7rem;
            text-transform: uppercase;
            letter-spacing: 3px;
            color: #64748B;
            font-weight: 700;
        }
        .receipt-title span {
            display: block;
            font-size: 1.3rem;
            letter-spacing: -0.5px;
            color: #0F172A;
            font-weight: 800;
            margin-top: 2px;
        }
        .receipt-number {
            text-align: right;
            font-size: 0.72rem;
            color: #94A3B8;
            font-weight: 500;
        }
        .receipt-number strong {
            display: block;
            font-size: 0.8rem;
            color: #475569;
            font-weight: 700;
            margin-bottom: 2px;
        }

        /* ═══ CONTENT ═══ */
        .content { padding: 24px 28px 20px; }

        /* ═══ SECTION LABEL ═══ */
        .section-label {
            font-size: 0.6rem;
            text-transform: uppercase;
            letter-spacing: 2px;
            color: #94A3B8;
            font-weight: 700;
            margin-bottom: 8px;
        }

        /* ═══ CLIENTE ═══ */
        .client-section {
            margin-bottom: 28px;
            padding-bottom: 22px;
            border-bottom: 1px solid #E2E8F0;
        }
        .client-name {
            font-size: 1.25rem;
            font-weight: 800;
            color: #0F172A;
            letter-spacing: -0.3px;
            margin-bottom: 3px;
        }
        .client-company {
            font-size: 0.88rem;
            color: #475569;
            font-weight: 500;
            margin-bottom: 3px;
        }
        .client-phone {
            font-size: 0.82rem;
            color: #64748B;
        }

        /* ═══ CONCEPTO ═══ */
        .concept-section {
            margin-bottom: 28px;
            padding-bottom: 22px;
            border-bottom: 1px solid #E2E8F0;
        }
        .concept-service {
            font-size: 1.05rem;
            font-weight: 700;
            color: #0F172A;
            margin-bottom: 6px;
        }
        .concept-platforms {
            font-size: 0.85rem;
            color: #475569;
            margin-bottom: 14px;
        }
        .concept-period-label {
            font-size: 0.7rem;
            text-transform: uppercase;
            letter-spacing: 1.5px;
            color: #94A3B8;
            font-weight: 600;
            margin-bottom: 6px;
        }
        .concept-period {
            font-size: 1rem;
            font-weight: 700;
            color: #1E293B;
            line-height: 1.5;
        }
        .concept-freq {
            display: inline-block;
            margin-top: 6px;
            background: #EFF6FF;
            color: #2563EB;
            padding: 3px 12px;
            border-radius: 20px;
            font-size: 0.72rem;
            font-weight: 700;
        }

        /* ═══ MONTO ═══ */
        .amount-section {
            background: linear-gradient(135deg, #F0FDF4, #ECFDF5);
            border: 1px solid #BBF7D0;
            border-radius: 12px;
            padding: 22px 24px;
            margin-bottom: 24px;
            text-align: center;
        }
        .amount-value {
            font-size: 2.2rem;
            font-weight: 800;
            color: #059669;
            letter-spacing: -1px;
            margin-bottom: 4px;
        }
        .amount-words {
            font-size: 0.78rem;
            color: #64748B;
            font-weight: 500;
            font-style: italic;
        }

        /* ═══ FECHA DE PAGO ═══ */
        .payment-date-section {
            background: #F8FAFC;
            border: 1px solid #E2E8F0;
            border-radius: 10px;
            padding: 16px 20px;
            margin-bottom: 28px;
        }
        .payment-date-value {
            font-size: 0.95rem;
            font-weight: 700;
            color: #0F172A;
            margin-top: 4px;
        }
        .payment-date-time {
            font-size: 0.78rem;
            color: #94A3B8;
            margin-top: 2px;
        }

        /* ═══ FIRMA ═══ */
        .signature-section {
            padding-top: 20px;
            border-top: 1px solid #E2E8F0;
            margin-bottom: 0;
        }
        .signature-line {
            width: 200px;
            border-bottom: 1px solid #CBD5E1;
            margin-bottom: 10px;
            padding-bottom: 6px;
        }
        .signature-name {
            font-size: 0.95rem;
            font-weight: 700;
            color: #0F172A;
        }
        .signature-role {
            font-size: 0.78rem;
            color: #64748B;
            margin-top: 2px;
        }
        .signature-company {
            font-size: 0.78rem;
            color: #94A3B8;
            font-weight: 600;
            margin-top: 1px;
        }

        /* ═══ FOOTER ═══ */
        .receipt-footer {
            margin-top: 24px;
            padding: 16px 28px 60px;
            background: linear-gradient(135deg, #0F172A 0%, #1E3A5F 100%);
            text-align: center;
        }
        .footer-text {
            font-size: 0.68rem;
            color: rgba(255,255,255,0.5);
            line-height: 1.6;
        }
        .footer-text strong {
            color: rgba(255,255,255,0.8);
        }

        /* ═══ DOWNLOAD BUTTON ═══ */
        .btn-download {
            display: block;
            width: calc(100% - 48px);
            margin: 20px auto;
            padding: 14px;
            background: linear-gradient(135deg, #0F172A, #2563EB);
            color: white;
            border: none;
            border-radius: 10px;
            font-family: inherit;
            font-size: 0.9rem;
            font-weight: 700;
            cursor: pointer;
            text-align: center;
        }
        .btn-download:active { opacity: 0.8; }
        .btn-download:disabled { opacity: 0.6; cursor: wait; }
    </style>
</head>
<body>
    <div class="page">
        <!-- HEADER -->
        <div class="receipt-header">
            <div class="header-left">
                <div class="header-logo"><img src="${logoUrl}" alt="Logo"></div>
                <div>
                    <div class="header-brand">Magic Design Efecto</div>
                    <div class="header-sub">Estudio de Estrategia y Marketing Digital</div>
                    <div class="header-slogan">Estrategias digitales que convierten</div>
                </div>
            </div>
        </div>

        <!-- TÍTULO -->
        <div class="receipt-title-bar">
            <div class="receipt-title">
                Documento
                <span>RECIBO DE PAGO</span>
            </div>
            <div class="receipt-number">
                <strong>Nº ${receiptNum}</strong>
                ${fechaHoy}
            </div>
        </div>

        <div class="content">
            <!-- CLIENTE -->
            <div class="client-section">
                <div class="section-label">Cliente</div>
                <div class="client-name">${action.leadName}</div>
                ${action.leadCompany ? `<div class="client-company">${action.leadCompany}</div>` : ''}
                ${action.leadPhone ? `<div class="client-phone">Tel: ${action.leadPhone}</div>` : ''}
            </div>

            <!-- CONCEPTO -->
            <div class="concept-section">
                <div class="section-label">Concepto</div>
                <div class="concept-service">${serviceText}</div>
                ${conceptText ? `<div class="concept-platforms">Plataformas: ${conceptText}</div>` : ''}

                <div class="concept-period-label">Período de servicio</div>
                <div class="concept-period">
                    ${periodoDesde}<br>al ${periodoHasta}
                </div>
                <span class="concept-freq">${freqLabel}</span>
            </div>

            <!-- MONTO -->
            <div class="amount-section">
                <div class="section-label" style="text-align:center; margin-bottom:10px;">Monto Pagado</div>
                <div class="amount-value">${currSymbol} ${amount}</div>
                <div class="amount-words">${amountWords}</div>
            </div>

            <!-- FECHA DE PAGO -->
            <div class="payment-date-section">
                <div class="section-label">Fecha de Pago</div>
                <div class="payment-date-value">${fechaHoy}</div>
                <div class="payment-date-time">Hora: ${horaHoy}</div>
            </div>

            <!-- FIRMA -->
            <div class="signature-section">
                <div class="section-label">Cobro Procesado Por</div>
                <div class="signature-line"></div>
                <div class="signature-name">Diego Gonzales</div>
                <div class="signature-role">Gestor Marketing Digital</div>
                <div class="signature-company">Magic Design Efecto</div>
            </div>
        </div>

        <!-- FOOTER -->
        <div class="receipt-footer">
            <div class="footer-text">
                <strong>Magic Design Efecto</strong> · Estudio de Estrategia y Marketing Digital<br>
                magicdesignefecto.com · +591 63212806 · La Paz, Bolivia<br>
                Generado automáticamente el ${fechaHoy} a las ${horaHoy}
            </div>
        </div>
    </div>

    <button class="btn-download" id="btnDownload">📥 Descargar Recibo PDF</button>

    <script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"><\/script>
    <script>
        function generatePDF() {
            const btn = document.getElementById('btnDownload');
            const el = document.querySelector('.page');
            btn.textContent = '⏳ Generando PDF...';
            btn.disabled = true;

            setTimeout(() => {
                const pxToMm = 0.2646;
                const pdfWidth = 480 * pxToMm;
                const pdfHeight = (el.scrollHeight + 40) * pxToMm;

                html2pdf().set({
                    margin: 0,
                    filename: 'Recibo_${action.leadName.replace(/[^a-zA-Z0-9 ]/g, '_').replace(/\s+/g, '_')}_${receiptNum}.pdf',
                    image: { type: 'jpeg', quality: 0.98 },
                    html2canvas: { scale: 2, useCORS: true, backgroundColor: '#ffffff', scrollY: 0, width: 480, windowWidth: 480, x: 0 },
                    jsPDF: { unit: 'mm', format: [pdfWidth, pdfHeight], orientation: 'portrait' },
                    pagebreak: { mode: ['avoid-all'] }
                }).from(el).save().then(() => {
                    btn.textContent = '✅ PDF descargado';
                    setTimeout(() => { btn.textContent = '📥 Descargar Recibo PDF'; btn.disabled = false; }, 2500);
                }).catch(() => {
                    btn.textContent = '❌ Error, intenta de nuevo';
                    setTimeout(() => { btn.textContent = '📥 Descargar Recibo PDF'; btn.disabled = false; }, 2000);
                });
            }, 500);
        }

        document.getElementById('btnDownload').addEventListener('click', generatePDF);
    <\/script>
</body>
</html>`;

        const w = window.open('', '_blank');
        w.document.write(html);
        w.document.close();
    },

    // Generador de Ficha PDF (para acciones no monetarias)
    generateFichaPDF: async (action) => {
        // Obtener datos completos del lead
        let lead = null;
        try {
            const { LeadsService } = await import('../services/leads.service.js');
            lead = await LeadsService.getById(action.leadId);
        } catch (e) {
            console.error('Error cargando lead:', e);
        }
        if (!lead) {
            if (typeof Swal !== 'undefined') Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo cargar la información del lead' });
            return;
        }

        const now = new Date();
        const fichaNum = `FIC-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;

        const fmtFull = (d) => {
            const day = String(d.getDate()).padStart(2, '0');
            const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
            return `${day} de ${meses[d.getMonth()]} de ${d.getFullYear()}`;
        };
        const fechaHoy = fmtFull(now);
        const horaHoy = now.toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' });

        const currSymbol = (c) => c === 'USD' ? '$us.' : c === 'EUR' ? '€' : 'Bs.';
        const curr = currSymbol(lead.currency || 'BOB');

        // Services badges
        const servicesBadges = lead.services && lead.services.length > 0
            ? lead.services.map(s => `<span style="background:#EFF6FF; color:#2563EB; padding:4px 10px; border-radius:20px; font-size:0.72rem; font-weight:600; border:1px solid #BFDBFE;">${s}</span>`).join(' ')
            : '<span style="color:#94A3B8; font-size:0.8rem;">Sin servicios</span>';

        // Actions list
        const actionsHTML = lead.actions && lead.actions.length > 0
            ? lead.actions.map((act, idx) => {
                const txt = typeof act === 'string' ? act : act.text;
                const d = typeof act === 'string' ? '' : (act.date || '');
                const completed = typeof act === 'string' ? false : (act.completed || false);
                let dateLabel = '';
                if (d) {
                    const dd = new Date(d + 'T00:00:00');
                    dateLabel = dd.toLocaleDateString('es-BO', { day: '2-digit', month: 'short', year: 'numeric' });
                }
                return `<div style="display:flex; gap:8px; align-items:center; padding:6px 0; border-bottom:1px solid #F1F5F9;">
                    <span style="background:${completed ? '#10B981' : '#3B82F6'}; color:white; padding:2px 8px; border-radius:4px; font-size:0.68rem; font-weight:700;">${completed ? '✓' : String.fromCharCode(65 + idx) + ')'}</span>
                    <span style="flex:1; font-size:0.82rem; color:#1E293B;${completed ? ' text-decoration:line-through; opacity:0.6;' : ''}">${txt}</span>
                    ${dateLabel ? `<span style="font-size:0.72rem; color:#64748B;">${dateLabel}</span>` : ''}
                </div>`;
            }).join('') : '';

        // Billing info
        let billingHTML = '';
        if (lead.billing && lead.billing.active) {
            const b = lead.billing;
            const freqLabels = { monthly: 'Mensual', yearly: 'Anual', custom: 'Personalizado' };
            billingHTML = `
                <div style="margin-top:4px;">
                    <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; font-size:0.82rem;">
                        ${b.service ? `<div><div style="color:#94A3B8; font-size:0.68rem; text-transform:uppercase; letter-spacing:1px; margin-bottom:2px;">Servicio</div><div style="font-weight:700; color:#0F172A;">${b.service}</div></div>` : ''}
                        <div><div style="color:#94A3B8; font-size:0.68rem; text-transform:uppercase; letter-spacing:1px; margin-bottom:2px;">Monto</div><div style="font-weight:800; color:#059669;">${currSymbol(b.currency || lead.currency)} ${Number(b.amount || 0).toLocaleString('es-BO', { minimumFractionDigits: 2 })}</div></div>
                        <div><div style="color:#94A3B8; font-size:0.68rem; text-transform:uppercase; letter-spacing:1px; margin-bottom:2px;">Frecuencia</div><div style="font-weight:600;">${freqLabels[b.frequency] || b.frequency || '-'}</div></div>
                        <div><div style="color:#94A3B8; font-size:0.68rem; text-transform:uppercase; letter-spacing:1px; margin-bottom:2px;">D\u00eda de cobro</div><div style="font-weight:600;">D\u00eda ${b.dayOfMonth || '-'}</div></div>
                        ${b.advance > 0 ? `<div style="grid-column:span 2;"><div style="color:#94A3B8; font-size:0.68rem; text-transform:uppercase; letter-spacing:1px; margin-bottom:2px;">Adelanto</div><div style="font-weight:700; color:#D97706;">${currSymbol(b.currency || lead.currency)} ${Number(b.advance).toLocaleString('es-BO', { minimumFractionDigits: 2 })}${b.advanceConcept ? ' (' + b.advanceConcept + ')' : ''}</div></div>` : ''}
                    </div>
                </div>`;
        }

        const statusColors = { 'Nuevo': '#3B82F6', 'Contactado': '#F59E0B', 'Interesado': '#8B5CF6', 'Cerrado': '#10B981', 'Perdido': '#EF4444', 'Pausa': '#6B7280' };
        const stColor = statusColors[lead.status] || '#3B82F6';

        const logoUrl = 'https://raw.githubusercontent.com/magicdesignefecto/Magic-Design-Efecto-Servicios-Gestion-de-Redes-Sociales/77cbcdf9e5992cc519ac102d1182d9397f23f12a/logo%20svg%20magic%20design%20efecto.svg';

        const html = `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Ficha - ${lead.name}</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
    <style>
        *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
        html, body { margin: 0; padding: 0; width: 480px; overflow-x: hidden; }
        body { font-family: 'Inter', 'Segoe UI', system-ui, sans-serif; color: #1E293B; background: white; }
        .page { width: 100%; max-width: 480px; margin: 0 auto; background: white; overflow: hidden; }

        .receipt-header {
            background: linear-gradient(135deg, #0F172A 0%, #1E3A5F 50%, #2563EB 100%);
            color: white;
            padding: 28px 28px 24px;
            display: flex; align-items: center; justify-content: space-between;
        }
        .header-left { display: flex; align-items: center; gap: 14px; }
        .header-logo { width: 44px; height: 44px; background: white; border-radius: 10px; padding: 6px; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 8px rgba(0,0,0,0.15); }
        .header-logo img { width: 100%; height: 100%; object-fit: contain; }
        .header-brand { font-size: 1rem; font-weight: 800; letter-spacing: -0.3px; text-transform: uppercase; }
        .header-sub { font-size: 0.72rem; font-weight: 400; color: rgba(255,255,255,0.65); margin-top: 3px; }
        .header-slogan { font-size: 0.68rem; font-style: italic; color: rgba(255,255,255,0.5); margin-top: 2px; }

        .title-bar { background: #F8FAFC; border-bottom: 2px solid #E2E8F0; padding: 18px 28px; display: flex; justify-content: space-between; align-items: center; }
        .title-label { font-size: 0.7rem; text-transform: uppercase; letter-spacing: 3px; color: #64748B; font-weight: 700; }
        .title-label span { display: block; font-size: 1.3rem; letter-spacing: -0.5px; color: #0F172A; font-weight: 800; margin-top: 2px; }
        .title-number { text-align: right; font-size: 0.72rem; color: #94A3B8; font-weight: 500; }
        .title-number strong { display: block; font-size: 0.8rem; color: #475569; font-weight: 700; margin-bottom: 2px; }

        .content { padding: 24px 28px 20px; }
        .section-label { font-size: 0.6rem; text-transform: uppercase; letter-spacing: 2px; color: #94A3B8; font-weight: 700; margin-bottom: 8px; }
        .section { margin-bottom: 24px; padding-bottom: 20px; border-bottom: 1px solid #E2E8F0; }
        .section:last-child { border-bottom: none; margin-bottom: 0; }

        .receipt-footer {
            margin-top: 24px; padding: 16px 28px 60px;
            background: linear-gradient(135deg, #0F172A 0%, #1E3A5F 100%);
            text-align: center;
        }
        .footer-text { font-size: 0.68rem; color: rgba(255,255,255,0.5); line-height: 1.6; }
        .footer-text strong { color: rgba(255,255,255,0.8); }

        .btn-download {
            display: block; width: calc(100% - 48px); margin: 20px auto; padding: 14px;
            background: linear-gradient(135deg, #0F172A, #2563EB); color: white; border: none;
            border-radius: 10px; font-family: inherit; font-size: 0.9rem; font-weight: 700; cursor: pointer; text-align: center;
        }
        .btn-download:active { opacity: 0.8; }
        .btn-download:disabled { opacity: 0.6; cursor: wait; }
    </style>
</head>
<body>
    <div class="page">
        <div class="receipt-header">
            <div class="header-left">
                <div class="header-logo"><img src="${logoUrl}" alt="Logo"></div>
                <div>
                    <div class="header-brand">Magic Design Efecto</div>
                    <div class="header-sub">Estudio de Estrategia y Marketing Digital</div>
                    <div class="header-slogan">Estrategias digitales que convierten</div>
                </div>
            </div>
        </div>

        <div class="title-bar">
            <div class="title-label">Documento<span>FICHA DE PROSPECTO</span></div>
            <div class="title-number"><strong>N\u00ba ${fichaNum}</strong>${fechaHoy}</div>
        </div>

        <div class="content">
            <!-- CLIENTE -->
            <div class="section">
                <div class="section-label">Cliente</div>
                <div style="display:flex; gap:14px; align-items:center;">
                    <div style="width:46px; height:46px; background:linear-gradient(135deg,#E0E7FF,#C7D2FE); color:#4338CA; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:1.2rem; font-weight:800;">${lead.name.charAt(0)}</div>
                    <div style="flex:1;">
                        <div style="font-size:1.15rem; font-weight:800; color:#0F172A; letter-spacing:-0.3px;">${lead.name}</div>
                        <div style="font-size:0.85rem; color:#475569;">${lead.company || 'Particular'}</div>
                    </div>
                    <span style="background:${stColor}20; color:${stColor}; padding:4px 12px; border-radius:20px; font-size:0.72rem; font-weight:700; border:1px solid ${stColor}40;">${lead.status}</span>
                </div>
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-top:14px; font-size:0.82rem;">
                    ${lead.phone ? `<div><div style="color:#94A3B8; font-size:0.68rem; text-transform:uppercase; letter-spacing:1px; margin-bottom:2px;">Tel\u00e9fono</div><div style="font-weight:600;">${lead.phone}</div></div>` : ''}
                    ${lead.email ? `<div><div style="color:#94A3B8; font-size:0.68rem; text-transform:uppercase; letter-spacing:1px; margin-bottom:2px;">Email</div><div style="font-weight:500; word-break:break-all;">${lead.email}</div></div>` : ''}
                    ${lead.source ? `<div><div style="color:#94A3B8; font-size:0.68rem; text-transform:uppercase; letter-spacing:1px; margin-bottom:2px;">Fuente</div><div style="font-weight:600;">${lead.source}</div></div>` : ''}
                    ${lead.date ? `<div><div style="color:#94A3B8; font-size:0.68rem; text-transform:uppercase; letter-spacing:1px; margin-bottom:2px;">Registro</div><div style="font-weight:600;">${lead.date}</div></div>` : ''}
                    ${lead.address ? `<div style="grid-column:span 2;"><div style="color:#94A3B8; font-size:0.68rem; text-transform:uppercase; letter-spacing:1px; margin-bottom:2px;">Direcci\u00f3n</div><div style="font-weight:500;">${lead.address}</div></div>` : ''}
                </div>
            </div>

            <!-- SERVICIOS -->
            <div class="section">
                <div class="section-label">Servicios de Inter\u00e9s</div>
                <div style="display:flex; flex-wrap:wrap; gap:6px;">${servicesBadges}</div>
            </div>

            ${actionsHTML ? `
            <!-- ACCIONES -->
            <div class="section">
                <div class="section-label">Acciones a Seguir</div>
                ${actionsHTML}
            </div>` : ''}

            <!-- FINANCIERO -->
            <div class="section" style="border-bottom:none;">
                <div class="section-label">Resumen Financiero</div>
                <div style="background:#F8FAFC; border:1px solid #E2E8F0; border-radius:10px; padding:16px;">
                    <div style="display:flex; justify-content:space-between; margin-bottom:6px; font-size:0.88rem;">
                        <span>Inversi\u00f3n:</span><span style="font-weight:600;">${curr} ${Number(lead.investment || 0).toLocaleString('es-BO', { minimumFractionDigits: 2 })}</span>
                    </div>
                    ${lead.billing && lead.billing.advance > 0 ? `<div style="display:flex; justify-content:space-between; margin-bottom:6px; font-size:0.88rem; color:#D97706;">
                        <span>Adelanto${lead.billing.advanceConcept ? ' (' + lead.billing.advanceConcept + ')' : ''}:</span><span style="font-weight:600;">- ${curr} ${Number(lead.billing.advance).toLocaleString('es-BO', { minimumFractionDigits: 2 })}</span>
                    </div>` : ''}
                    ${lead.discount > 0 ? `<div style="display:flex; justify-content:space-between; margin-bottom:6px; font-size:0.88rem; color:#EF4444;">
                        <span>Descuento:</span><span style="font-weight:600;">- ${curr} ${Number(lead.discount).toLocaleString('es-BO', { minimumFractionDigits: 2 })}</span>
                    </div>` : ''}
                    <div style="border-top:1px dashed #CBD5E1; padding-top:10px; margin-top:6px; display:flex; justify-content:space-between; align-items:center;">
                        <span style="font-weight:700; font-size:0.95rem;">TOTAL</span>
                        <span style="font-size:1.4rem; font-weight:800; color:#059669;">${curr} ${Number(lead.total || 0).toLocaleString('es-BO', { minimumFractionDigits: 2 })}</span>
                    </div>
                </div>
            </div>

            ${billingHTML ? `
            <!-- COBRO REGULAR -->
            <div class="section" style="border-bottom:none; margin-top:-8px;">
                <div style="background:#F0FDF4; border:1px solid #BBF7D0; border-radius:10px; padding:16px;">
                    <div class="section-label" style="color:#166534;">Cobro Regular</div>
                    ${billingHTML}
                </div>
            </div>` : ''}
        </div>

        <div class="receipt-footer">
            <div class="footer-text">
                <strong>Magic Design Efecto</strong> \u00b7 Estudio de Estrategia y Marketing Digital<br>
                magicdesignefecto.com \u00b7 +591 63212806 \u00b7 La Paz, Bolivia<br>
                Generado autom\u00e1ticamente el ${fechaHoy} a las ${horaHoy}
            </div>
        </div>
    </div>

    <button class="btn-download" id="btnDownload">\ud83d\udce5 Descargar Ficha PDF</button>

    <script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"><\\/script>
    <script>
        function generatePDF() {
            const btn = document.getElementById('btnDownload');
            const el = document.querySelector('.page');
            btn.textContent = '\u23f3 Generando PDF...';
            btn.disabled = true;

            setTimeout(() => {
                const pxToMm = 0.2646;
                const pdfWidth = 480 * pxToMm;
                const pdfHeight = (el.scrollHeight + 40) * pxToMm;

                html2pdf().set({
                    margin: 0,
                    filename: 'Ficha_${lead.name.replace(/[^a-zA-Z0-9 ]/g, '_').replace(/\s+/g, '_')}_${fichaNum}.pdf',
                    image: { type: 'jpeg', quality: 0.98 },
                    html2canvas: { scale: 2, useCORS: true, backgroundColor: '#ffffff', scrollY: 0, width: 480, windowWidth: 480, x: 0 },
                    jsPDF: { unit: 'mm', format: [pdfWidth, pdfHeight], orientation: 'portrait' },
                    pagebreak: { mode: ['avoid-all'] }
                }).from(el).save().then(() => {
                    btn.textContent = '\u2705 PDF descargado';
                    setTimeout(() => { btn.textContent = '\ud83d\udce5 Descargar Ficha PDF'; btn.disabled = false; }, 2500);
                }).catch(() => {
                    btn.textContent = '\u274c Error, intenta de nuevo';
                    setTimeout(() => { btn.textContent = '\ud83d\udce5 Descargar Ficha PDF'; btn.disabled = false; }, 2000);
                });
            }, 500);
        }

        document.getElementById('btnDownload').addEventListener('click', generatePDF);
    <\\/script>
</body>
</html>`;

        const w = window.open('', '_blank');
        w.document.write(html);
        w.document.close();
    },

    // Bind de navegación de mes y filtros (llamar después del render principal)
    bindActionControls: () => {
        const prevBtn = document.getElementById('btnPrevMonth');
        const nextBtn = document.getElementById('btnNextMonth');
        const filterTabs = document.getElementById('actionsFilterTabs');

        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                const m = DashboardModule._actionsMonth;
                if (m.month === 0) { m.month = 11; m.year--; }
                else { m.month--; }
                DashboardModule.renderActions();
            });
        }

        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                const m = DashboardModule._actionsMonth;
                if (m.month === 11) { m.month = 0; m.year++; }
                else { m.month++; }
                DashboardModule.renderActions();
            });
        }

        if (filterTabs) {
            filterTabs.addEventListener('click', (e) => {
                const tab = e.target.closest('.actions-filter-tab');
                if (!tab) return;
                filterTabs.querySelectorAll('.actions-filter-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                DashboardModule._actionsFilter = tab.dataset.filter;
                DashboardModule.renderActions();
            });
        }
    },

    destroy: () => {
        DashboardModule._allActions = [];
        DashboardModule._actionsMonth = null;
        DashboardModule._actionsFilter = 'all';
    }
};

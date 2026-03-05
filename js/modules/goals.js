import { Modal } from '../components/Modal.js';
import { GoalsService } from '../services/goals.service.js';

export const GoalsModule = {
    currentGoalId: null,
    eventsInitialized: false,
    isSaving: false,

    render: async () => {
        const content = `
            <style>
                .goals-page { padding: 0; min-height: 100%; }

                .goals-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 32px;
                }

                .goals-header h2 {
                    font-size: 1.5rem;
                    font-weight: 700;
                    color: var(--text-main);
                    margin: 0;
                }

                .goals-header p {
                    color: var(--text-muted);
                    margin: 4px 0 0 0;
                    font-size: 0.875rem;
                }

                .btn-new-goal {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 10px 20px;
                    background: var(--primary);
                    color: white;
                    border: none;
                    border-radius: 10px;
                    font-size: 0.875rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }

                .btn-new-goal:hover {
                    background: var(--primary-dark);
                    transform: translateY(-1px);
                }

                .goals-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
                    gap: 24px;
                }

                .goal-card {
                    background: var(--bg-card);
                    border: 1px solid var(--border-color);
                    border-radius: 16px;
                    padding: 24px;
                    position: relative;
                }

                .goal-card::before {
                    content: '';
                    position: absolute;
                    top: 0; left: 0; right: 0;
                    height: 3px;
                    border-radius: 16px 16px 0 0;
                }

                .goal-card.type-sales::before { background: linear-gradient(90deg, #10B981, #34D399); }
                .goal-card.type-leads::before { background: linear-gradient(90deg, #3B82F6, #60A5FA); }

                .goal-card-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    margin-bottom: 16px;
                }

                .goal-info h3 {
                    font-size: 1rem;
                    font-weight: 600;
                    color: var(--text-main);
                    margin: 0 0 4px 0;
                }

                .goal-type-badge {
                    display: inline-flex;
                    padding: 4px 10px;
                    border-radius: 20px;
                    font-size: 0.7rem;
                    font-weight: 600;
                    text-transform: uppercase;
                }

                .goal-type-badge.sales { background: rgba(16, 185, 129, 0.15); color: #10B981; }
                .goal-type-badge.leads { background: rgba(59, 130, 246, 0.15); color: #3B82F6; }

                .goal-actions { display: flex; gap: 4px; }
                .goal-actions button {
                    width: 32px; height: 32px;
                    border: none; border-radius: 8px;
                    background: transparent;
                    color: var(--text-muted);
                    cursor: pointer;
                }
                .goal-actions .btn-edit:hover { color: var(--primary); background: var(--bg-body); }
                .goal-actions .btn-delete:hover { color: #EF4444; background: var(--bg-body); }

                .goal-progress {
                    display: flex;
                    align-items: center;
                    gap: 24px;
                    margin-bottom: 16px;
                }

                .progress-ring {
                    position: relative;
                    width: 100px; height: 100px;
                    flex-shrink: 0;
                }

                .progress-ring svg { transform: rotate(-90deg); }
                .progress-ring .ring-bg { fill: none; stroke: var(--bg-body); stroke-width: 8; }
                .progress-ring .ring-fill { fill: none; stroke-width: 8; stroke-linecap: round; }
                .progress-ring .ring-fill.sales { stroke: #10B981; }
                .progress-ring .ring-fill.leads { stroke: #3B82F6; }

                .progress-center {
                    position: absolute;
                    top: 50%; left: 50%;
                    transform: translate(-50%, -50%);
                    text-align: center;
                }

                .progress-percent { font-size: 1.5rem; font-weight: 700; color: var(--text-main); }
                .progress-label { font-size: 0.65rem; color: var(--text-muted); text-transform: uppercase; }

                .progress-stats { flex: 1; }
                .stat-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid var(--border-color); }
                .stat-row:last-child { border-bottom: none; }
                .stat-label { font-size: 0.8rem; color: var(--text-muted); }
                .stat-value { font-size: 0.875rem; font-weight: 600; color: var(--text-main); }

                .goal-dates {
                    display: flex; gap: 16px;
                    padding-top: 16px;
                    border-top: 1px solid var(--border-color);
                }

                .date-item { flex: 1; display: flex; align-items: center; gap: 8px; }
                .date-item i { color: var(--text-muted); font-size: 0.875rem; }
                .date-info { display: flex; flex-direction: column; }
                .date-label { font-size: 0.7rem; color: var(--text-muted); text-transform: uppercase; }
                .date-value { font-size: 0.8rem; color: var(--text-main); font-weight: 500; }

                .goals-empty {
                    text-align: center;
                    padding: 60px 20px;
                    color: var(--text-muted);
                    grid-column: 1 / -1;
                }

                /* Modal Form */
                .goal-form { display: flex; flex-direction: column; gap: 20px; }
                .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
                .form-group { display: flex; flex-direction: column; gap: 6px; }
                .form-group.full-width { grid-column: 1 / -1; }
                .form-group label { font-size: 0.8rem; font-weight: 600; color: var(--text-main); }
                .form-group input, .form-group select {
                    padding: 12px 14px;
                    border: 1px solid var(--border-color);
                    border-radius: 10px;
                    font-size: 0.9rem;
                    background: var(--bg-input);
                    color: var(--text-main);
                }

                .dynamic-fields { display: none; }
                .dynamic-fields.visible { display: block; }

                .current-value-box {
                    background: var(--bg-body);
                    padding: 16px;
                    border-radius: 10px;
                    text-align: center;
                }
                .current-label { font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; margin-bottom: 4px; }
                .current-value { font-size: 1.5rem; font-weight: 700; color: var(--text-main); }

                .btn-submit-goal {
                    padding: 14px;
                    background: var(--primary);
                    color: white;
                    border: none;
                    border-radius: 10px;
                    font-size: 0.9rem;
                    font-weight: 600;
                    cursor: pointer;
                }
                .btn-submit-goal:hover { background: var(--primary-dark); }
                .btn-submit-goal:disabled { opacity: 0.7; cursor: not-allowed; }

                @media (max-width: 640px) {
                    .goals-header { flex-direction: column; align-items: flex-start; gap: 16px; }
                    .goals-grid { grid-template-columns: 1fr; }
                    .form-row { grid-template-columns: 1fr; }
                    .goal-actions { gap: 8px; }
                    .goal-actions button {
                        width: 40px; height: 40px;
                        font-size: 1rem;
                    }
                }
            </style>

            <div class="goals-page">
                <div class="goals-header">
                    <div>
                        <h2>Metas</h2>
                        <p>Define y monitorea tus objetivos</p>
                    </div>
                    <button class="btn-new-goal" id="btnNewGoal">
                        <i class="fas fa-plus"></i>
                        Nueva Meta
                    </button>
                </div>

                <div id="goalsContainer" class="goals-grid">
                    <div class="loader"></div>
                </div>
            </div>

            ${Modal.render('Nueva Meta', `
                <form id="goalForm" class="goal-form">
                    <div class="form-group full-width">
                        <label>Nombre de la meta</label>
                        <input type="text" id="goalName" placeholder="Ej: Facturación Enero 2026" required>
                    </div>
                    
                    <div class="form-group full-width">
                        <label>Tipo de meta</label>
                        <select id="goalType" required>
                            <option value="leads">📊 Leads (cantidad)</option>
                            <option value="sales">💰 Facturación (dinero)</option>
                        </select>
                    </div>

                    <!-- CAMPOS PARA LEADS -->
                    <div id="leadsFields" class="dynamic-fields visible">
                        <div class="form-group">
                            <label>🎯 Objetivo de leads (cantidad)</label>
                            <input type="number" id="goalLeadsTarget" placeholder="Ej: 50" min="1">
                        </div>
                    </div>

                    <!-- CAMPOS PARA FACTURACIÓN -->
                    <div id="salesFields" class="dynamic-fields">
                        <div class="form-row">
                            <div class="form-group">
                                <label>🎯 Objetivo de facturación</label>
                                <input type="number" id="goalSalesTarget" placeholder="Ej: 5000" min="1" step="0.01">
                            </div>
                            <div class="form-group">
                                <label>Moneda</label>
                                <select id="goalCurrency">
                                    <option value="BOB">Bs. (Bolivianos)</option>
                                    <option value="USD">$ (Dólares)</option>
                                    <option value="EUR">€ (Euros)</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label>📅 Fecha de inicio</label>
                            <input type="date" id="goalStartDate" required>
                        </div>
                        <div class="form-group">
                            <label>📅 Fecha fin</label>
                            <input type="date" id="goalTargetDate" required>
                        </div>
                    </div>

                    <button type="submit" class="btn-submit-goal">
                        Crear Meta
                    </button>
                </form>
            `, 'modalGoal')}
        `;

        return content;
    },

    init: async () => {
        Modal.initEvents('modalGoal');
        await GoalsModule.loadGoals();

        if (!GoalsModule.eventsInitialized) {
            GoalsModule.setupEvents();
            GoalsModule.eventsInitialized = true;
        }
    },

    setupEvents: () => {
        const btnNew = document.getElementById('btnNewGoal');
        if (btnNew) {
            btnNew.addEventListener('click', () => GoalsModule.openModal());
        }

        const form = document.getElementById('goalForm');
        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                e.stopPropagation();

                if (GoalsModule.isSaving) return;
                GoalsModule.isSaving = true;

                try {
                    await GoalsModule.saveGoal();
                } finally {
                    GoalsModule.isSaving = false;
                }
            });
        }

        // Toggle fields based on type
        const typeSelect = document.getElementById('goalType');
        if (typeSelect) {
            typeSelect.addEventListener('change', () => GoalsModule.toggleFields());
        }

        const container = document.getElementById('goalsContainer');
        if (container) {
            container.addEventListener('click', async (e) => {
                const editBtn = e.target.closest('.btn-edit');
                const deleteBtn = e.target.closest('.btn-delete');

                if (editBtn) await GoalsModule.editGoal(editBtn.dataset.id);
                if (deleteBtn) await GoalsModule.deleteGoal(deleteBtn.dataset.id);
            });
        }
    },

    toggleFields: () => {
        const type = document.getElementById('goalType').value;
        const leadsFields = document.getElementById('leadsFields');
        const salesFields = document.getElementById('salesFields');

        if (type === 'leads') {
            leadsFields.classList.add('visible');
            salesFields.classList.remove('visible');
        } else {
            leadsFields.classList.remove('visible');
            salesFields.classList.add('visible');
        }
    },

    openModal: (goal = null) => {
        GoalsModule.currentGoalId = goal ? goal.id : null;

        const today = new Date().toISOString().split('T')[0];
        const endOfMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0];

        document.getElementById('goalName').value = goal?.name || '';
        document.getElementById('goalType').value = goal?.type || 'leads';
        document.getElementById('goalLeadsTarget').value = goal?.type === 'leads' ? goal?.target || '' : '';
        document.getElementById('goalSalesTarget').value = goal?.type === 'sales' ? goal?.target || '' : '';
        document.getElementById('goalCurrency').value = goal?.currency || 'BOB';
        document.getElementById('goalStartDate').value = goal?.startDate || today;
        document.getElementById('goalTargetDate').value = goal?.targetDate || endOfMonth;

        GoalsModule.toggleFields();

        const submitBtn = document.querySelector('.btn-submit-goal');
        const modalTitle = document.querySelector('#modalGoal .modal-header h3');

        if (goal) {
            if (submitBtn) submitBtn.textContent = 'Guardar Cambios';
            if (modalTitle) modalTitle.textContent = 'Editar Meta';
        } else {
            if (submitBtn) submitBtn.textContent = 'Crear Meta';
            if (modalTitle) modalTitle.textContent = 'Nueva Meta';
        }

        Modal.open('modalGoal');
    },

    saveGoal: async () => {
        const submitBtn = document.querySelector('.btn-submit-goal');
        if (submitBtn) {
            if (submitBtn.disabled) return;
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';
        }

        const type = document.getElementById('goalType').value;

        // Obtener objetivo según el tipo
        const target = type === 'leads'
            ? document.getElementById('goalLeadsTarget').value
            : document.getElementById('goalSalesTarget').value;

        const goalData = {
            name: document.getElementById('goalName').value.trim(),
            type: type,
            target: parseFloat(target) || 0,
            currency: type === 'sales' ? document.getElementById('goalCurrency').value : null,
            startDate: document.getElementById('goalStartDate').value,
            targetDate: document.getElementById('goalTargetDate').value
        };

        try {
            if (GoalsModule.currentGoalId) {
                await GoalsService.update(GoalsModule.currentGoalId, goalData);
                Swal.fire({ icon: 'success', title: 'Meta actualizada', timer: 1500, showConfirmButton: false });
            } else {
                await GoalsService.create(goalData);
                Swal.fire({ icon: 'success', title: 'Meta creada', timer: 1500, showConfirmButton: false });
            }

            Modal.close('modalGoal');
            await GoalsModule.loadGoals();
        } catch (error) {
            console.error('Error saving goal:', error);
            Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo guardar la meta' });
        } finally {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Crear Meta';
            }
        }
    },

    editGoal: async (goalId) => {
        const goals = await GoalsService.getAll();
        const goal = goals.find(g => g.id === goalId);
        if (goal) GoalsModule.openModal(goal);
    },

    deleteGoal: async (goalId) => {
        const result = await Swal.fire({
            title: '¿Eliminar meta?',
            text: 'Esta acción no se puede deshacer',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#EF4444',
            cancelButtonColor: '#6B7280',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
            await GoalsService.delete(goalId);
            Swal.fire({ icon: 'success', title: 'Eliminada', timer: 1500, showConfirmButton: false });
            await GoalsModule.loadGoals();
        }
    },

    loadGoals: async () => {
        const container = document.getElementById('goalsContainer');
        if (!container) return;

        try {
            const goals = await GoalsService.getAll();

            if (goals.length === 0) {
                container.innerHTML = `
                    <div class="goals-empty">
                        <i class="fas fa-bullseye" style="font-size:3rem; opacity:0.3; margin-bottom:16px;"></i>
                        <h3 style="color:var(--text-main); margin:0 0 8px 0;">Sin metas definidas</h3>
                        <p>Crea tu primera meta de leads o facturación</p>
                    </div>
                `;
                return;
            }

            container.innerHTML = goals.map(goal => GoalsModule.renderCard(goal)).join('');
            await GoalsModule.checkNotifications(goals);

        } catch (error) {
            console.error('Error loading goals:', error);
        }
    },

    renderCard: (goal) => {
        const percent = goal.target > 0 ? Math.min(100, Math.round((goal.current / goal.target) * 100)) : 0;
        const radius = 42;
        const circumference = 2 * Math.PI * radius;
        const offset = circumference - (percent / 100) * circumference;

        const isLeads = goal.type === 'leads';
        const typeLabel = isLeads ? 'Leads' : 'Facturación';
        const icon = isLeads ? '📊' : '💰';

        // Formatear valores según tipo
        const formatValue = (value) => {
            if (isLeads) {
                // Para leads: solo número (cantidad)
                return Math.round(value).toLocaleString('es-ES');
            } else {
                // Para facturación: con moneda
                const symbol = { BOB: 'Bs.', USD: '$', EUR: '€' }[goal.currency] || 'Bs.';
                return `${symbol} ${value.toLocaleString('es-ES', { minimumFractionDigits: 2 })}`;
            }
        };

        const formatDate = (dateStr) => {
            if (!dateStr) return '—';
            const date = new Date(dateStr + 'T00:00:00');
            return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
        };

        return `
            <div class="goal-card type-${goal.type}">
                <div class="goal-card-header">
                    <div class="goal-info">
                        <h3>${goal.name}</h3>
                        <span class="goal-type-badge ${goal.type}">${icon} ${typeLabel}</span>
                    </div>
                    <div class="goal-actions">
                        <button class="btn-edit" data-id="${goal.id}" title="Editar">
                            <i class="fas fa-pen"></i>
                        </button>
                        <button class="btn-delete" data-id="${goal.id}" title="Eliminar">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>

                <div class="goal-progress">
                    <div class="progress-ring">
                        <svg width="100" height="100" viewBox="0 0 100 100">
                            <circle class="ring-bg" cx="50" cy="50" r="${radius}"></circle>
                            <circle class="ring-fill ${goal.type}" cx="50" cy="50" r="${radius}"
                                style="stroke-dasharray: ${circumference}; stroke-dashoffset: ${offset};">
                            </circle>
                        </svg>
                        <div class="progress-center">
                            <div class="progress-percent">${percent}%</div>
                            <div class="progress-label">logrado</div>
                        </div>
                    </div>

                    <div class="progress-stats">
                        <div class="stat-row">
                            <span class="stat-label">${isLeads ? 'Leads actuales' : 'Facturación actual'}</span>
                            <span class="stat-value">${formatValue(goal.current)}</span>
                        </div>
                        <div class="stat-row">
                            <span class="stat-label">Objetivo</span>
                            <span class="stat-value">${formatValue(goal.target)}</span>
                        </div>
                        <div class="stat-row">
                            <span class="stat-label">Restante</span>
                            <span class="stat-value">${formatValue(Math.max(0, goal.target - goal.current))}</span>
                        </div>
                    </div>
                </div>

                <div class="goal-dates">
                    <div class="date-item">
                        <i class="fas fa-play-circle"></i>
                        <div class="date-info">
                            <span class="date-label">Inicio</span>
                            <span class="date-value">${formatDate(goal.startDate)}</span>
                        </div>
                    </div>
                    <div class="date-item">
                        <i class="fas fa-flag-checkered"></i>
                        <div class="date-info">
                            <span class="date-label">Fin</span>
                            <span class="date-value">${formatDate(goal.targetDate)}</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    checkNotifications: async (goals) => {
        for (const goal of goals) {
            const percent = goal.target > 0 ? Math.round((goal.current / goal.target) * 100) : 0;

            if (percent >= 80 && !goal.notificationShown && percent < 100) {
                await Swal.fire({
                    icon: 'info',
                    title: '¡Casi lo logras! 🎯',
                    html: `<p><strong>${goal.name}</strong></p><p>Has alcanzado el <strong>${percent}%</strong></p>`,
                    confirmButtonText: '¡Seguir!',
                    confirmButtonColor: '#0056D2'
                });
                await GoalsService.markNotificationShown(goal.id);
            }

            if (percent >= 100 && !goal.notificationShown) {
                await Swal.fire({
                    icon: 'success',
                    title: '¡Meta cumplida! 🎉',
                    html: `<p><strong>${goal.name}</strong></p>`,
                    confirmButtonText: '¡Celebrar!',
                    confirmButtonColor: '#10B981'
                });
                await GoalsService.markNotificationShown(goal.id);
            }
        }
    },

    destroy: () => {
        GoalsModule.currentGoalId = null;
        GoalsModule.eventsInitialized = false;
        GoalsModule.isSaving = false;
    }
};

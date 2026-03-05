import { Modal } from '../components/Modal.js';
import { ProjectsService } from '../services/projects.service.js';
import { ClientsService } from '../services/clients.service.js';
import { SettingsService } from '../services/settings.service.js';
import { auth } from '../core/firebase-config.js';

export const ProjectsModule = {
    currentProjectId: null,

    render: async () => {
        const [clients, availableServices] = await Promise.all([
            ClientsService.getAll(),
            SettingsService.getServicesWithDetails()
        ]);

        const clientOptions = clients.map(c => `<option value="${c.name}" data-phone="${c.phone || ''}">${c.name}</option>`).join('');
        const servicesCheckboxes = availableServices.map(svc => `
            <label class="service-option" style="display:flex; align-items:center; justify-content:space-between;">
                <div style="display:flex; align-items:center; gap:8px;">
                    <input type="checkbox" class="service-chk" value="${svc.name}" data-price="${svc.price || 0}">
                    <span>${svc.name}</span>
                </div>
                <span style="background:#DBEAFE; color:#2563EB; padding:2px 8px; border-radius:10px; font-size:0.72rem; font-weight:700;">${svc.price ? 'Bs. ' + Number(svc.price).toLocaleString('es-ES') : 'S/P'}</span>
            </label>
        `).join('');

        const content = `
            <style>
                .projects-page { min-height: 100%; }
                .projects-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; flex-wrap: wrap; gap: 15px; }
                .projects-header h2 { font-size: 1.5rem; font-weight: 700; color: var(--text-main); margin: 0; }

                .btn-new-project { display: flex; align-items: center; gap: 8px; padding: 10px 20px; background: var(--primary); color: white; border: none; border-radius: 10px; font-size: 0.875rem; font-weight: 600; cursor: pointer; }
                .btn-new-project:hover { background: var(--primary-dark); }

                .projects-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 20px; }

                .project-card { background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 16px; padding: 20px; position: relative; transition: all 0.2s; }
                .project-card:hover { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(0,0,0,0.1); }
                .project-card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px; border-radius: 16px 16px 0 0; }
                .project-card.status-borrador::before { background: #64748B; }
                .project-card.status-revision-pago::before { background: #F59E0B; }
                .project-card.status-activo::before { background: #3B82F6; }
                .project-card.status-finalizado::before { background: #10B981; }

                .project-card-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px; }
                .project-name { font-size: 1rem; font-weight: 700; color: var(--text-main); margin: 0 0 4px 0; }
                .project-client { font-size: 0.85rem; color: var(--text-muted); }

                .project-status { padding: 4px 10px; border-radius: 20px; font-size: 0.7rem; font-weight: 600; }
                .project-status.borrador { background: rgba(100,116,139,0.15); color: #64748B; }
                .project-status.revision-pago { background: rgba(245,158,11,0.15); color: #F59E0B; }
                .project-status.activo { background: rgba(59,130,246,0.15); color: #3B82F6; }
                .project-status.finalizado { background: rgba(16,185,129,0.15); color: #10B981; }

                .project-meta { display: flex; gap: 16px; margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px solid var(--border-color); flex-wrap: wrap; }
                .meta-item { display: flex; align-items: center; gap: 6px; font-size: 0.8rem; color: var(--text-muted); white-space: nowrap; }

                .project-finance { display: flex; justify-content: space-between; align-items: center; padding: 12px; background: var(--bg-body); border-radius: 10px; margin-bottom: 12px; gap: 8px; overflow: visible; }
                .project-finance > div { min-width: 0; flex-shrink: 1; }
                .finance-label { font-size: 0.75rem; color: var(--text-muted); white-space: nowrap; }
                .finance-value { font-size: 1.1rem; font-weight: 700; white-space: nowrap; }
                .finance-value.positive { color: #10B981; }
                .finance-value.negative { color: #EF4444; }

                .project-actions { display: flex; gap: 8px; }
                .btn-action { flex: 1; padding: 8px; border: 1px solid var(--border-color); border-radius: 8px; background: transparent; color: var(--text-main); font-size: 0.8rem; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px; transition: all 0.15s; }
                .btn-action:hover { background: var(--bg-body); }
                .btn-action.primary { background: var(--primary); color: white; border-color: var(--primary); }
                .btn-action.danger:hover { color: #EF4444; border-color: #EF4444; }

                /* Form Styles */
                .form-section { background: var(--bg-body); padding: 16px; border-radius: 12px; margin-bottom: 16px; }
                .form-section-title { font-weight: 700; font-size: 0.85rem; color: var(--text-main); margin-bottom: 12px; }
                .form-group { margin-bottom: 12px; }
                .form-label { font-size: 0.75rem; color: var(--text-muted); margin-bottom: 4px; display: block; }
                .form-input, .form-select { width: 100%; padding: 10px 12px; border: 1px solid var(--border-color); border-radius: 8px; font-size: 0.9rem; background: var(--bg-input); color: var(--text-main); box-sizing: border-box; color-scheme: auto; }
                input[type="date"].form-input { color: var(--text-main); }
                input[type="date"].form-input::-webkit-datetime-edit { color: var(--text-main); }
                input[type="date"].form-input::-webkit-calendar-picker-indicator { opacity: 0.7; cursor: pointer; }
                .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; align-items: end; }

                /* Services Dropdown */
                .services-dropdown { position: relative; }
                .services-trigger { padding: 10px 12px; border: 1px solid var(--border-color); border-radius: 8px; background: var(--bg-input); color: var(--text-main); cursor: pointer; display: flex; justify-content: space-between; }
                .services-list { display: none; position: absolute; top: 100%; left: 0; right: 0; background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 8px; max-height: 150px; overflow-y: auto; z-index: 100; padding: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); }
                .services-list.active { display: block; }
                .service-option { display: flex; align-items: center; gap: 8px; padding: 8px; border-radius: 6px; cursor: pointer; }
                .service-option:hover { background: var(--bg-body); }

                .btn-submit { width: 100%; padding: 14px; background: var(--primary); color: white; border: none; border-radius: 10px; font-size: 0.9rem; font-weight: 600; cursor: pointer; }
                .btn-submit:disabled { opacity: 0.7; cursor: not-allowed; }

                /* Tabs */
                .tabs-nav { display: flex; gap: 4px; border-bottom: 2px solid var(--border-color); margin-bottom: 20px; }
                .tab-btn { padding: 12px 20px; border: none; background: transparent; color: var(--text-muted); font-weight: 600; cursor: pointer; border-bottom: 2px solid transparent; margin-bottom: -2px; transition: all 0.2s; }
                .tab-btn:hover { color: var(--text-main); }
                .tab-btn.active { color: var(--primary); border-bottom-color: var(--primary); }
                .tab-content { display: none; animation: fadeIn 0.3s; }
                .tab-content.active { display: block; }
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

                /* Task Item */
                .task-item { display: flex; align-items: center; gap: 12px; padding: 12px; background: var(--bg-body); border-radius: 10px; margin-bottom: 8px; }
                .task-checkbox { width: 20px; height: 20px; cursor: pointer; }
                .task-text { flex: 1; font-size: 0.9rem; color: var(--text-main); }
                .task-text.completed { text-decoration: line-through; color: var(--text-muted); }
                .task-delete { background: none; border: none; color: var(--text-muted); cursor: pointer; padding: 4px; }
                .task-delete:hover { color: #EF4444; }
                .add-task-row { display: flex; gap: 8px; margin-top: 12px; flex-wrap: wrap; }
                .add-task-row input { flex: 1; }
                .add-task-row input[type="date"] { min-width: 140px; color: var(--text-main); }
                .btn-add-task { padding: 10px 16px; background: var(--primary); color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; white-space: nowrap; }

                /* Finance Section */
                .finance-summary { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 20px; }
                .finance-box { background: var(--bg-body); padding: 16px; border-radius: 12px; text-align: center; }
                .finance-box-label { font-size: 0.75rem; color: var(--text-muted); margin-bottom: 4px; }
                .finance-box-value { font-size: 1.2rem; font-weight: 700; }

                .payment-item { display: flex; justify-content: space-between; align-items: center; padding: 12px; background: var(--bg-body); border-radius: 10px; margin-bottom: 8px; }
                .payment-info { flex: 1; }
                .payment-concept { font-size: 0.9rem; font-weight: 600; color: var(--text-main); }
                .payment-date { font-size: 0.75rem; color: var(--text-muted); }
                .payment-amount { font-size: 1rem; font-weight: 700; }
                .payment-amount.income { color: #10B981; }
                .payment-amount.expense { color: #EF4444; }

                .add-payment-form { display: grid; grid-template-columns: 2fr 1fr 1fr auto; gap: 8px; margin-top: 16px; padding-top: 16px; border-top: 1px solid var(--border-color); }
                .btn-income, .btn-expense { padding: 10px 16px; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; }
                .btn-income { background: #10B981; color: white; }
                .btn-expense { background: #EF4444; color: white; }

                /* Conversion Calculator */
                .conversion-calc { background: linear-gradient(135deg, rgba(59,130,246,0.08), rgba(16,185,129,0.08)); border: 1px solid var(--border-color); border-radius: 12px; padding: 16px; margin-bottom: 20px; }
                .conversion-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 0.9rem; }
                .conversion-row.total { border-top: 2px solid var(--border-color); margin-top: 8px; padding-top: 10px; font-weight: 700; font-size: 1rem; }
                .conversion-label { color: var(--text-muted); }
                .conversion-value { font-weight: 600; color: var(--text-main); }
                .conversion-value.green { color: #10B981; }
                .conversion-value.red { color: #EF4444; }

                /* Finance Preview in form */
                .finance-preview { background: rgba(16,185,129,0.08); border: 1px dashed #10B981; border-radius: 10px; padding: 12px; margin-top: 12px; }
                .finance-preview .preview-row { display: flex; justify-content: space-between; font-size: 0.85rem; padding: 3px 0; }
                .finance-preview .preview-value { font-weight: 700; color: #10B981; }

                /* KPI Section */
                .kpi-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 12px; }

                /* Report Button */
                .btn-report { width: 100%; padding: 14px; background: linear-gradient(135deg, #1E293B, #334155); color: white; border: none; border-radius: 10px; font-size: 0.9rem; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; margin-top: 16px; transition: all 0.2s; }
                .btn-report:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(0,0,0,0.2); }

                .empty-state { text-align: center; padding: 40px 20px; color: var(--text-muted); }
                .empty-state i { font-size: 2.5rem; opacity: 0.3; margin-bottom: 12px; }

                @media (max-width: 640px) {
                    .projects-grid { grid-template-columns: 1fr; }
                    .form-row { grid-template-columns: 1fr; }
                    .finance-summary { grid-template-columns: 1fr; }
                    .add-payment-form { grid-template-columns: 1fr; }
                    .kpi-grid { grid-template-columns: 1fr; }
                    .project-finance { flex-wrap: wrap; gap: 8px; }
                    .project-finance > div { min-width: auto; flex-shrink: 0; }
                    .finance-value { font-size: 1rem; }
                    .add-task-row { flex-direction: column; }
                    .add-task-row input[type="date"] { width: 100%; }
                }
            </style>

            <div class="projects-page">
                <div class="projects-header">
                    <div>
                        <h2>Proyectos</h2>
                        <p style="color: var(--text-muted); margin-top: 4px; font-size: 0.875rem;">Control de ejecución y rentabilidad</p>
                    </div>
                    <button class="btn-new-project" id="btnNewProject">
                        <i class="fas fa-plus"></i>
                        Nuevo Proyecto
                    </button>
                </div>

                <div id="projectsContainer" class="projects-grid">
                    <div class="loader"></div>
                </div>
            </div>

            ${Modal.render('Nuevo Proyecto', `
                <form id="projectForm">
                    <div class="form-section">
                        <div class="form-section-title">📋 Datos del Proyecto</div>
                        <div class="form-group">
                            <label class="form-label">Nombre del proyecto *</label>
                            <input type="text" name="name" class="form-input" placeholder="Ej: Campaña Carnaval 2026" required>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label class="form-label">Cliente *</label>
                                <select name="client" class="form-select" required>
                                    <option value="">Seleccionar...</option>
                                    ${clientOptions}
                                </select>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Estado</label>
                                <select name="status" class="form-select">
                                    <option value="Borrador">📝 Borrador</option>
                                    <option value="Revisión Pago">💳 Revisión Pago</option>
                                    <option value="Activo" selected>🟢 Activo</option>
                                    <option value="Finalizado">✅ Finalizado</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div class="form-section">
                        <div class="form-section-title">📅 Planificación</div>
                        <div class="form-row">
                            <div class="form-group">
                                <label class="form-label">Fecha inicio</label>
                                <input type="date" name="startDate" class="form-input" required>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Fecha entrega</label>
                                <input type="date" name="endDate" class="form-input" required>
                            </div>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Objetivo del proyecto</label>
                            <textarea name="objective" class="form-input" rows="2" placeholder="¿Qué se logrará con este proyecto?"></textarea>
                        </div>
                    </div>

                    <div class="form-section">
                        <div class="form-section-title">🛠️ Servicios</div>
                        <div class="services-dropdown">
                            <div class="services-trigger" id="servicesTrigger">
                                <span id="servicesText">Seleccionar servicios...</span>
                                <i class="fas fa-chevron-down"></i>
                            </div>
                            <div class="services-list" id="servicesList">
                                ${servicesCheckboxes}
                            </div>
                        </div>
                    </div>

                    <div class="form-section" style="background: rgba(16,185,129,0.1);">
                        <div class="form-section-title" style="color: #10B981;">💰 Finanzas del Proyecto</div>
                        <div class="form-row">
                            <div class="form-group" style="flex:2;">
                                <label class="form-label">Monto recibido *</label>
                                <input type="number" name="budget" class="form-input" placeholder="0.00" step="0.01" min="0" required>
                            </div>
                            <div class="form-group" style="flex:1;">
                                <label class="form-label">Moneda</label>
                                <select name="budgetCurrency" class="form-select">
                                    <option value="BOB">Bs.</option>
                                    <option value="USD">$us.</option>
                                    <option value="EUR">€</option>
                                </select>
                            </div>
                            <div class="form-group" style="flex:2;">
                                <label class="form-label">Plataforma de pago</label>
                                <select name="plataformaPago" class="form-select">
                                    <option value="Tarjeta Virtual">💳 Tarjeta Virtual</option>
                                    <option value="Efectivo">💵 Efectivo</option>
                                    <option value="Banco/QR">🏦 Banco / QR</option>
                                    <option value="Otro">📋 Otro</option>
                                </select>
                            </div>
                        </div>
                        <div class="form-group" style="margin-bottom: 10px;">
                            <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; font-size: 0.85rem; font-weight: 600; color: var(--text-main); padding: 10px; background: white; border-radius: 8px; border: 1px solid #E5E7EB;">
                                <input type="checkbox" name="paymentConfirmed" style="width: 18px; height: 18px; accent-color: #10B981; cursor: pointer;">
                                ✅ Pago confirmado (el cliente realizó el pago)
                            </label>
                        </div>
                        <div class="form-group" style="margin-bottom: 8px;">
                            <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; font-size: 0.85rem; font-weight: 600; color: var(--text-main);">
                                <input type="checkbox" id="chkConversion" style="width: 18px; height: 18px; cursor: pointer;">
                                💱 ¿Requiere cambio de moneda? (BOB → USD)
                            </label>
                        </div>
                        <div id="conversionFields" style="display: none;">
                        <div class="form-row">
                            <div class="form-group">
                                <label class="form-label">Tipo de cambio (BOB → USD)</label>
                                <input type="number" name="tipoCambio" class="form-input" placeholder="Ej: 9.39" step="0.01" min="0" value="9.39">
                            </div>
                            <div class="form-group">
                                <label class="form-label">Comisión plataforma (%)</label>
                                <input type="number" name="comisionPlataforma" class="form-input" placeholder="Ej: 3" step="0.1" min="0" max="100" value="0">
                            </div>
                        </div>
                        </div>
                        <div class="form-group">
                            <label class="form-label">🔗 Link comprobante (Google Drive, etc.)</label>
                            <input type="text" name="linkComprobante" class="form-input" placeholder="https://drive.google.com/...">
                        </div>
                        <div class="finance-preview" id="financePreview">
                            <div class="preview-row"><span>Comisión plataforma:</span> <span class="preview-value" id="prevComision">Bs. 0.00</span></div>
                            <div class="preview-row"><span>Neto después comisión:</span> <span class="preview-value" id="prevNeto">Bs. 0.00</span></div>
                            <div class="preview-row"><span>💵 USD para ads:</span> <span class="preview-value" id="prevUSD" style="font-size: 1.1rem;">$0.00</span></div>
                        </div>
                    </div>

                    <button type="submit" class="btn-submit">Crear Proyecto</button>
                </form>
            `, 'modalNewProject')}

            ${Modal.render('Gestión de Proyecto', '<div id="manageContent"></div>', 'modalManageProject')}
        `;

        return content;
    },

    init: async () => {
        Modal.initEvents('modalNewProject');
        Modal.initEvents('modalManageProject');
        await ProjectsModule.loadProjects();

        // New project button
        document.getElementById('btnNewProject')?.addEventListener('click', () => {
            const form = document.getElementById('projectForm');
            if (form) form.reset();
            const today = new Date().toISOString().split('T')[0];
            form.querySelector('[name="startDate"]').value = today;
            form.querySelector('[name="endDate"]').value = today;
            form.querySelector('[name="tipoCambio"]').value = '9.39';
            form.querySelector('[name="comisionPlataforma"]').value = '0';
            document.getElementById('chkConversion').checked = false;
            document.getElementById('conversionFields').style.display = 'none';
            document.getElementById('servicesText').textContent = 'Seleccionar servicios...';
            document.querySelectorAll('.service-chk').forEach(c => c.checked = false);
            ProjectsModule._updatePreview();
            Modal.open('modalNewProject');
        });

        // Services dropdown (fixed — closes on modal click)
        const trigger = document.getElementById('servicesTrigger');
        const list = document.getElementById('servicesList');
        if (trigger && list) {
            trigger.addEventListener('click', (e) => { e.stopPropagation(); list.classList.toggle('active'); });
            list.addEventListener('click', (e) => e.stopPropagation());
            list.addEventListener('change', () => {
                const checked = list.querySelectorAll('.service-chk:checked');
                const count = checked.length;
                document.getElementById('servicesText').textContent = count > 0 ? `${count} servicios` : 'Seleccionar servicios...';
                // Auto-calcular monto sumando precios de servicios
                const budgetInput = document.querySelector('#projectForm [name="budget"]');
                if (budgetInput) {
                    let total = 0;
                    checked.forEach(chk => { total += Number(chk.dataset.price) || 0; });
                    budgetInput.value = total.toFixed(2);
                    ProjectsModule._updatePreview();
                }
            });
            const modal = document.getElementById('modalNewProject');
            if (modal) modal.addEventListener('click', () => list.classList.remove('active'));
        }

        // Conversion toggle
        document.getElementById('chkConversion')?.addEventListener('change', (e) => {
            document.getElementById('conversionFields').style.display = e.target.checked ? 'block' : 'none';
            if (!e.target.checked) {
                const form = document.getElementById('projectForm');
                if (form) {
                    form.querySelector('[name="tipoCambio"]').value = '0';
                    form.querySelector('[name="comisionPlataforma"]').value = '0';
                }
            } else {
                const form = document.getElementById('projectForm');
                if (form) form.querySelector('[name="tipoCambio"]').value = '9.39';
            }
            ProjectsModule._updatePreview();
        });

        // Finance preview auto-calculation
        const form = document.getElementById('projectForm');
        if (form) {
            ['budget', 'tipoCambio', 'comisionPlataforma'].forEach(name => {
                form.querySelector(`[name="${name}"]`)?.addEventListener('input', () => ProjectsModule._updatePreview());
            });

            // Form submit
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                const btn = form.querySelector('.btn-submit');
                btn.disabled = true;
                btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';

                try {
                    const services = [];
                    document.querySelectorAll('.service-chk:checked').forEach(c => services.push(c.value));

                    const budget = parseFloat(form.budget.value) || 0;
                    const conversionActive = document.getElementById('chkConversion')?.checked || false;
                    const tipoCambio = conversionActive ? (parseFloat(form.tipoCambio.value) || 0) : 0;
                    const comisionPct = conversionActive ? (parseFloat(form.comisionPlataforma.value) || 0) : 0;
                    const comisionBs = budget * (comisionPct / 100);
                    const netoBs = budget - comisionBs;
                    const usdParaAds = tipoCambio > 0 ? netoBs / tipoCambio : 0;

                    const data = {
                        name: form.name.value.trim(),
                        client: form.client.value,
                        clientPhone: form.client.options[form.client.selectedIndex]?.dataset.phone || '',
                        status: form.status.value,
                        startDate: form.startDate.value,
                        endDate: form.endDate.value,
                        objective: form.objective.value.trim(),
                        budget,
                        currency: form.budgetCurrency?.value || 'BOB',
                        paymentConfirmed: form.paymentConfirmed?.checked || false,
                        services,
                        plataformaPago: form.plataformaPago.value,
                        tipoCambio,
                        comisionPlataforma: comisionPct,
                        comisionBs,
                        netoBs,
                        usdParaAds,
                        linkComprobante: form.linkComprobante.value.trim(),
                        kpis: null
                    };

                    await ProjectsService.create(data);
                    Swal.fire({ icon: 'success', title: 'Proyecto creado', timer: 1500, showConfirmButton: false });
                    Modal.close('modalNewProject');
                    await ProjectsModule.loadProjects();
                } catch (error) {
                    Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo crear el proyecto' });
                } finally {
                    btn.disabled = false;
                    btn.textContent = 'Crear Proyecto';
                }
            });
        }
    },

    _updatePreview: () => {
        const form = document.getElementById('projectForm');
        if (!form) return;
        const monto = parseFloat(form.budget?.value) || 0;
        const tc = parseFloat(form.tipoCambio?.value) || 0;
        const comPct = parseFloat(form.comisionPlataforma?.value) || 0;
        const comision = monto * (comPct / 100);
        const neto = monto - comision;
        const usd = tc > 0 ? neto / tc : 0;
        const hasConversion = document.getElementById('chkConversion')?.checked;

        const el = (id, txt) => { const e = document.getElementById(id); if (e) e.textContent = txt; };
        if (hasConversion) {
            el('prevComision', `- Bs. ${comision.toFixed(2)}`);
            el('prevNeto', `Bs. ${neto.toFixed(2)}`);
            el('prevUSD', `$${usd.toFixed(2)}`);
            document.getElementById('financePreview').style.display = 'block';
        } else {
            document.getElementById('financePreview').style.display = comPct > 0 ? 'block' : 'none';
            el('prevComision', `- Bs. ${comision.toFixed(2)}`);
            el('prevNeto', `Bs. ${neto.toFixed(2)}`);
            el('prevUSD', 'N/A (todo en Bs.)');
        }
    },

    loadProjects: async () => {
        const container = document.getElementById('projectsContainer');
        if (!container) return;
        try {
            const projects = await ProjectsService.getAll();
            if (projects.length === 0) {
                container.innerHTML = `
                    <div class="empty-state" style="grid-column: 1 / -1;">
                        <i class="fas fa-folder-open"></i>
                        <h3 style="color: var(--text-main); margin: 0 0 8px 0;">Sin proyectos</h3>
                        <p>Crea tu primer proyecto para comenzar</p>
                    </div>`;
                return;
            }
            container.innerHTML = projects.map(p => ProjectsModule.renderCard(p)).join('');
            container.querySelectorAll('.btn-manage').forEach(btn => {
                btn.addEventListener('click', () => ProjectsModule.openManageModal(btn.dataset.id));
            });
            container.querySelectorAll('.btn-delete').forEach(btn => {
                btn.addEventListener('click', () => ProjectsModule.deleteProject(btn.dataset.id));
            });
        } catch (error) {
            console.error('Error loading projects:', error);
        }
    },

    renderCard: (p) => {
        const statusMap = {
            'Borrador': 'borrador', 'Revisión Pago': 'revision-pago', 'Activo': 'activo', 'Finalizado': 'finalizado',
            'Nuevo': 'borrador', 'En Progreso': 'activo', 'Detenido': 'borrador'
        };
        const statusClass = statusMap[p.status] || 'borrador';
        const budget = p.budget || 0;
        const currSym = p.currency === 'USD' ? '$us.' : p.currency === 'EUR' ? '€' : 'Bs.';
        const usd = p.usdParaAds || (p.tipoCambio > 0 ? budget / p.tipoCambio : 0);
        const tasksCount = (p.tasks || []).length;
        const completedTasks = (p.tasks || []).filter(t => t.status === 'completada').length;
        const formatDate = (d) => d ? new Date(d + 'T00:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }) : '—';

        return `
            <div class="project-card status-${statusClass}">
                <div class="project-card-header">
                    <div>
                        <h3 class="project-name">${p.name}</h3>
                        <div class="project-client">👤 ${p.client}</div>
                    </div>
                    <span class="project-status ${statusClass}">${p.status}</span>
                </div>
                <div class="project-meta">
                    <div class="meta-item"><i class="fas fa-calendar"></i><span>${formatDate(p.startDate)} → ${formatDate(p.endDate)}</span></div>
                    <div class="meta-item"><i class="fas fa-tasks"></i><span>${completedTasks}/${tasksCount} tareas</span></div>
                </div>
                <div class="project-finance">
                    <div>
                        <div class="finance-label">Recibido</div>
                        <div class="finance-value">${currSym} ${budget.toLocaleString('es-ES', { minimumFractionDigits: 2 })}</div>
                    </div>
                    <div style="text-align: center;">
                        <div class="finance-label">Forma de pago</div>
                        <div style="font-weight: 600; font-size: 0.85rem; color: var(--text-main);">${p.plataformaPago || '—'}</div>
                    </div>
                    <div style="text-align: right;">
                        <div class="finance-label">${p.tipoCambio > 0 ? 'USD Ads' : 'Sobrante'}</div>
                        <div class="finance-value ${p.tipoCambio > 0 ? 'positive' : ((budget - (p.costs || 0)) >= 0 ? 'positive' : 'negative')}">${p.tipoCambio > 0 ? '$' + usd.toFixed(2) : currSym + ' ' + (budget - (p.costs || 0)).toFixed(2)}</div>
                    </div>
                </div>
                ${!p.paymentConfirmed ? `<div style="background:#FEF2F2; border:1px solid #FECACA; border-radius:8px; padding:8px 12px; margin-top:8px; display:flex; align-items:center; gap:8px; font-size:0.8rem;"><span style="color:#DC2626; font-weight:700;">❌ Pago NO confirmado</span></div>` : `<div style="background:#F0FDF4; border:1px solid #BBF7D0; border-radius:8px; padding:8px 12px; margin-top:8px; display:flex; align-items:center; gap:8px; font-size:0.8rem;"><span style="color:#166534; font-weight:700;">✅ Pago confirmado</span></div>`}
                <div class="project-actions">
                    <button class="btn-action primary btn-manage" data-id="${p.id}"><i class="fas fa-cog"></i> Gestionar</button>
                    <button class="btn-action danger btn-delete" data-id="${p.id}"><i class="fas fa-trash"></i></button>
                </div>
            </div>`;
    },

    deleteProject: async (id) => {
        const result = await Swal.fire({
            title: '¿Eliminar proyecto?', text: 'Se perderá todo el seguimiento',
            icon: 'warning', showCancelButton: true, confirmButtonColor: '#EF4444',
            cancelButtonText: 'Cancelar', confirmButtonText: 'Eliminar'
        });
        if (result.isConfirmed) {
            await ProjectsService.delete(id);
            Swal.fire({ icon: 'success', title: 'Eliminado', timer: 1500, showConfirmButton: false });
            await ProjectsModule.loadProjects();
        }
    },

    openManageModal: async (id) => {
        const project = await ProjectsService.getById(id);
        if (!project) return;
        ProjectsModule.currentProjectId = id;
        document.getElementById('manageContent').innerHTML = ProjectsModule.renderManageContent(project);
        ProjectsModule.setupManageEvents(project);
        Modal.open('modalManageProject');
    },

    renderManageContent: (p) => {
        const budget = p.budget || 0;
        const tc = p.tipoCambio || 0;
        const comPct = p.comisionPlataforma || 0;
        const comBs = p.comisionBs || (budget * comPct / 100);
        const netoBs = p.netoBs || (budget - comBs);
        const usd = p.usdParaAds || (tc > 0 ? netoBs / tc : 0);
        const totalPaid = p.totalPaid || 0;
        const costs = p.costs || 0;
        const kpis = p.kpis || {};
        const hasConversion = tc > 0;
        const moneda = hasConversion ? '$' : 'Bs.';

        return `
            <div style="margin-bottom: 20px; padding-bottom: 16px; border-bottom: 1px solid var(--border-color);">
                <h3 style="margin: 0; font-size: 1.25rem; color: var(--text-main);">${p.name}</h3>
                <div style="color: var(--text-muted); font-size: 0.9rem;">👤 ${p.client} · ${p.plataformaPago || 'Sin plataforma'}</div>
            </div>

            <div class="tabs-nav">
                <button class="tab-btn active" data-tab="resumen">📋 Resumen</button>
                <button class="tab-btn" data-tab="tareas">✅ Tareas</button>
                <button class="tab-btn" data-tab="finanzas">💰 Finanzas</button>
            </div>

            <!-- TAB RESUMEN -->
            <div id="tab-resumen" class="tab-content active">
                <div class="form-section">
                    <div class="form-section-title">Objetivo</div>
                    <p style="margin: 0; color: var(--text-main);">${p.objective || 'Sin objetivo definido'}</p>
                </div>
                <div class="form-section">
                    <div class="form-section-title">⚙️ Estado del Proyecto</div>
                    <select id="editProjectStatus" class="form-select" style="max-width: 250px;">
                        <option value="Borrador" ${p.status === 'Borrador' ? 'selected' : ''}>📝 Borrador</option>
                        <option value="Revisión Pago" ${p.status === 'Revisión Pago' ? 'selected' : ''}>💳 Revisión Pago</option>
                        <option value="Activo" ${p.status === 'Activo' || p.status === 'En Progreso' ? 'selected' : ''}>🟢 Activo</option>
                        <option value="Finalizado" ${p.status === 'Finalizado' ? 'selected' : ''}>✅ Finalizado</option>
                    </select>
                </div>
                <div class="form-row" style="margin-bottom: 16px;">
                    <div class="form-section" style="margin-bottom: 0;">
                        <div class="form-section-title">📅 Inicio</div>
                        <input type="date" id="editStartDate" class="form-input" value="${p.startDate || ''}">
                    </div>
                    <div class="form-section" style="margin-bottom: 0;">
                        <div class="form-section-title">🏁 Entrega</div>
                        <input type="date" id="editEndDate" class="form-input" value="${p.endDate || ''}">
                    </div>
                </div>
                <button class="btn-submit" id="btnSaveResumen" style="margin-bottom: 16px;">💾 Guardar Cambios</button>
                <div class="form-section">
                    <div class="form-section-title">🛠️ Servicios</div>
                    <div style="display: flex; flex-wrap: wrap; gap: 6px;">
                        ${(p.services || []).length > 0
                ? p.services.map(s => `<span style="background: rgba(59,130,246,0.15); color: #3B82F6; padding: 4px 10px; border-radius: 20px; font-size: 0.8rem; font-weight: 600;">${s}</span>`).join('')
                : '<span style="color: var(--text-muted);">Ninguno</span>'}
                    </div>
                </div>
            </div>

            <!-- TAB TAREAS -->
            <div id="tab-tareas" class="tab-content">
                <div id="tasksList">
                    ${(p.tasks || []).map(t => {
                    const dueDate = t.dueDate ? new Date(t.dueDate + 'T00:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }) : '';
                    return `<div class="task-item" data-task-id="${t.id}">
                            <input type="checkbox" class="task-checkbox" ${t.status === 'completada' ? 'checked' : ''}>
                            <div style="flex:1;">
                                <span class="task-text ${t.status === 'completada' ? 'completed' : ''}">${t.description}</span>
                                ${dueDate ? `<div style="font-size:0.7rem; color:var(--text-muted); margin-top:2px;">📅 ${dueDate}</div>` : ''}
                            </div>
                            <button class="task-delete"><i class="fas fa-times"></i></button>
                        </div>`;
                }).join('') || '<div class="empty-state"><i class="fas fa-tasks"></i><p>Sin tareas</p></div>'}
                </div>
                <div class="add-task-row" style="flex-wrap: wrap;">
                    <input type="text" class="form-input" id="newTaskInput" placeholder="Descripción de la tarea..." style="flex: 2; min-width: 150px;">
                    <input type="date" class="form-input" id="newTaskDueDate" value="${new Date().toISOString().split('T')[0]}" style="flex: 1; min-width: 170px; color: #111827;">
                    <button class="btn-add-task" id="btnAddTask"><i class="fas fa-plus"></i> Agregar</button>
                </div>
            </div>

            <!-- TAB FINANZAS -->
            <div id="tab-finanzas" class="tab-content">
                ${hasConversion ? `
                <div class="conversion-calc">
                    <div style="font-weight: 700; margin-bottom: 10px; color: var(--text-main);">💱 Conversión BOB → USD</div>
                    <div class="conversion-row"><span class="conversion-label">Recibido del cliente</span><span class="conversion-value">Bs. ${budget.toFixed(2)}</span></div>
                    <div class="conversion-row"><span class="conversion-label">Comisión ${p.plataformaPago || 'plataforma'} (${comPct}%)</span><span class="conversion-value red">- Bs. ${comBs.toFixed(2)}</span></div>
                    <div class="conversion-row"><span class="conversion-label">Neto después comisión</span><span class="conversion-value">Bs. ${netoBs.toFixed(2)}</span></div>
                    <div class="conversion-row"><span class="conversion-label">Tipo de cambio</span><span class="conversion-value">1 USD = ${tc} BOB</span></div>
                    <div class="conversion-row total"><span class="conversion-label">💵 USD para Ads</span><span class="conversion-value green">$${usd.toFixed(2)}</span></div>
                    ${p.linkComprobante ? `<div style="margin-top: 10px;"><a href="${p.linkComprobante}" target="_blank" style="color: var(--primary); font-size: 0.85rem; text-decoration: none;">🔗 Ver comprobante</a></div>` : ''}
                </div>
                ` : `
                <div class="conversion-calc">
                    <div style="font-weight: 700; margin-bottom: 10px; color: var(--text-main);">💰 Presupuesto (Bs.)</div>
                    <div class="conversion-row total"><span class="conversion-label">Monto recibido</span><span class="conversion-value green">Bs. ${budget.toFixed(2)}</span></div>
                    ${p.linkComprobante ? `<div style="margin-top: 10px;"><a href="${p.linkComprobante}" target="_blank" style="color: var(--primary); font-size: 0.85rem; text-decoration: none;">🔗 Ver comprobante</a></div>` : ''}
                </div>
                `}

                <div class="finance-summary">
                    <div class="finance-box">
                        <div class="finance-box-label">Presupuesto</div>
                        <div class="finance-box-value" style="color: #2563EB;">${moneda} ${(hasConversion ? usd : budget).toFixed(2)}</div>
                    </div>
                    <div class="finance-box">
                        <div class="finance-box-label">Gastado</div>
                        <div class="finance-box-value" style="color: #EF4444;">${moneda} ${costs.toFixed(2)}</div>
                    </div>
                    <div class="finance-box">
                        <div class="finance-box-label">Sobrante</div>
                        <div class="finance-box-value" style="color: ${((hasConversion ? usd : budget) - costs) >= 0 ? '#10B981' : '#EF4444'};">${moneda} ${((hasConversion ? usd : budget) - costs).toFixed(2)}</div>
                    </div>
                </div>

                <div id="paymentsList">
                    ${(p.payments || []).map(pay => `
                        <div class="payment-item" data-payment-id="${pay.id}">
                            <div class="payment-info">
                                <div class="payment-concept">${pay.concept}</div>
                                <div class="payment-date">${new Date(pay.date).toLocaleDateString('es-ES')}</div>
                            </div>
                            <div class="payment-amount expense">- ${moneda} ${pay.amount.toFixed(2)}</div>
                            <button class="task-delete payment-delete"><i class="fas fa-times"></i></button>
                        </div>`).join('') || ''}
                </div>

                <div class="add-payment-form">
                    <input type="text" class="form-input" id="paymentConcept" placeholder="Concepto (ej: Pago Ads, Comisión)">
                    <input type="number" class="form-input" id="paymentAmount" placeholder="Monto (${hasConversion ? 'USD' : 'Bs.'})" step="0.01" min="0">
                    <button class="btn-expense" id="btnAddExpense" style="flex: 1;"><i class="fas fa-plus"></i> Registrar Gasto</button>
                </div>

                <!-- Métricas de resultados -->
                <div class="form-section" style="margin-top: 20px;">
                    <div class="form-section-title">📊 Resultados del Proyecto</div>
                    <div id="metricsList">
                        ${(kpis.metricas || []).map((m, i) => `
                        <div class="metric-row" data-idx="${i}" style="display:flex; gap:8px; align-items:center; margin-bottom:8px;">
                            <input type="text" class="form-input metric-name" value="${m.nombre}" placeholder="Métrica" style="flex:1;">
                            <input type="text" class="form-input metric-value" value="${m.valor}" placeholder="Valor" style="flex:1;">
                            <button class="task-delete metric-delete" style="flex-shrink:0;"><i class="fas fa-times"></i></button>
                        </div>`).join('')}
                    </div>
                    <button class="btn-add-task" id="btnAddMetric" style="margin-bottom: 12px; width: 100%;"><i class="fas fa-plus"></i> Agregar Métrica</button>
                    <div class="form-group">
                        <label class="form-label">Notas de cierre</label>
                        <textarea class="form-input" id="kpiNotas" rows="2" placeholder="Resultados, observaciones...">${kpis.notas || ''}</textarea>
                    </div>
                    <button class="btn-submit" id="btnSaveKpis" style="background: #334155;">📊 Guardar Resultados</button>
                </div>

                <button class="btn-report" id="btnDownloadReport">📄 Descargar Reporte PDF</button>
            </div>
        `;
    },

    setupManageEvents: (project) => {
        const id = ProjectsModule.currentProjectId;

        // Tab navigation
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
                btn.classList.add('active');
                document.getElementById(`tab-${btn.dataset.tab}`).classList.add('active');
            });
        });

        // Save resumen (status + dates)
        document.getElementById('btnSaveResumen')?.addEventListener('click', async () => {
            const status = document.getElementById('editProjectStatus').value;
            const startDate = document.getElementById('editStartDate').value;
            const endDate = document.getElementById('editEndDate').value;
            try {
                await ProjectsService.update(id, { status, startDate, endDate });
                Swal.fire({ icon: 'success', title: 'Proyecto actualizado', timer: 1500, showConfirmButton: false });
                const updated = await ProjectsService.getById(id);
                document.getElementById('manageContent').innerHTML = ProjectsModule.renderManageContent(updated);
                ProjectsModule.setupManageEvents(updated);
                await ProjectsModule.loadProjects();
            } catch (e) {
                console.error(e);
                Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo actualizar' });
            }
        });

        // Add task (fixed — setupEvents before click)
        document.getElementById('btnAddTask')?.addEventListener('click', async () => {
            const input = document.getElementById('newTaskInput');
            const dueDateInput = document.getElementById('newTaskDueDate');
            const desc = input.value.trim();
            if (!desc) return;
            try {
                await ProjectsService.addTask(id, { description: desc, dueDate: dueDateInput?.value || '' });
                const updated = await ProjectsService.getById(id);
                document.getElementById('manageContent').innerHTML = ProjectsModule.renderManageContent(updated);
                ProjectsModule.setupManageEvents(updated);
                document.querySelector('[data-tab="tareas"]').click();
            } catch (e) { console.error(e); }
        });

        // Task checkbox
        document.querySelectorAll('.task-checkbox').forEach(chk => {
            chk.addEventListener('change', async () => {
                const taskId = chk.closest('.task-item').dataset.taskId;
                await ProjectsService.updateTask(id, taskId, { status: chk.checked ? 'completada' : 'pendiente' });
                await ProjectsModule.loadProjects();
            });
        });

        // Delete task
        document.querySelectorAll('.task-delete:not(.payment-delete)').forEach(btn => {
            btn.addEventListener('click', async () => {
                const taskId = btn.closest('.task-item').dataset.taskId;
                await ProjectsService.deleteTask(id, taskId);
                const updated = await ProjectsService.getById(id);
                document.getElementById('manageContent').innerHTML = ProjectsModule.renderManageContent(updated);
                ProjectsModule.setupManageEvents(updated);
                document.querySelector('[data-tab="tareas"]').click();
            });
        });

        // Add payment (expense only)
        document.getElementById('btnAddExpense')?.addEventListener('click', async () => {
            const concept = document.getElementById('paymentConcept').value.trim();
            const amount = parseFloat(document.getElementById('paymentAmount').value);
            if (!concept || !amount) return;
            await ProjectsService.addPayment(id, { concept, amount, type: 'expense' });
            await ProjectsModule.refreshManageModal();
        });

        // Delete payment
        document.querySelectorAll('.payment-delete').forEach(btn => {
            btn.addEventListener('click', async () => {
                const paymentId = btn.closest('.payment-item').dataset.paymentId;
                await ProjectsService.deletePayment(id, paymentId);
                await ProjectsModule.refreshManageModal();
            });
        });

        // Save KPIs
        // Add metric row
        document.getElementById('btnAddMetric')?.addEventListener('click', () => {
            const list = document.getElementById('metricsList');
            const idx = list.querySelectorAll('.metric-row').length;
            const row = document.createElement('div');
            row.className = 'metric-row';
            row.dataset.idx = idx;
            row.style.cssText = 'display:flex; gap:8px; align-items:center; margin-bottom:8px;';
            row.innerHTML = `
                <input type="text" class="form-input metric-name" placeholder="Ej: Impresiones" style="flex:1;">
                <input type="text" class="form-input metric-value" placeholder="Ej: 50,000" style="flex:1;">
                <button class="task-delete metric-delete" style="flex-shrink:0;"><i class="fas fa-times"></i></button>`;
            list.appendChild(row);
            row.querySelector('.metric-delete').addEventListener('click', () => row.remove());
            row.querySelector('.metric-name').focus();
        });

        // Delete metric rows
        document.querySelectorAll('.metric-delete').forEach(btn => {
            btn.addEventListener('click', () => btn.closest('.metric-row').remove());
        });

        // Save metrics
        document.getElementById('btnSaveKpis')?.addEventListener('click', async () => {
            const metricas = [];
            document.querySelectorAll('.metric-row').forEach(row => {
                const nombre = row.querySelector('.metric-name').value.trim();
                const valor = row.querySelector('.metric-value').value.trim();
                if (nombre && valor) metricas.push({ nombre, valor });
            });
            const kpis = {
                metricas,
                notas: document.getElementById('kpiNotas').value.trim()
            };
            try {
                await ProjectsService.update(id, { kpis });
                Swal.fire({ icon: 'success', title: 'Resultados guardados', timer: 1500, showConfirmButton: false });
            } catch (e) {
                Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudieron guardar los resultados' });
            }
        });

        // Download report
        document.getElementById('btnDownloadReport')?.addEventListener('click', () => {
            ProjectsModule.generateReport(project);
        });
    },

    refreshManageModal: async () => {
        const id = ProjectsModule.currentProjectId;
        const updated = await ProjectsService.getById(id);
        document.getElementById('manageContent').innerHTML = ProjectsModule.renderManageContent(updated);
        ProjectsModule.setupManageEvents(updated);
        document.querySelector('[data-tab="finanzas"]').click();
        await ProjectsModule.loadProjects();
    },

    generateReport: (p) => {
        const budget = p.budget || 0;
        const tc = p.tipoCambio || 0;
        const comPct = p.comisionPlataforma || 0;
        const comBs = p.comisionBs || (budget * comPct / 100);
        const netoBs = p.netoBs || (budget - comBs);
        const usd = p.usdParaAds || (tc > 0 ? netoBs / tc : 0);
        const kpis = p.kpis || {};
        const metricas = kpis.metricas || [];
        const responsable = p.createdBy || auth.currentUser?.displayName || 'Sin asignar';
        const fmtDate = (d) => d ? new Date(d + 'T00:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }) : '—';
        const logoUrl = 'https://raw.githubusercontent.com/magicdesignefecto/Magic-Design-Efecto-Servicios-Gestion-de-Redes-Sociales/77cbcdf9e5992cc519ac102d1182d9397f23f12a/logo%20svg%20magic%20design%20efecto.svg';
        const hasKpis = metricas.length > 0;
        const hasConversion = tc > 0;

        const html = `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reporte - ${p.name}</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
    <style>
        *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
        html, body { margin: 0; padding: 0; width: 480px; overflow-x: hidden; }
        body { font-family: 'Inter', 'Segoe UI', system-ui, sans-serif; color: #1E293B; background: white; -webkit-text-size-adjust: 100%; }

        .page { width: 100%; max-width: 480px; margin: 0 auto; background: white; overflow: hidden; page-break-inside: avoid; page-break-after: avoid; }
        @media print { .page { page-break-inside: avoid; } * { page-break-inside: avoid; } }

        /* Header */
        .report-header { background: linear-gradient(135deg, #0F172A 0%, #1E3A5F 50%, #2563EB 100%); color: white; padding: 24px; display: flex; align-items: center; justify-content: space-between; margin: 0; }
        .header-left { display: flex; align-items: center; gap: 16px; }
        .header-logo { width: 42px; height: 42px; background: white; border-radius: 10px; padding: 6px; display: flex; align-items: center; justify-content: center; }
        .header-logo img { width: 100%; height: 100%; object-fit: contain; }
        .header-brand { font-size: 1.05rem; font-weight: 800; letter-spacing: -0.5px; }
        .header-sub { font-size: 0.8rem; font-weight: 400; color: rgba(255,255,255,0.7); margin-top: 2px; }
        .header-right { text-align: right; }
        .header-right .doc-type { font-size: 0.7rem; text-transform: uppercase; letter-spacing: 2px; color: rgba(255,255,255,0.6); font-weight: 600; }
        .header-right .doc-date { font-size: 0.8rem; color: rgba(255,255,255,0.8); margin-top: 4px; }

        /* Status bar */
        .status-bar { display: flex; justify-content: space-between; align-items: center; padding: 12px 24px; background: #F1F5F9; border-bottom: 1px solid #E2E8F0; }
        .status-badge { padding: 5px 16px; border-radius: 20px; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
        .status-badge.activo { background: #DBEAFE; color: #2563EB; }
        .status-badge.finalizado { background: #D1FAE5; color: #059669; }
        .status-badge.borrador { background: #F1F5F9; color: #64748B; }
        .status-badge.revision-pago { background: #FEF3C7; color: #D97706; }
        .status-ref { font-size: 0.75rem; color: #94A3B8; }

        /* Content */
        .content { padding: 20px 24px; }

        /* Project title section */
        .project-title-section { margin-bottom: 28px; padding-bottom: 20px; border-bottom: 1px solid #E2E8F0; }
        .project-title-section h1 { font-size: 1.5rem; font-weight: 800; color: #0F172A; margin-bottom: 4px; letter-spacing: -0.5px; }
        .project-title-section .client-name { font-size: 0.95rem; color: #64748B; font-weight: 500; }

        /* Info cards */
        .info-cards { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 20px; }
        .info-card { background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 10px; }
        .info-card-label { font-size: 0.6rem; text-transform: uppercase; letter-spacing: 1px; color: #94A3B8; font-weight: 600; margin-bottom: 2px; }
        .info-card-value { font-size: 0.82rem; font-weight: 700; color: #0F172A; }

        /* Section */
        .section { margin-bottom: 24px; }
        .section-header { font-size: 0.7rem; text-transform: uppercase; letter-spacing: 1.5px; color: #94A3B8; font-weight: 700; margin-bottom: 12px; padding-bottom: 6px; border-bottom: 2px solid #E2E8F0; }

        /* Finance table */
        .finance-table { width: 100%; border-collapse: separate; border-spacing: 0; border: 1px solid #E2E8F0; border-radius: 10px; overflow: hidden; }
        .finance-table td { padding: 11px 16px; font-size: 0.85rem; border-bottom: 1px solid #F1F5F9; }
        .finance-table td:first-child { color: #64748B; font-weight: 500; }
        .finance-table td:last-child { text-align: right; font-weight: 600; color: #0F172A; }
        .finance-table tr:last-child td { border-bottom: none; }
        .finance-table .highlight-row { background: linear-gradient(135deg, #F0FDF4, #ECFDF5); }
        .finance-table .highlight-row td { font-weight: 700; font-size: 0.95rem; }
        .finance-table .highlight-row td:last-child { color: #059669; }

        /* KPI cards */
        .kpi-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 12px; }
        .kpi-card { background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 12px; text-align: center; }
        .kpi-card.highlight { background: linear-gradient(135deg, #EFF6FF, #DBEAFE); border-color: #BFDBFE; }
        .kpi-number { font-size: 1.15rem; font-weight: 800; color: #0F172A; }
        .kpi-label { font-size: 0.65rem; text-transform: uppercase; letter-spacing: 0.5px; color: #94A3B8; font-weight: 600; margin-top: 2px; }

        /* Payments table */
        .payments-table { width: 100%; border-collapse: separate; border-spacing: 0; border: 1px solid #E2E8F0; border-radius: 10px; overflow: hidden; font-size: 0.82rem; }
        .payments-table th { background: #F8FAFC; padding: 10px 16px; text-align: left; font-weight: 600; color: #64748B; font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 2px solid #E2E8F0; }
        .payments-table td { padding: 10px 16px; border-bottom: 1px solid #F1F5F9; }
        .payments-table tr:last-child td { border-bottom: none; }
        .text-green { color: #059669; }
        .text-red { color: #EF4444; }

        /* Objective & Services */
        .objective-box { background: #F8FAFC; border-left: 3px solid #2563EB; padding: 14px 18px; border-radius: 0 8px 8px 0; margin-bottom: 16px; }
        .objective-box p { font-size: 0.88rem; color: #475569; line-height: 1.5; }
        .services-list { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 16px; }
        .service-tag { background: #EFF6FF; color: #2563EB; padding: 4px 12px; border-radius: 20px; font-size: 0.75rem; font-weight: 600; }
        .notes-box { background: #FFFBEB; border-left: 3px solid #F59E0B; padding: 14px 18px; border-radius: 0 8px 8px 0; }
        .notes-box p { font-size: 0.85rem; color: #92400E; line-height: 1.5; }

        /* Footer */
        .report-footer { margin-top: 20px; padding: 20px 24px 80px; background: #F8FAFC; border-top: 1px solid #E2E8F0; text-align: center; }
        .footer-left { font-size: 0.8rem; color: #475569; font-weight: 600; }
        .footer-right { font-size: 0.8rem; color: #475569; margin-top: 4px; }

        .btn-download { display: block; width: calc(100% - 48px); margin: 20px auto; padding: 14px; background: linear-gradient(135deg, #0F172A, #2563EB); color: white; border: none; border-radius: 10px; font-family: inherit; font-size: 0.9rem; font-weight: 700; cursor: pointer; text-align: center; }
        .btn-download:active { opacity: 0.8; }
        .btn-download:disabled { opacity: 0.6; cursor: wait; }
    </style>
</head>
<body>
    <div class="page">
        <div class="report-header">
            <div class="header-left">
                <div class="header-logo"><img src="${logoUrl}" alt="Logo"></div>
                <div>
                    <div class="header-brand">Magic Design Efecto</div>
                    <div class="header-sub">Reporte de Proyecto</div>
                </div>
            </div>
            <div class="header-right">
                <div class="doc-type">Documento de Cierre</div>
                <div class="doc-date">${new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
            </div>
        </div>

        <div class="status-bar">
            <span class="status-badge ${({ 'Borrador': 'borrador', 'Revisión Pago': 'revision-pago', 'Activo': 'activo', 'Finalizado': 'finalizado' })[p.status] || 'activo'}">${p.status}</span>
            <span class="status-ref">Responsable: ${responsable}</span>
        </div>

        <div class="content">
            <div class="project-title-section">
                <h1>${p.name}</h1>
                <div class="client-name">Cliente: ${p.client}</div>
            </div>

            <div class="info-cards">
                <div class="info-card">
                    <div class="info-card-label">Fecha Inicio</div>
                    <div class="info-card-value">${fmtDate(p.startDate)}</div>
                </div>
                <div class="info-card">
                    <div class="info-card-label">Fecha Entrega</div>
                    <div class="info-card-value">${fmtDate(p.endDate)}</div>
                </div>
                <div class="info-card">
                    <div class="info-card-label">Forma de Pago</div>
                    <div class="info-card-value">${p.plataformaPago || '—'}</div>
                </div>
            </div>

            ${p.objective ? `<div class="objective-box"><p><strong>Objetivo:</strong> ${p.objective}</p></div>` : ''}

            ${(p.services || []).length > 0 ? `
            <div class="services-list">${p.services.map(s => `<span class="service-tag">${s}</span>`).join('')}</div>` : ''}

            <div class="section">
                <div class="section-header">Resumen Financiero</div>
                <table class="finance-table">
                    <tr><td>Monto recibido del cliente</td><td>Bs. ${budget.toFixed(2)}</td></tr>
                    ${hasConversion ? `
                    <tr><td>Comisión plataforma (${comPct}%)</td><td class="text-red">- Bs. ${comBs.toFixed(2)}</td></tr>
                    <tr><td>Neto después comisión</td><td>Bs. ${netoBs.toFixed(2)}</td></tr>
                    <tr><td>Tipo de cambio</td><td>1 USD = ${tc} BOB</td></tr>
                    <tr class="highlight-row"><td>USD invertido en Ads</td><td>$${usd.toFixed(2)}</td></tr>
                    ` : `<tr class="highlight-row"><td>Total inversión</td><td>Bs. ${budget.toFixed(2)}</td></tr>`}
                </table>
            </div>

            ${hasKpis ? `
            <div class="section">
                <div class="section-header">Resultados del Proyecto</div>
                <div class="kpi-grid">
                    ${metricas.map((m, i) => `<div class="kpi-card${i === 0 ? ' highlight' : ''}"><div class="kpi-number">${m.valor}</div><div class="kpi-label">${m.nombre}</div></div>`).join('')}
                </div>
                ${kpis.notas ? `<div class="notes-box"><p><strong>Notas:</strong> ${kpis.notas}</p></div>` : ''}
            </div>` : ''}

            ${(p.payments || []).length > 0 ? (() => {
                const mon = hasConversion ? '$' : 'Bs.';
                // Backward-compatible: pagos sin type se tratan como gastos
                const totalGastos = (p.payments || []).filter(x => !x.type || x.type === 'expense').reduce((s, x) => s + (x.amount || 0), 0);
                const presupuesto = hasConversion ? usd : budget;
                const sobrante = presupuesto - totalGastos;
                return `
            <div class="section">
                <div class="section-header">Historial de Movimientos</div>
                <table class="payments-table">
                    <thead><tr><th>Concepto</th><th>Fecha</th><th style="text-align:right;">Monto</th></tr></thead>
                    <tbody>
                        ${p.payments.map(pay => `<tr>
                            <td>${pay.concept}</td>
                            <td>${new Date(pay.date).toLocaleDateString('es-ES')}</td>
                            <td style="text-align:right; font-weight:600;" class="${pay.type === 'income' ? 'text-green' : 'text-red'}">${pay.type === 'income' ? '+' : '-'} ${mon} ${pay.amount.toFixed(2)}</td>
                        </tr>`).join('')}
                    </tbody>
                    <tfoot>
                        <tr style="border-top: 2px solid #E2E8F0;">
                            <td colspan="2" style="font-weight:700; color:#EF4444;">Total gastado</td>
                            <td style="text-align:right; font-weight:700; color:#EF4444;">- ${mon} ${totalGastos.toFixed(2)}</td>
                        </tr>
                        ${sobrante !== 0 ? `<tr>
                            <td colspan="2" style="font-weight:700; color:${sobrante >= 0 ? '#059669' : '#EF4444'};">${sobrante >= 0 ? '✅ Sobrante' : '⚠️ Excedido'}</td>
                            <td style="text-align:right; font-weight:700; color:${sobrante >= 0 ? '#059669' : '#EF4444'};">${mon} ${Math.abs(sobrante).toFixed(2)}</td>
                        </tr>` : ''}
                    </tfoot>
                </table>
            </div>`;
            })() : ''}
        </div>

        <div class="report-footer" style="padding-bottom: 60px; margin-bottom: 30px;">
            <div class="footer-left" style="font-size: 11px; color: #475569; opacity: 1;">Magic Design Efecto · CRM · Generado: ${new Date().toLocaleString('es-ES', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
            <div class="footer-right" style="font-size: 11px; color: #475569; opacity: 1;">Responsable: ${responsable} · Documento generado automáticamente</div>
        </div>
    </div>

    <button class="btn-download" id="btnDownload">📥 Descargar Reporte PDF</button>

    <script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"></script>
    <script>
        function generatePDF() {
            const btn = document.getElementById('btnDownload');
            const el = document.querySelector('.page');
            btn.textContent = '⏳ Generando PDF...';
            btn.disabled = true;

            // Wait a tick for the browser to finish layout
            setTimeout(() => {
                const pxToMm = 0.2646;
                const pdfWidth = 480 * pxToMm;
                const pdfHeight = (el.scrollHeight + 40) * pxToMm; // +40 extra safety

                html2pdf().set({
                    margin: 0,
                    filename: 'Reporte-${p.name.replace(/[^a-zA-Z0-9]/g, '_')}.pdf',
                    image: { type: 'jpeg', quality: 0.98 },
                    html2canvas: { scale: 2, useCORS: true, backgroundColor: '#ffffff', scrollY: 0, width: 480, windowWidth: 480, x: 0 },
                    jsPDF: { unit: 'mm', format: [pdfWidth, pdfHeight], orientation: 'portrait' },
                    pagebreak: { mode: ['avoid-all'] }
                }).from(el).save().then(() => {
                    btn.textContent = '✅ PDF descargado';
                    setTimeout(() => { btn.textContent = '📥 Descargar Reporte PDF'; btn.disabled = false; }, 2500);
                }).catch(() => {
                    btn.textContent = '❌ Error, intenta de nuevo';
                    setTimeout(() => { btn.textContent = '📥 Descargar Reporte PDF'; btn.disabled = false; }, 2000);
                });
            }, 500);
        }

        document.getElementById('btnDownload').addEventListener('click', generatePDF);
    </script>
</body>
</html>`;

        const w = window.open('', '_blank');
        w.document.write(html);
        w.document.close();
    },

    destroy: () => {
        ProjectsModule.currentProjectId = null;
    }
};

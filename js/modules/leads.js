import { Table } from '../components/Table.js';
import { Modal } from '../components/Modal.js';
import { LeadsService } from '../services/leads.service.js';
import { SettingsService } from '../services/settings.service.js';
import { Formatters } from '../utils/formatters.js';

export const LeadsModule = {
    render: async () => {
        const availableServices = await SettingsService.getServicesWithDetails();

        // Generamos los checkboxes, pero inicialmente estarán ocultos dentro del dropdown
        const servicesCheckboxesHTML = availableServices.map(svc => `
            <label class="service-option" style="display:flex; align-items:center; justify-content:space-between;">
                <div style="display:flex; align-items:center; gap:8px;">
                    <input type="checkbox" class="service-chk" value="${svc.name}" data-price="${svc.price || 0}">
                    <span class="svc-name">${svc.name}</span>
                </div>
                <span style="background:#DBEAFE; color:#2563EB; padding:2px 8px; border-radius:10px; font-size:0.72rem; font-weight:700;">${svc.price ? 'Bs. ' + Number(svc.price).toLocaleString('es-ES') : 'S/P'}</span>
            </label>
        `).join('');

        const formHTML = `
            <style>
                .form-section { background: #F9FAFB; padding: 15px; border-radius: 8px; border: 1px solid #E5E7EB; margin-bottom: 15px; }
                .section-title { margin: 0 0 10px 0; color: var(--primary); font-size: 0.9rem; font-weight: 700; }
                .input-group { display: flex; flex-direction: column; gap: 12px; }
                .input-row { display: flex; gap: 10px; }
                .form-input, .form-select { width: 100%; padding: 10px; border: 1px solid #D1D5DB; border-radius: 6px; font-size: 0.95rem; box-sizing: border-box; }
                
                /* --- ESTILOS DEL DROPDOWN CON BUSCADOR --- */
                .dropdown-wrapper {
                    position: relative;
                    width: 100%;
                }
                
                /* El botón que parece un Select */
                .dropdown-trigger {
                    width: 100%;
                    padding: 10px;
                    background: var(--bg-card);
                    border: 1px solid #D1D5DB;
                    border-radius: 6px;
                    display: flex; justify-content: space-between; align-items: center;
                    cursor: pointer;
                    font-size: 0.95rem;
                    color: var(--text-main);
                }
                .dropdown-trigger:after { content: '▼'; font-size: 0.7rem; color: #6B7280; }

                /* El contenido que se despliega */
                .dropdown-content {
                    display: none; /* Oculto por defecto */
                    position: absolute;
                    top: 105%; left: 0; right: 0;
                    background: var(--bg-card);
                    border: 1px solid #D1D5DB;
                    border-radius: 8px;
                    box-shadow: 0 4px 15px rgba(0,0,0,0.1);
                    z-index: 100;
                    padding: 10px;
                }
                .dropdown-content.active { display: block; }

                /* Campo de búsqueda (Lupa) */
                .search-box {
                    position: relative;
                    margin-bottom: 8px;
                }
                .search-input {
                    width: 100%;
                    padding: 8px 8px 8px 30px; /* Espacio para icono */
                    border: 1px solid #E5E7EB;
                    border-radius: 6px;
                    font-size: 0.9rem;
                    outline: none;
                }
                .search-icon {
                    position: absolute; left: 8px; top: 8px;
                    font-size: 0.9rem; color: #9CA3AF;
                }

                /* Lista con scroll */
                .services-list-scroll {
                    max-height: 200px;
                    overflow-y: auto;
                    display: flex; flex-direction: column; gap: 2px;
                }
                .service-option {
                    padding: 8px;
                    border-radius: 4px;
                    cursor: pointer;
                    transition: background 0.1s;
                }
                .service-option:hover { background: #F3F4F6; }
                
                /* --- FIN DROPDOWN --- */

                .total-box { background: #F0FDF4; border: 1px dashed #16A34A; padding: 15px; border-radius: 8px; margin-top: 15px; text-align: center; }
                .total-amount { color: #15803D; font-size: 1.8rem; font-weight: 800; display: block; }

                @media (max-width: 480px) {
                    .input-row { flex-direction: column; }
                    .money-row { flex-direction: row; }
                }
            </style>

            <form id="createLeadForm">
                <input type="hidden" name="id" id="leadId">
                <div class="form-section">
                    <h4 class="section-title">👤 Contacto</h4>
                    <div class="input-group">
                        <input type="text" name="name" class="form-input" placeholder="Nombre Completo *" required>
                        <input type="text" name="company" class="form-input" placeholder="Empresa / Negocio">
                        <div class="input-row">
                            <input type="tel" name="phone" class="form-input" placeholder="📱 WhatsApp">
                            <input type="email" name="email" class="form-input" placeholder="✉️ Email">
                        </div>
                    </div>
                </div>

                <div class="form-section">
                    <h4 class="section-title">📍 Detalles</h4>
                    <div class="input-group">
                        <div class="input-row">
                            <div style="flex:1;">
                                <label style="font-size:0.75rem; color:#666;">Fecha Registro</label>
                                <input type="date" name="date" class="form-input" required>
                            </div>
                            <div style="flex:1;">
                                <label style="font-size:0.75rem; color:#666;">Estado</label>
                                <select name="status" class="form-select">
                                    <option value="Nuevo">Nuevo</option>
                                    <option value="Contactado">Contactado</option>
                                    <option value="Interesado">Interesado</option>
                                    <option value="Cerrado">Cerrado</option>
                                    <option value="Perdido">Perdido</option>
                                    <option value="Pausa" style="color:#EF4444;">⏸️ Pausa</option>
                                </select>
                            </div>
                        </div>
                        <input type="text" name="address" class="form-input" placeholder="Dirección del Negocio">
                        <select name="source" class="form-select">
                            <option value="" disabled selected>-- Fuente del Lead --</option>
                            <option value="Facebook Ads">Facebook Ads</option>
                            <option value="TikTok Ads">TikTok Ads</option>
                            <option value="Instagram Ads">Instagram Ads</option>
                            <option value="Referido">Referido</option>
                            <option value="Orgánico">Orgánico</option>
                        </select>
                    </div>
                </div>

                <!-- COTIZACIÓN ENVIADA (visible cuando NO es Cerrado) -->
                <div id="quoteSentSection" class="form-section" style="border-color:#93C5FD; background:#EFF6FF;">
                    <h4 class="section-title" style="color:#1D4ED8;">📨 Cotización Enviada</h4>
                    <p style="font-size:0.75rem; color:#64748B; margin:0 0 10px 0;">¿Se le envió propuesta o presupuesto al prospecto?</p>
                    <div style="display:flex; gap:10px; align-items:center;">
                        <select id="quoteSentStatus" class="form-select" style="width:auto; background:white;">
                            <option value="no">❌ No enviado</option>
                            <option value="si">✅ Enviado</option>
                        </select>
                    </div>
                </div>

                <div id="billingSectionWrapper">
                <div class="form-section" style="border-color:#86EFAC; background:#F0FDF4;">
                    <h4 class="section-title" style="color:#166534;">💰 Cobro Regular</h4>
                    <p style="font-size:0.75rem; color:#64748B; margin:0 0 12px 0;">Configura el cobro recurrente de este cliente (opcional)</p>

                    <div style="display:flex; flex-direction:column; gap:10px;">
                        <div>
                            <label style="font-size:0.75rem; color:#374151; font-weight:600;">Servicio</label>
                            <select id="billingService" class="form-select" style="width:100%; margin-top:4px;">
                                <option value="">-- Seleccionar servicio --</option>
                                ${availableServices.map(svc => `<option value="${svc.name}">${svc.name} (Bs. ${Number(svc.price || 0).toLocaleString('es-ES')})</option>`).join('')}
                            </select>
                        </div>

                        <div>
                            <label style="font-size:0.75rem; color:#374151; font-weight:600;">Concepto <span style="color:#9CA3AF; font-weight:400;">(opcional)</span></label>
                            <input type="text" id="billingConcept" class="form-input" placeholder="Descripción adicional (ej: Renovación anual, Plan premium...)" style="margin-top:4px;">
                        </div>

                        <div style="display:flex; gap:8px; align-items:flex-end;">
                            <div style="flex:1;">
                                <label style="font-size:0.75rem; color:#374151; font-weight:600;">Monto</label>
                                <input type="number" id="billingAmount" class="form-input" placeholder="0.00" step="0.01" min="0" style="margin-top:4px;">
                            </div>
                            <select id="billingCurrency" class="form-select" style="width:auto; min-width:75px; height:40px;">
                                <option value="BOB">Bs.</option>
                                <option value="USD">$us.</option>
                            </select>
                        </div>

                        <div style="border:1px dashed #F59E0B; border-radius:8px; padding:10px; background:#FFFBEB;">
                            <label style="font-size:0.75rem; color:#92400E; font-weight:600; display:block; margin-bottom:6px;">💳 Adelanto (opcional)</label>
                            <div style="display:flex; gap:8px; align-items:center;">
                                <input type="number" id="billingAdvance" class="form-input" placeholder="Monto adelanto" step="0.01" min="0" style="flex:1;">
                                <input type="text" id="billingAdvanceConcept" class="form-input" placeholder="Concepto (ej: 50% inicio)" style="flex:2;">
                            </div>
                        </div>

                        <div style="display:flex; gap:8px; align-items:center;">
                            <label style="font-size:0.75rem; color:#374151; font-weight:600; white-space:nowrap;">Día de cobro:</label>
                            <select id="billingDay" class="form-select" style="width:auto; min-width:70px;">
                                ${Array.from({ length: 31 }, (_, i) => `<option value="${i + 1}">${i + 1}</option>`).join('')}
                            </select>
                        </div>

                        <div style="display:flex; gap:8px; align-items:center;">
                            <label style="font-size:0.75rem; color:#374151; font-weight:600; white-space:nowrap;">Frecuencia:</label>
                            <select id="billingFrequency" class="form-select" style="flex:1;">
                                <option value="">-- No configurar --</option>
                                <option value="monthly">Mensual</option>
                                <option value="yearly">Anual</option>
                                <option value="custom">Personalizado</option>
                            </select>
                        </div>

                        <div id="billingCustomRow" style="display:none; gap:8px; align-items:center;">
                            <label style="font-size:0.75rem; color:#374151; font-weight:600; white-space:nowrap;">Cada:</label>
                            <input type="number" id="billingCustomValue" class="form-input" min="1" value="1" style="width:60px;">
                            <select id="billingCustomUnit" class="form-select" style="width:auto;">
                                <option value="months">meses</option>
                                <option value="years">años</option>
                            </select>
                        </div>
                    </div>
                </div>
                </div><!-- /billingSectionWrapper -->

                <div class="form-section" style="border-color:#BFDBFE; background:#EFF6FF;">
                    <h4 class="section-title" style="color:#1D4ED8;">📋 Acciones a Seguir</h4>
                    <p style="font-size:0.75rem; color:#64748B; margin:0 0 12px 0;">Tareas no monetarias (seguimiento, llamadas, envíos...)</p>
                    
                    <div id="actionsContainer" style="display:flex; flex-direction:column; gap:8px;">
                        <!-- Actions will be added dynamically -->
                    </div>
                    
                    <button type="button" id="btnAddAction" style="
                        margin-top:10px;
                        padding:8px 16px;
                        background:transparent;
                        border:1px dashed #3B82F6;
                        border-radius:8px;
                        color:#3B82F6;
                        font-size:0.85rem;
                        font-weight:600;
                        cursor:pointer;
                        display:flex;
                        align-items:center;
                        gap:6px;
                        transition:all 0.2s;
                    ">
                        <i class="fas fa-plus"></i> Agregar Acción
                    </button>
                </div>                <div class="form-section">
                    <h4 class="section-title">🛠️ Servicios de Interés</h4>
                    
                    <div class="dropdown-wrapper">
                        <div class="dropdown-trigger" id="servicesDropdownTrigger">
                            <span id="servicesSelectedText">-- Seleccionar Servicios --</span>
                        </div>

                        <div class="dropdown-content" id="servicesDropdownContent">
                            <div class="search-box">
                                <span class="search-icon">🔍</span>
                                <input type="text" id="serviceSearchInput" class="search-input" placeholder="Buscar servicio...">
                            </div>
                            
                            <div class="services-list-scroll" id="servicesListContainer">
                                ${servicesCheckboxesHTML}
                            </div>
                        </div>
                    </div>
                </div>

                <div class="form-section" style="border-color:#BBF7D0; background:#F0FDF4;">
                    <h4 class="section-title" style="color:#15803D;">💰 Cotización</h4>
                    <div class="input-group">
                        <div class="input-row money-row">
                            <div style="flex: 2;"><label style="font-size:0.7rem;">Inversión</label><input type="number" id="inputInvest" class="form-input" placeholder="0.00"></div>
                            <div style="flex: 1;"><label style="font-size:0.7rem;">Moneda</label><select name="currency" id="inputCurrency" class="form-select" style="background:white;"><option value="BOB">BOB (Bs.)</option><option value="USD">USD ($)</option><option value="EUR">EUR (€)</option></select></div>
                        </div>
                        <div class="input-row money-row">
                            <div style="flex: 1;"><label style="font-size:0.7rem;">Descuento</label><input type="number" id="inputDiscount" class="form-input" placeholder="0"></div>
                            <div style="flex: 1;"><label style="font-size:0.7rem;">Tipo</label><select id="discountType" class="form-select" style="background:white;"><option value="amount">Monto ($)</option><option value="percent">Porcentaje (%)</option></select></div>
                        </div>
                        <input type="text" name="discountReason" class="form-input" placeholder="Motivo del descuento">
                    </div>
                    <div class="total-box"><span class="total-label">Total a Cobrar</span><span id="displayTotal" class="total-amount">0.00</span></div>
                </div>

                <button type="submit" class="btn-3d" style="width: 100%; justify-content: center; margin-top: 10px;">Guardar Prospecto</button>
            </form>
        `;

        const modalHTML = Modal.render('Nuevo Prospecto', formHTML, 'modalNewLead');
        const viewModalHTML = Modal.render('Ficha de Prospecto', '<div id="viewLeadContent"></div>', 'modalViewLead');

        const pageContent = `
            <div class="page-header" style="display: flex; flex-wrap: wrap; gap: 15px; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <div><h2 style="font-size: 1.5rem; font-weight: 700; color: var(--text-main); margin-bottom: 5px;">Prospectos</h2><p style="color: var(--text-muted); font-size: 0.9rem;">Gestiona tus oportunidades</p></div>
                <button class="btn-3d" id="btnOpenLeadModal">+ Nuevo Lead</button>
            </div>
            <div id="leadsTableContainer" style="overflow-x: auto;"><div class="loader"></div></div>
            ${modalHTML} ${viewModalHTML}
        `;

        return pageContent;
    },

    init: async () => {
        Modal.initEvents('modalNewLead');
        Modal.initEvents('modalViewLead');
        await LeadsModule.loadTable();

        const btnOpen = document.getElementById('btnOpenLeadModal');
        if (btnOpen) btnOpen.addEventListener('click', () => {
            const form = document.getElementById('createLeadForm');
            if (form) form.reset();
            document.getElementById('leadId').value = ''; // Reset ID
            document.getElementById('displayTotal').innerText = "0.00";
            document.getElementById('servicesSelectedText').innerText = "-- Seleccionar Servicios --";
            document.querySelectorAll('.service-chk').forEach(c => c.checked = false);

            const dateInput = document.querySelector('input[name="date"]');
            if (dateInput) dateInput.valueAsDate = new Date();

            // Reset actions container and add first action
            LeadsModule.resetActions();
            LeadsModule.addAction();

            // Reset billing custom row
            const customRow = document.getElementById('billingCustomRow');
            if (customRow) customRow.style.display = 'none';

            Modal.open('modalNewLead');
        });

        // --- LÓGICA DE ACCIONES A SEGUIR ---
        const btnAddAction = document.getElementById('btnAddAction');
        if (btnAddAction) {
            btnAddAction.addEventListener('click', () => LeadsModule.addAction());
        }

        const actionsContainer = document.getElementById('actionsContainer');
        if (actionsContainer) {
            actionsContainer.addEventListener('click', (e) => {
                if (e.target.closest('.btn-remove-action')) {
                    e.target.closest('.action-item').remove();
                    LeadsModule.updateActionLabels();
                }
            });
        }

        // --- LÓGICA STATUS → COTIZACIÓN vs COBRO ---
        const statusSelect = document.querySelector('select[name="status"]');
        const billingSectionWrapper = document.getElementById('billingSectionWrapper');
        const quoteSentSection = document.getElementById('quoteSentSection');
        const toggleBillingVisibility = () => {
            const st = statusSelect?.value;
            const isCerrado = st === 'Cerrado';
            if (billingSectionWrapper) billingSectionWrapper.style.display = isCerrado ? 'block' : 'none';
            if (quoteSentSection) quoteSentSection.style.display = isCerrado ? 'none' : 'block';
        };
        if (statusSelect) {
            statusSelect.addEventListener('change', toggleBillingVisibility);
            toggleBillingVisibility(); // Initial state
        }

        // --- LÓGICA DE COBRO REGULAR ---
        const billingFreq = document.getElementById('billingFrequency');
        const billingCustomRow = document.getElementById('billingCustomRow');
        if (billingFreq && billingCustomRow) {
            billingFreq.addEventListener('change', () => {
                billingCustomRow.style.display = billingFreq.value === 'custom' ? 'flex' : 'none';
            });
        }
        // Sincronizar moneda del billing con la moneda principal del lead
        const mainCurrency = document.querySelector('select[name="currency"]');
        const billingCurrencyEl = document.getElementById('billingCurrency');
        if (mainCurrency && billingCurrencyEl) {
            mainCurrency.addEventListener('change', () => {
                billingCurrencyEl.value = mainCurrency.value;
            });
        }

        // --- LÓGICA DEL DROPDOWN DE SERVICIOS ---
        const trigger = document.getElementById('servicesDropdownTrigger');
        const content = document.getElementById('servicesDropdownContent');
        const searchInput = document.getElementById('serviceSearchInput');
        const selectedText = document.getElementById('servicesSelectedText');
        const listContainer = document.getElementById('servicesListContainer');

        if (trigger && content) {
            // Abrir/Cerrar
            trigger.addEventListener('click', (e) => {
                e.stopPropagation();
                const isVisible = content.classList.contains('active');
                if (isVisible) content.classList.remove('active');
                else {
                    content.classList.add('active');
                    searchInput.focus();
                }
            });

            // Cerrar al hacer clic fuera
            document.addEventListener('click', (e) => {
                if (!content.contains(e.target) && !trigger.contains(e.target)) {
                    content.classList.remove('active');
                }
            });

            // Buscador (Filtro en tiempo real)
            searchInput.addEventListener('input', (e) => {
                const term = e.target.value.toLowerCase();
                const items = listContainer.querySelectorAll('.service-option');

                items.forEach(item => {
                    const text = item.querySelector('.svc-name').innerText.toLowerCase();
                    if (text.includes(term)) {
                        item.style.display = 'flex';
                    } else {
                        item.style.display = 'none';
                    }
                });
            });

            // Actualizar texto del trigger al seleccionar
            listContainer.addEventListener('change', () => {
                const checked = listContainer.querySelectorAll('.service-chk:checked');
                if (checked.length === 0) {
                    selectedText.innerText = "-- Seleccionar Servicios --";
                    selectedText.style.fontWeight = 'normal';
                } else {
                    selectedText.innerText = `${checked.length} Servicios seleccionados`;
                    selectedText.style.fontWeight = 'bold';
                    selectedText.style.color = 'var(--primary)';
                }
                // Auto-calcular inversión sumando precios de servicios seleccionados
                const inputInv = document.getElementById('inputInvest');
                if (inputInv) {
                    let total = 0;
                    checked.forEach(chk => { total += Number(chk.dataset.price) || 0; });
                    inputInv.value = total.toFixed(2);
                    inputInv.dispatchEvent(new Event('input'));
                }
            });
        }
        // ----------------------------------------

        // Lógica de cálculo (Igual que antes)
        const inputInvest = document.getElementById('inputInvest');
        const inputDiscount = document.getElementById('inputDiscount');
        const discountType = document.getElementById('discountType');
        const displayTotal = document.getElementById('displayTotal');
        const inputCurrency = document.getElementById('inputCurrency');

        const calculateTotal = () => {
            if (!inputInvest) return;
            const inv = Number(inputInvest.value) || 0;
            const discVal = Number(inputDiscount.value) || 0;
            const type = discountType.value;
            const curr = inputCurrency.value;
            let finalDiscount = type === 'percent' ? inv * (discVal / 100) : discVal;
            const total = Math.max(0, inv - finalDiscount);
            displayTotal.innerText = `${curr} ${total.toLocaleString('es-BO', { minimumFractionDigits: 2 })}`;
        };

        if (inputInvest) {
            [inputInvest, inputDiscount, discountType, inputCurrency].forEach(el => {
                el.addEventListener('input', calculateTotal);
                el.addEventListener('change', calculateTotal);
            });
        }

        const form = document.getElementById('createLeadForm');
        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                const btn = form.querySelector('button[type="submit"]');
                btn.innerText = 'Guardando...'; btn.disabled = true;

                // Recoger servicios
                const selectedServices = [];
                form.querySelectorAll('.service-chk:checked').forEach(chk => selectedServices.push(chk.value));

                try {
                    const id = form.id.value;
                    const inv = Number(inputInvest.value) || 0;
                    const discVal = Number(inputDiscount.value) || 0;
                    const type = discountType.value;
                    let finalDiscount = type === 'percent' ? (inv * (discVal / 100)) : discVal;
                    const total = Math.max(0, inv - finalDiscount);
                    const formData = {
                        name: form.name.value,
                        company: form.company.value,
                        phone: form.phone.value,
                        email: form.email.value,
                        date: form.date.value,
                        status: form.status.value,
                        address: form.address.value,
                        source: form.source.value,
                        services: selectedServices,
                        actions: LeadsModule.getActions(), // Acciones a seguir (no monetarias)
                        billing: form.status.value === 'Cerrado' ? LeadsModule.getBilling() : null,
                        quoteSent: document.getElementById('quoteSentStatus')?.value || 'no',
                        investment: inv,
                        discount: finalDiscount,
                        discountPercent: type === 'percent' ? discVal : 0,
                        discountType: type,
                        discountReason: form.discountReason.value,
                        currency: inputCurrency.value,
                        total: total
                    };

                    if (id) {
                        await LeadsService.update(id, formData);
                        Swal.fire('Actualizado', 'Lead actualizado correctamente', 'success');
                    } else {
                        await LeadsService.create(formData);
                        Swal.fire('Guardado', 'Lead creado correctamente', 'success');
                    }

                    Modal.close('modalNewLead');
                    form.reset();
                    displayTotal.innerText = "0.00";
                    selectedText.innerText = "-- Seleccionar Servicios --"; // Reset dropdown text
                    await LeadsModule.loadTable();
                } catch (error) {
                    console.error(error);
                    Swal.fire('Error', 'No se pudo guardar', 'error');
                } finally { btn.innerText = 'Guardar Prospecto'; btn.disabled = false; }
            });
        }
    },

    loadTable: async () => {
        const container = document.getElementById('leadsTableContainer');
        try {
            const leads = await LeadsService.getAll();
            const columns = [
                { header: 'NOMBRE', key: 'name', render: (row) => `<div><strong>${row.name}</strong><div style="font-size:0.75rem; color:#666;">${row.company || '-'}</div></div>` },
                { header: 'ESTADO', key: 'status', render: (row) => `<span style="background:#EFF6FF; color:#3B82F6; padding:4px 8px; border-radius:12px; font-size:0.75rem; font-weight:700;">${row.status}</span>` },
                { header: 'VALOR', key: 'total', render: (row) => `<span style="font-weight:700; color:#059669;">${Formatters.toCurrency(row.total, row.currency)}</span>` },
                {
                    header: 'ACCIONES', key: 'id', render: (row) => `
                    <div class="actions-cell">
                        <button class="btn-action-icon view btn-view-lead" data-id="${row.id}" title="Ver"><i class="fas fa-eye"></i></button>
                        <button class="btn-action-icon edit btn-edit-lead" data-id="${row.id}" title="Editar"><i class="fas fa-edit"></i></button>
                        <button class="btn-action-icon delete btn-delete-lead" data-id="${row.id}" title="Eliminar"><i class="fas fa-trash"></i></button>
                    </div>`
                }
            ];
            container.innerHTML = Table.render(columns, leads);

            // Ver
            container.querySelectorAll('.btn-view-lead').forEach(btn => {
                btn.addEventListener('click', async () => { await LeadsModule.viewLead(btn.getAttribute('data-id')); });
            });

            // Editar
            container.querySelectorAll('.btn-edit-lead').forEach(btn => {
                btn.addEventListener('click', async () => {
                    const id = btn.getAttribute('data-id');
                    const lead = await LeadsService.getById(id);
                    if (!lead) return;

                    const form = document.getElementById('createLeadForm');
                    form.reset();

                    form.id.value = lead.id;
                    form.name.value = lead.name;
                    form.company.value = lead.company || '';
                    form.phone.value = lead.phone || '';
                    form.email.value = lead.email || '';
                    form.date.value = lead.date;
                    form.status.value = lead.status;
                    form.address.value = lead.address || '';
                    form.source.value = lead.source || '';
                    form.discountReason.value = lead.discountReason || '';

                    // Servicios
                    const listContainer = document.getElementById('servicesListContainer');
                    const checkboxes = listContainer.querySelectorAll('.service-chk');
                    let count = 0;
                    checkboxes.forEach(chk => {
                        if (lead.services && lead.services.includes(chk.value)) {
                            chk.checked = true;
                            count++;
                        } else {
                            chk.checked = false;
                        }
                    });

                    const selectedText = document.getElementById('servicesSelectedText');
                    if (count > 0) {
                        selectedText.innerText = `${count} Servicios seleccionados`;
                        selectedText.style.fontWeight = 'bold';
                        selectedText.style.color = 'var(--primary)';
                    } else {
                        selectedText.innerText = "-- Seleccionar Servicios --";
                        selectedText.style.fontWeight = 'normal';
                        selectedText.style.color = '#374151';
                    }

                    // Financiero
                    document.getElementById('inputInvest').value = lead.investment || 0;
                    document.getElementById('inputCurrency').value = lead.currency || 'BOB';
                    document.getElementById('discountType').value = lead.discountType || 'amount';

                    if (lead.discountType === 'percent') {
                        document.getElementById('inputDiscount').value = lead.discountPercent || 0;
                    } else {
                        document.getElementById('inputDiscount').value = lead.discount || 0;
                    }

                    document.getElementById('displayTotal').innerText = `${lead.currency} ${lead.total.toLocaleString('es-BO', { minimumFractionDigits: 2 })}`;

                    // Cargar acciones y cobro regular
                    LeadsModule.loadActionsIntoForm(lead.actions || []);
                    LeadsModule.loadBilling(lead.billing || null);

                    // Cotización enviada
                    const quoteSentEl = document.getElementById('quoteSentStatus');
                    if (quoteSentEl) quoteSentEl.value = lead.quoteSent || 'no';

                    // Toggle billing vs quoteSent based on status
                    const toggleFn = () => {
                        const st = lead.status;
                        const isCerrado = st === 'Cerrado';
                        const bw = document.getElementById('billingSectionWrapper');
                        const qs = document.getElementById('quoteSentSection');
                        if (bw) bw.style.display = isCerrado ? 'block' : 'none';
                        if (qs) qs.style.display = isCerrado ? 'none' : 'block';
                    };
                    setTimeout(toggleFn, 50);

                    Modal.open('modalNewLead');
                });
            });

            // Eliminar
            container.querySelectorAll('.btn-delete-lead').forEach(btn => {
                btn.addEventListener('click', async () => {
                    const id = btn.getAttribute('data-id');
                    const result = await Swal.fire({
                        title: '¿Eliminar lead?',
                        text: "Esta acción no se puede deshacer",
                        icon: 'warning',
                        showCancelButton: true,
                        confirmButtonColor: '#EF4444',
                        cancelButtonColor: '#3B82F6',
                        confirmButtonText: 'Sí, eliminar',
                        cancelButtonText: 'Cancelar'
                    });

                    if (result.isConfirmed) {
                        await LeadsService.delete(id);
                        Swal.fire('Eliminado', 'Lead eliminado correctamente', 'success');
                        await LeadsModule.loadTable();
                    }
                });
            });

        } catch (e) { container.innerHTML = '<p>Error cargando leads</p>'; }
    },

    viewLead: async (id) => {
        const lead = await LeadsService.getById(id);
        if (!lead) return;
        const container = document.getElementById('viewLeadContent');
        const servicesBadges = lead.services && lead.services.length > 0 ? lead.services.map(s => `<span style="background:#EFF6FF; color:#2563EB; padding:4px 8px; border-radius:6px; font-size:0.75rem; border:1px solid #BFDBFE;">${s}</span>`).join('') : '<span style="color:#9CA3AF; font-size:0.8rem;">Sin servicios</span>';

        const isCerrado = lead.status === 'Cerrado';
        const statusColors = { 'Nuevo': '#3B82F6', 'Contactado': '#F59E0B', 'Interesado': '#8B5CF6', 'Cerrado': '#10B981', 'Perdido': '#EF4444', 'Pausa': '#6B7280' };
        const stColor = statusColors[lead.status] || '#3B82F6';

        // Billing info for Cerrado
        let billingHTML = '';
        if (isCerrado && lead.billing) {
            const b = lead.billing;
            const freqLabels = { monthly: 'Mensual', yearly: 'Anual', custom: 'Personalizado' };
            billingHTML = `
                <div style="background:#F0FDF4; padding:15px; border-radius:8px; border:1px solid #BBF7D0;">
                    <small style="color:#166534; display:block; margin-bottom:10px; font-weight:600;">💰 Cobro Regular</small>
                    <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; font-size:0.85rem;">
                        ${b.service ? `<div><small style="color:#9CA3AF;">Servicio</small><div style="font-weight:600;">${b.service}</div></div>` : ''}
                        ${b.concept ? `<div><small style="color:#9CA3AF;">Concepto</small><div>${b.concept}</div></div>` : ''}
                        <div><small style="color:#9CA3AF;">Monto</small><div style="font-weight:700; color:#059669;">${Formatters.toCurrency(b.amount, b.currency)}</div></div>
                        <div><small style="color:#9CA3AF;">Frecuencia</small><div>${freqLabels[b.frequency] || b.frequency || '-'}</div></div>
                        ${b.advance > 0 ? `<div><small style="color:#9CA3AF;">Adelanto</small><div style="color:#D97706; font-weight:600;">${Formatters.toCurrency(b.advance, b.currency)}${b.advanceConcept ? ' (' + b.advanceConcept + ')' : ''}</div></div>` : ''}
                    </div>
                    <div style="margin-top:12px; padding-top:10px; border-top:1px dashed #BBF7D0; font-size:0.85rem;">
                        <div style="margin-bottom:6px;"><small style="color:#9CA3AF;">Fecha de facturación</small><div style="font-weight:600;">Día ${b.dayOfMonth || '-'} de cada ${b.frequency === 'yearly' ? 'año' : b.frequency === 'quarterly' ? 'trimestre' : 'mes'}</div></div>
                        <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px;">
                            <div><small style="color:#9CA3AF;">Inicio del servicio</small><div style="font-weight:600;">${(() => { const d = lead.date ? new Date(lead.date) : new Date(); const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']; return meses[d.getMonth()] + ' ' + d.getFullYear(); })()}</div></div>
                            <div><small style="color:#9CA3AF;">Próxima renovación</small><div style="font-weight:600; color:#2563EB;">${(() => { const d = lead.date ? new Date(lead.date) : new Date(); const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']; if (b.frequency === 'yearly') d.setFullYear(d.getFullYear() + 1); else if (b.frequency === 'quarterly') d.setMonth(d.getMonth() + 3); else d.setMonth(d.getMonth() + 1); while (d < new Date()) { if (b.frequency === 'yearly') d.setFullYear(d.getFullYear() + 1); else if (b.frequency === 'quarterly') d.setMonth(d.getMonth() + 3); else d.setMonth(d.getMonth() + 1); } return meses[d.getMonth()] + ' ' + d.getFullYear(); })()}</div></div>
                        </div>
                    </div>
                </div>`;
        }

        // Quote sent status for non-Cerrado
        let quoteSentHTML = '';
        if (!isCerrado) {
            const sent = lead.quoteSent === 'si';
            quoteSentHTML = `
                <div style="background:${sent ? '#F0FDF4' : '#FEF2F2'}; padding:12px; border-radius:8px; border:1px solid ${sent ? '#BBF7D0' : '#FECACA'}; display:flex; align-items:center; gap:10px;">
                    <span style="font-size:1.2rem;">${sent ? '✅' : '❌'}</span>
                    <div>
                        <div style="font-weight:600; font-size:0.88rem; color:${sent ? '#166534' : '#991B1B'};">Cotización ${sent ? 'Enviada' : 'No Enviada'}</div>
                        <div style="font-size:0.75rem; color:#64748B;">Propuesta o presupuesto al prospecto</div>
                    </div>
                </div>`;
        }

        container.innerHTML = `
            <div style="display:flex; flex-direction:column; gap:16px;">
                <!-- HEADER -->
                <div style="display:flex; gap:15px; align-items:center; border-bottom:1px solid #F3F4F6; padding-bottom:15px;">
                    <div style="width:50px; height:50px; background:#E0E7FF; color:#4338CA; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:1.2rem; font-weight:700;">${lead.name.charAt(0)}</div>
                    <div style="flex:1;">
                        <h3 style="margin:0; color:#1F2937; font-size:1.1rem;">${lead.name}</h3>
                        <p style="margin:2px 0 0 0; color:#6B7280; font-size:0.9rem;">${lead.company || 'Particular'}</p>
                    </div>
                    <span style="background:${stColor}20; color:${stColor}; padding:5px 12px; border-radius:20px; font-size:0.78rem; font-weight:700; border:1px solid ${stColor}40;">${lead.status}</span>
                </div>

                <!-- CONTACTO RÁPIDO -->
                <div style="display:flex; gap:10px;">
                    <a href="https://wa.me/${lead.phone}" target="_blank" style="flex:1; text-align:center; background:#DCFCE7; color:#166534; padding:10px; border-radius:8px; text-decoration:none; font-weight:600; font-size:0.9rem;">💬 WhatsApp</a>
                    <a href="tel:${lead.phone}" style="flex:1; text-align:center; background:#F3F4F6; color:#374151; padding:10px; border-radius:8px; text-decoration:none; font-weight:600; font-size:0.9rem;">📞 Llamar</a>
                </div>

                <!-- DATOS COMPLETOS -->
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; font-size:0.88rem;">
                    <div><small style="color:#9CA3AF;">Teléfono</small><div style="font-weight:600;">${lead.phone || '-'}</div></div>
                    <div><small style="color:#9CA3AF;">Email</small><div style="overflow:hidden; text-overflow:ellipsis;">${lead.email || '-'}</div></div>
                    <div><small style="color:#9CA3AF;">Fuente</small><div style="font-weight:600;">${lead.source || '-'}</div></div>
                    <div><small style="color:#9CA3AF;">Fecha Registro</small><div>${lead.date || '-'}</div></div>
                    ${lead.address ? `<div style="grid-column:span 2;"><small style="color:#9CA3AF;">Dirección</small><div>${lead.address}</div></div>` : ''}
                </div>

                <!-- SERVICIOS -->
                <div><small style="color:#9CA3AF; display:block; margin-bottom:8px;">Servicios de Interés</small><div style="display:flex; flex-wrap:wrap; gap:8px;">${servicesBadges}</div></div>

                <!-- COTIZACIÓN ENVIADA (solo si NO es Cerrado) -->
                ${quoteSentHTML}
                ${lead.actions && lead.actions.length > 0 ? `
                    <div style="background:#EFF6FF; padding:15px; border-radius:8px; border:1px solid #BFDBFE;">
                        <small style="color:#1D4ED8; display:block; margin-bottom:10px; font-weight:600;">📋 Acciones a Seguir</small>
                        <div style="display:flex; flex-direction:column; gap:6px;">
                            ${lead.actions.map((action, idx) => {
            const actionText = typeof action === 'string' ? action : action.text;
            const actionDate = typeof action === 'string' ? '' : (action.date || '');
            let dateIndicator = '';
            if (actionDate) {
                const today = new Date(); today.setHours(0, 0, 0, 0);
                const dueDate = new Date(actionDate + 'T00:00:00');
                const diffDays = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
                const dateFormatted = dueDate.toLocaleDateString('es-BO', { day: '2-digit', month: 'short' });
                if (diffDays < 0) dateIndicator = `<span style="color:#EF4444; font-size:0.75rem; font-weight:600;">🔴 ${dateFormatted} (vencida)</span>`;
                else if (diffDays <= 3) dateIndicator = `<span style="color:#F59E0B; font-size:0.75rem; font-weight:600;">🟡 ${dateFormatted} (${diffDays === 0 ? 'hoy' : 'pronto'})</span>`;
                else dateIndicator = `<span style="color:#10B981; font-size:0.75rem;">🟢 ${dateFormatted}</span>`;
            }
            return `
                                <div style="display:flex; gap:8px; align-items:flex-start; flex-wrap:wrap;">
                                    <span style="background:#3B82F6; color:white; padding:2px 8px; border-radius:4px; font-size:0.7rem; font-weight:600;">${String.fromCharCode(65 + idx)})</span>
                                    <span style="font-size:0.85rem; color:#1E293B; flex:1;">${actionText}</span>
                                    ${dateIndicator}
                                </div>`;
        }).join('')}
                        </div>
                    </div>
                ` : ''}
                <div style="background:#F9FAFB; padding:15px; border-radius:8px; border:1px solid #E5E7EB;">
                    <div style="display:flex; justify-content:space-between; margin-bottom:5px; font-size:0.9rem;"><span>Subtotal:</span><span>${Formatters.toCurrency(lead.investment, lead.currency)}</span></div>
                    ${lead.billing && lead.billing.advance > 0 ? `<div style="display:flex; justify-content:space-between; margin-bottom:5px; font-size:0.9rem; color:#D97706;"><span>Adelanto${lead.billing.advanceConcept ? ' (' + lead.billing.advanceConcept + ')' : ''}:</span><span>- ${Formatters.toCurrency(lead.billing.advance, lead.billing.currency || lead.currency)}</span></div>` : ''}
                    <div style="display:flex; justify-content:space-between; margin-bottom:10px; font-size:0.9rem; color:#EF4444;"><span>Descuento:</span><span>- ${Formatters.toCurrency(lead.discount, lead.currency)}</span></div>
                    <div style="border-top:1px dashed #D1D5DB; padding-top:10px; display:flex; justify-content:space-between; align-items:center;"><span style="font-weight:700;">TOTAL FINAL</span><span style="font-size:1.3rem; font-weight:800; color:#059669;">${Formatters.toCurrency(lead.total, lead.currency)}</span></div>
                </div>
                ${billingHTML}
            </div>`;

        // Botón para descargar como imagen
        const downloadBtn = document.createElement('button');
        downloadBtn.style.cssText = 'width:100%; margin-top:12px; padding:12px; background:linear-gradient(135deg,#0F172A,#2563EB); color:white; border:none; border-radius:8px; font-size:0.88rem; font-weight:700; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:8px;';
        downloadBtn.innerHTML = '📥 Descargar Ficha (PNG)';
        container.appendChild(downloadBtn);

        downloadBtn.addEventListener('click', async () => {
            downloadBtn.textContent = '⏳ Generando...';
            downloadBtn.disabled = true;
            try {
                if (!window.html2canvas) {
                    await new Promise((resolve, reject) => {
                        const s = document.createElement('script');
                        s.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
                        s.onload = resolve; s.onerror = reject;
                        document.head.appendChild(s);
                    });
                }
                // Crear clon fuera de la vista con estilos fijos
                const el = container.querySelector('div');
                const clone = el.cloneNode(true);
                const wrapper = document.createElement('div');
                wrapper.style.cssText = 'position:fixed; top:0; left:-9999px; width:420px; padding:20px; background:#ffffff; box-sizing:border-box; font-family:inherit; z-index:-1;';
                wrapper.appendChild(clone);
                document.body.appendChild(wrapper);
                // Esperar que renderice
                await new Promise(r => setTimeout(r, 150));
                const canvas = await html2canvas(wrapper, {
                    scale: 2,
                    backgroundColor: '#ffffff',
                    useCORS: true,
                    scrollY: 0,
                    scrollX: 0
                });
                document.body.removeChild(wrapper);
                const link = document.createElement('a');
                link.download = 'Ficha_' + lead.name.replace(/[^a-zA-Z0-9 ]/g, '').replace(/ +/g, '_') + '.png';
                link.href = canvas.toDataURL('image/png');
                link.click();
                downloadBtn.innerHTML = '✅ Descargada';
            } catch (e) {
                console.error(e);
                downloadBtn.innerHTML = '❌ Error';
            }
            setTimeout(() => { downloadBtn.innerHTML = '📥 Descargar Ficha (PNG)'; downloadBtn.disabled = false; }, 2500);
        });

        Modal.open('modalViewLead');
    },

    // --- MÉTODOS PARA ACCIONES ---
    addAction: () => {
        const container = document.getElementById('actionsContainer');
        if (!container) return;

        const count = container.querySelectorAll('.action-item').length;
        if (count >= 26) {
            Swal.fire({ icon: 'warning', title: 'Límite alcanzado', text: 'Máximo 26 acciones (A-Z)' });
            return;
        }

        const letter = String.fromCharCode(65 + count); // A, B, C...
        const actionItem = document.createElement('div');
        actionItem.className = 'action-item';
        actionItem.style.cssText = 'display:flex; gap:6px; align-items:center; flex-wrap:wrap;';
        const today = new Date().toISOString().split('T')[0];
        actionItem.innerHTML = `
            <span style="background:#3B82F6; color:white; padding:4px 10px; border-radius:6px; font-size:0.75rem; font-weight:700; min-width:24px; text-align:center;">${letter})</span>
            <input type="text" class="form-input action-input" placeholder="Describe la acción..." style="flex:1; min-width:100px;">
            <input type="date" class="form-input action-date" value="${today}" style="width:140px; min-width:130px; color:#111827;">
            <button type="button" class="btn-remove-action" style="width:32px; height:32px; border:none; background:transparent; color:#EF4444; cursor:pointer; font-size:1rem;" title="Eliminar">
                <i class="fas fa-times"></i>
            </button>
        `;
        container.appendChild(actionItem);
    },

    resetActions: () => {
        const container = document.getElementById('actionsContainer');
        if (container) container.innerHTML = '';
    },

    updateActionLabels: () => {
        const container = document.getElementById('actionsContainer');
        if (!container) return;

        const items = container.querySelectorAll('.action-item');
        items.forEach((item, idx) => {
            const label = item.querySelector('span');
            if (label) label.textContent = String.fromCharCode(65 + idx) + ')';
        });
    },

    getActions: () => {
        const container = document.getElementById('actionsContainer');
        if (!container) return [];

        const actions = [];
        container.querySelectorAll('.action-item').forEach(item => {
            const textInput = item.querySelector('.action-input');
            const dateInput = item.querySelector('.action-date');
            const value = textInput ? textInput.value.trim() : '';
            const date = dateInput ? dateInput.value : '';
            if (value) {
                actions.push({ text: value, date: date });
            }
        });
        return actions;
    },

    loadActionsIntoForm: (actions) => {
        LeadsModule.resetActions();
        if (!actions || actions.length === 0) {
            LeadsModule.addAction();
            return;
        }
        actions.forEach((action, idx) => {
            LeadsModule.addAction();
            const textInputs = document.querySelectorAll('.action-input');
            const dateInputs = document.querySelectorAll('.action-date');
            if (typeof action === 'string') {
                if (textInputs[idx]) textInputs[idx].value = action;
            } else {
                if (textInputs[idx]) textInputs[idx].value = action.text || '';
                if (dateInputs[idx] && action.date) dateInputs[idx].value = action.date;
            }
        });
    },

    // --- MÉTODOS PARA COBRO REGULAR ---
    getBilling: () => {
        const freq = document.getElementById('billingFrequency');
        if (!freq || !freq.value) return null; // No configurado

        const billing = {
            service: document.getElementById('billingService')?.value || '',
            concept: document.getElementById('billingConcept')?.value || '',
            amount: Number(document.getElementById('billingAmount')?.value) || 0,
            currency: document.getElementById('billingCurrency')?.value || 'BOB',
            advance: Number(document.getElementById('billingAdvance')?.value) || 0,
            advanceConcept: document.getElementById('billingAdvanceConcept')?.value || '',
            dayOfMonth: Number(document.getElementById('billingDay')?.value) || 1,
            frequency: freq.value,
            active: true
        };

        if (freq.value === 'custom') {
            billing.customInterval = {
                value: Number(document.getElementById('billingCustomValue')?.value) || 1,
                unit: document.getElementById('billingCustomUnit')?.value || 'months'
            };
        }

        return billing;
    },

    loadBilling: (billing) => {
        if (!billing) return;
        const service = document.getElementById('billingService');
        const concept = document.getElementById('billingConcept');
        const amount = document.getElementById('billingAmount');
        const currency = document.getElementById('billingCurrency');
        const advance = document.getElementById('billingAdvance');
        const advConcept = document.getElementById('billingAdvanceConcept');
        const day = document.getElementById('billingDay');
        const freq = document.getElementById('billingFrequency');
        const customRow = document.getElementById('billingCustomRow');
        const customVal = document.getElementById('billingCustomValue');
        const customUnit = document.getElementById('billingCustomUnit');

        if (service) service.value = billing.service || '';
        if (concept) concept.value = billing.concept || '';
        if (amount) amount.value = billing.amount || '';
        if (currency) currency.value = billing.currency || 'BOB';
        if (advance) advance.value = billing.advance || '';
        if (advConcept) advConcept.value = billing.advanceConcept || '';
        if (day) day.value = billing.dayOfMonth || 1;
        if (freq) {
            freq.value = billing.frequency || '';
            if (billing.frequency === 'custom' && customRow) {
                customRow.style.display = 'flex';
                if (customVal && billing.customInterval) customVal.value = billing.customInterval.value || 1;
                if (customUnit && billing.customInterval) customUnit.value = billing.customInterval.unit || 'months';
            }
        }
    },

    destroy: () => { }
};

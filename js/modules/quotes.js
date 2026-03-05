import { Table } from '../components/Table.js';
import { Modal } from '../components/Modal.js';
import { QuotesService } from '../services/quotes.service.js';
import { LeadsService } from '../services/leads.service.js';
import { SettingsService } from '../services/settings.service.js';
import { Formatters } from '../utils/formatters.js';

export const QuotesModule = {
    render: async () => {
        const [availableServices, allLeads] = await Promise.all([
            SettingsService.getServicesWithDetails(),
            LeadsService.getAll()
        ]);
        // Filtrar leads por estado válido para cotizar
        const quotableLeads = allLeads.filter(l => ['Nuevo', 'Contactado', 'Interesado'].includes(l.status));
        const leadOptionsHTML = quotableLeads.map(l => `<option value="${l.id}" data-name="${l.name || ''}" data-company="${l.company || ''}" data-phone="${l.phone || ''}" data-email="${l.email || ''}">${l.name} — ${l.company || 'Particular'} (${l.status})</option>`).join('');

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
                .input-group { display: flex; flex-direction: column; gap: 12px; }
                .input-row { display: flex; gap: 10px; align-items: center; }
                .form-input, .form-select { width: 100%; padding: 10px; border: 1px solid #D1D5DB; border-radius: 6px; font-size: 0.95rem; box-sizing: border-box; }
                .dropdown-wrapper { position: relative; width: 100%; }
                .dropdown-trigger { width: 100%; padding: 10px; background: white; border: 1px solid #D1D5DB; border-radius: 6px; display: flex; justify-content: space-between; align-items: center; cursor: pointer; font-size: 0.95rem; color: #374151; }
                .dropdown-trigger:after { content: '▼'; font-size: 0.7rem; color: #6B7280; }
                .dropdown-content { display: none; position: absolute; top: 105%; left: 0; right: 0; background: white; border: 1px solid #D1D5DB; border-radius: 8px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); z-index: 100; padding: 10px; }
                .dropdown-content.active { display: block; }
                .search-box { position: relative; margin-bottom: 8px; }
                .search-input { width: 100%; padding: 8px 8px 8px 30px; border: 1px solid #E5E7EB; border-radius: 6px; font-size: 0.9rem; outline: none; }
                .search-icon { position: absolute; left: 8px; top: 8px; font-size: 0.9rem; color: #9CA3AF; }
                .services-list-scroll { max-height: 200px; overflow-y: auto; display: flex; flex-direction: column; gap: 2px; }
                .service-option { padding: 8px; border-radius: 4px; cursor: pointer; transition: background 0.1s; }
                .service-option:hover { background: #F3F4F6; }
                .total-box { background: #F0FDF4; border: 1px dashed #16A34A; padding: 15px; border-radius: 8px; margin-top: 15px; text-align: center; }
                .total-amount { color: #15803D; font-size: 1.8rem; font-weight: 800; display: block; }
                .dyn-row { display: flex; gap: 8px; align-items: center; margin-bottom: 6px; }
                .dyn-row .form-input { flex: 1; }
                .btn-remove-row { background: none; border: none; color: #EF4444; cursor: pointer; font-size: 1.1rem; padding: 4px 8px; flex-shrink: 0; }
                .btn-remove-row:hover { color: #DC2626; }
                .btn-add-row { background: #EFF6FF; border: 1px dashed #93C5FD; color: #2563EB; padding: 8px; border-radius: 6px; cursor: pointer; font-size: 0.85rem; font-weight: 600; width: 100%; margin-top: 6px; }
                .btn-add-row:hover { background: #DBEAFE; }
                .next-step-row { display: flex; align-items: center; gap: 10px; padding: 8px 12px; background: white; border: 1px solid #E2E8F0; border-radius: 8px; margin-bottom: 6px; }
                .next-step-row label { flex: 1; font-size: 0.88rem; color: #334155; cursor: pointer; }
                .next-step-row input[type="checkbox"] { width: 18px; height: 18px; accent-color: #2563EB; }
                .next-step-row select, .next-step-row input[type="date"] { padding: 6px 8px; border: 1px solid #D1D5DB; border-radius: 6px; font-size: 0.82rem; }
                @media (max-width: 480px) {
                    .input-row { flex-direction: column; }
                    .money-row { flex-direction: row; }
                }
            </style>

            <form id="createQuoteForm">
                <!-- 1 DATOS DEL CLIENTE (Auto-fill desde Leads) -->
                <div class="form-section">
                    <label style="font-weight:700; color:var(--primary); font-size:0.9rem;">👤 Información del Cliente</label>
                    <div class="input-group" style="margin-top:8px;">
                        <div>
                            <label style="font-size:0.7rem; color:#6B7280; font-weight:600;">Seleccionar Lead</label>
                            <select id="leadSelector" class="form-select" style="background:white; margin-top:2px; font-weight:600;">
                                <option value="">-- Seleccionar Lead --</option>
                                ${leadOptionsHTML}
                            </select>
                        </div>
                        <input type="text" name="client" id="inputClient" class="form-input" placeholder="Nombre del cliente *" required readonly style="background:#F3F4F6; margin-top:6px;">
                        <input type="text" name="clientCompany" id="inputCompany" class="form-input" placeholder="Empresa" readonly style="background:#F3F4F6;">
                        <div class="input-row">
                            <input type="text" name="clientPosition" id="inputPosition" class="form-input" placeholder="Cargo" style="flex:1;">
                            <input type="text" name="clientContact" id="inputContact" class="form-input" placeholder="WhatsApp/Email" readonly style="flex:1; background:#F3F4F6;">
                        </div>
                    </div>
                    <div style="display:flex; justify-content:space-between; margin-top:10px; font-size:0.8rem; color:#666;">
                        <span>Fecha: <strong>${new Date().toLocaleDateString()}</strong></span>
                        <span>Cotización #: <strong>Auto</strong></span>
                    </div>
                </div>

                <!-- 2 SERVICIOS -->
                <div class="form-section">
                    <label style="font-weight:700; color:var(--primary); font-size:0.9rem; display:block; margin-bottom:5px;">🛠️ Servicios a Cotizar</label>
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
                    <div style="margin-top:10px;">
                        <label style="font-size:0.7rem; color:#6B7280; font-weight:600;">Periodicidad del servicio</label>
                        <select id="quoteServicePeriod" class="form-select" style="background:white; margin-top:2px;">
                            <option value="mensual">📅 Mensual</option>
                            <option value="semanal">📆 Semanal</option>
                            <option value="anual">🗓️ Anual</option>
                            <option value="personalizada">⚙️ Personalizada</option>
                        </select>
                    </div>
                    <div id="customPeriodDates" style="display:none; margin-top:8px;">
                        <div style="display:flex; gap:8px;">
                            <div style="flex:1;"><label style="font-size:0.7rem; color:#6B7280;">Del</label><input type="date" id="periodFrom" class="form-input" style="margin-top:2px;"></div>
                            <div style="flex:1;"><label style="font-size:0.7rem; color:#6B7280;">Al</label><input type="date" id="periodTo" class="form-input" style="margin-top:2px;"></div>
                        </div>
                    </div>
                </div>

                <!-- 3 ALCANCE -->
                <div class="form-section">
                    <label style="font-weight:700; color:var(--primary); font-size:0.9rem;">📝 Alcance del Servicio</label>
                    <textarea name="serviceScope" id="inputScope" class="form-input" rows="3" placeholder="Describe el alcance de los servicios..." style="margin-top:8px;"></textarea>
                    <input type="text" name="duration" id="inputDuration" class="form-input" placeholder="Duración (ej: 30 días, 3 meses)" style="margin-top:8px;">
                </div>

                <!-- 4 CRONOGRAMA DINÁMICO -->
                <div class="form-section">
                    <label style="font-weight:700; color:var(--primary); font-size:0.9rem;">📅 Cronograma de Trabajo</label>
                    <div id="timelineContainer" style="margin-top:8px;">
                        <div class="dyn-row">
                            <select class="form-select timeline-unit" style="width:100px; flex:none;">
                                <option value="Semana">Semana</option>
                                <option value="Mes">Mes</option>
                                <option value="Año">Año</option>
                            </select>
                            <input type="number" class="form-input timeline-num" value="1" min="1" style="width:50px; flex:none; text-align:center;">
                            <input type="text" class="form-input timeline-desc" placeholder="Descripción...">
                            <button type="button" class="btn-remove-row" title="Eliminar">✕</button>
                        </div>
                    </div>
                    <button type="button" class="btn-add-row" id="btnAddTimeline">+ Agregar etapa</button>
                </div>

                <!-- 5 OBJETIVOS DINÁMICOS -->
                <div class="form-section">
                    <label style="font-weight:700; color:var(--primary); font-size:0.9rem;">🎯 Objetivos</label>
                    <div id="objectivesContainer" style="margin-top:8px;">
                        <div class="dyn-row">
                            <input type="text" class="form-input obj-input" placeholder="Objetivo...">
                            <button type="button" class="btn-remove-row" title="Eliminar">✕</button>
                        </div>
                    </div>
                    <button type="button" class="btn-add-row" id="btnAddObjective">+ Agregar objetivo</button>
                </div>

                <!-- 6 INVERSIÓN -->
                <div class="form-section" style="border-color:#BBF7D0; background:#F0FDF4;">
                    <h4 style="margin:0 0 10px 0; color:#15803D; font-size:0.9rem; font-weight:700;">💰 Inversión</h4>

                    <div class="input-group">
                        <div class="input-row money-row">
                            <div style="flex: 2;"><label style="font-size:0.7rem;">Monto</label><input type="number" id="inputInvest" class="form-input" placeholder="0.00"></div>
                            <div style="flex: 1;"><label style="font-size:0.7rem;">Moneda</label><select name="currency" id="inputCurrency" class="form-select" style="background:white;"><option value="BOB">BOB (Bs.)</option><option value="USD">USD ($)</option><option value="EUR">EUR (€)</option></select></div>
                        </div>
                        <!-- COSTOS ADICIONALES DINÁMICOS -->
                        <div style="margin-top:4px; background:white; border:1px solid #D1FAE5; border-radius:8px; padding:10px;">
                            <label style="font-size:0.75rem; font-weight:700; color:#166534; text-transform:uppercase; letter-spacing:1px;">📦 Costos Adicionales</label>
                            <div id="extraCostsContainer" style="margin-top:8px;"></div>
                            <button type="button" class="btn-add-row" id="btnAddExtraCost" style="margin-top:6px;">+ Agregar costo adicional</button>
                        </div>
                        <div class="input-row money-row">
                            <div style="flex: 1;"><label style="font-size:0.7rem;">Descuento Principal</label><input type="number" id="inputDiscount" class="form-input" placeholder="0"></div>
                            <div style="flex: 1;"><label style="font-size:0.7rem;">Tipo</label><select id="discountType" class="form-select" style="background:white;"><option value="amount">Monto ($)</option><option value="percent">Porcentaje (%)</option></select></div>
                        </div>
                        <div class="input-row money-row">
                            <div style="flex: 1;"><label style="font-size:0.7rem;">Descuento Secundario</label><input type="number" id="inputDiscount2" class="form-input" placeholder="0"></div>
                            <div style="flex: 1;"><label style="font-size:0.7rem;">Tipo</label><select id="discountType2" class="form-select" style="background:white;"><option value="amount">Monto ($)</option><option value="percent">Porcentaje (%)</option></select></div>
                        </div>
                        <div class="input-row">
                            <div style="flex:1;"><label style="font-size:0.7rem;">Periodicidad de pago</label><select name="periodicity" id="inputPeriodicity" class="form-select" style="background:white;"><option value="unico">Pago único</option><option value="mensual">Mensual</option><option value="trimestral">Trimestral</option><option value="semestral">Semestral</option><option value="anual">Anual</option></select></div>
                        </div>
                    </div>
                    <div class="total-box"><span class="total-label">Total Cotizado</span><span id="displayTotal" class="total-amount">0.00</span></div>
                    <div style="margin-top:10px; background:#F8FAFC; border:1px solid #E2E8F0; border-radius:8px; padding:12px;">
                        <label style="font-size:0.75rem; font-weight:700; color:#15803D; text-transform:uppercase; letter-spacing:1px;">Beneficio Estimado</label>
                        <div style="font-size:0.85rem; color:#334155; margin-top:4px;">Inversión: <strong id="benefitAmount">-</strong></div>
                        <input type="text" id="inputBenefitObj" class="form-input" placeholder="Objetivo esperado (ej: aumentar solicitudes en un 30-50%)" style="margin-top:8px; font-size:0.85rem;">
                    </div>
                </div>

                <!-- 7 CONDICIONES DINÁMICAS -->
                <div class="form-section">
                    <label style="font-weight:700; color:var(--primary); font-size:0.9rem;">📋 Condiciones Comerciales</label>
                    <div id="conditionsContainer" style="margin-top:8px;">
                        <div class="dyn-row">
                            <span style="font-weight:700; color:#64748B; min-width:20px;">1.</span>
                            <input type="text" class="form-input cond-input" placeholder="Condición...">
                            <button type="button" class="btn-remove-row" title="Eliminar">✕</button>
                        </div>
                    </div>
                    <button type="button" class="btn-add-row" id="btnAddCondition">+ Agregar condición</button>
                </div>

                <!-- 8 PRÓXIMOS PASOS -->
                <div class="form-section">
                    <label style="font-weight:700; color:var(--primary); font-size:0.9rem;">🚀 Próximos Pasos</label>
                    <div style="margin-top:8px;">
                        <div class="next-step-row">
                            <input type="checkbox" id="stepAccept">
                            <label for="stepAccept">Confirmar aceptación de la propuesta</label>
                        </div>
                        <div class="next-step-row">
                            <input type="checkbox" id="stepPayment">
                            <label for="stepPayment">Realizar pago inicial</label>
                        </div>
                        <div class="next-step-row">
                            <input type="checkbox" id="stepMeeting">
                            <label for="stepMeeting">Agendar reunión de inicio</label>
                            <select id="meetingStatus" class="form-select" style="width:auto;">
                                <option value="pendiente">Por agendar</option>
                                <option value="fecha">Fecha definida</option>
                            </select>
                            <input type="date" id="meetingDate" class="form-input" style="width:auto; display:none;">
                        </div>
                    </div>
                </div>

                <!-- BOTONES -->
                <div style="display:flex; gap:10px; margin-top:15px;">
                    <button type="button" id="btnPreviewPDF" class="btn-3d" style="flex:1; background:white; color:#333; border:1px solid #ccc;">📄 Ver PDF</button>
                    <button type="submit" class="btn-3d" style="flex:2; justify-content: center;">Guardar Cotización</button>
                </div>
            </form>
        `;

        const modalHTML = Modal.render('Nueva Cotización', formHTML, 'modalNewQuote');

        const pageContent = `
            <div class="page-header" style="display: flex; flex-wrap: wrap; gap: 15px; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <div>
                    <h2 style="font-size: 1.5rem; font-weight: 700; color: var(--text-main); margin-bottom: 5px;">Cotizaciones</h2>
                    <p style="color: var(--text-muted); font-size: 0.9rem;">Gestión de propuestas comerciales</p>
                </div>
                <button class="btn-3d" id="btnOpenQuoteModal">+ Nueva</button>
            </div>
            
            <div id="quotesTableContainer" style="overflow-x: auto;">
                <div style="text-align:center; padding:40px; color:#9CA3AF;">No hay cotizaciones registradas.</div>
            </div>
            
            ${modalHTML}
        `;

        return pageContent;
    },

    init: async () => {
        Modal.initEvents('modalNewQuote');
        await QuotesModule.loadTable();

        const btnOpen = document.getElementById('btnOpenQuoteModal');
        if (btnOpen) {
            btnOpen.addEventListener('click', () => {
                Modal.open('modalNewQuote');
                setTimeout(() => QuotesModule.initModalEvents(), 100);
            });
        }
    },

    // Renumerar condiciones
    _renumberConditions: () => {
        document.querySelectorAll('#conditionsContainer .dyn-row').forEach((row, i) => {
            row.querySelector('span').textContent = `${i + 1}.`;
        });
    },

    initModalEvents: () => {

        // --- LEAD SELECTOR: auto-fill client info ---
        const leadSelector = document.getElementById('leadSelector');
        if (leadSelector) {
            leadSelector.addEventListener('change', () => {
                const opt = leadSelector.options[leadSelector.selectedIndex];
                if (!opt.value) return;
                document.getElementById('inputClient').value = opt.dataset.name || '';
                document.getElementById('inputCompany').value = opt.dataset.company || '';
                document.getElementById('inputContact').value = opt.dataset.phone || opt.dataset.email || '';
            });
        }

        // --- DROPDOWN SERVICIOS ---
        const trigger = document.getElementById('servicesDropdownTrigger');
        const content = document.getElementById('servicesDropdownContent');
        const searchInput = document.getElementById('serviceSearchInput');
        const selectedText = document.getElementById('servicesSelectedText');
        const listContainer = document.getElementById('servicesListContainer');

        if (trigger && content) {
            trigger.addEventListener('click', (e) => {
                e.stopPropagation();
                content.classList.toggle('active');
                if (content.classList.contains('active')) searchInput.focus();
            });

            document.addEventListener('click', (e) => {
                if (!content.contains(e.target) && !trigger.contains(e.target)) content.classList.remove('active');
            });

            searchInput.addEventListener('input', (e) => {
                const term = e.target.value.toLowerCase();
                listContainer.querySelectorAll('.service-option').forEach(item => {
                    item.style.display = item.innerText.toLowerCase().includes(term) ? 'flex' : 'none';
                });
            });

            listContainer.addEventListener('change', () => {
                const checked = listContainer.querySelectorAll('.service-chk:checked');
                const count = checked.length;
                selectedText.innerText = count > 0 ? `${count} Servicios seleccionados` : "-- Seleccionar Servicios --";
                selectedText.style.fontWeight = count > 0 ? 'bold' : 'normal';
                selectedText.style.color = count > 0 ? 'var(--primary)' : '#374151';
                // Auto-calcular monto sumando precios de servicios
                const inputInv = document.getElementById('inputInvest');
                if (inputInv) {
                    let total = 0;
                    checked.forEach(chk => { total += Number(chk.dataset.price) || 0; });
                    inputInv.value = total.toFixed(2);
                    inputInv.dispatchEvent(new Event('input'));
                }
            });
        }

        // --- CRONOGRAMA DINÁMICO ---
        document.getElementById('btnAddTimeline')?.addEventListener('click', () => {
            const container = document.getElementById('timelineContainer');
            const count = container.querySelectorAll('.dyn-row').length;
            const row = document.createElement('div');
            row.className = 'dyn-row';
            row.innerHTML = `
                <select class="form-select timeline-unit" style="width:100px; flex:none;">
                    <option value="Semana">Semana</option><option value="Mes">Mes</option><option value="Año">Año</option>
                </select>
                <input type="number" class="form-input timeline-num" value="${count + 1}" min="1" style="width:50px; flex:none; text-align:center;">
                <input type="text" class="form-input timeline-desc" placeholder="Descripción...">
                <button type="button" class="btn-remove-row" title="Eliminar">✕</button>`;
            container.appendChild(row);
            row.querySelector('.btn-remove-row').addEventListener('click', () => row.remove());
            row.querySelector('.timeline-desc').focus();
        });

        // --- OBJETIVOS DINÁMICOS ---
        document.getElementById('btnAddObjective')?.addEventListener('click', () => {
            const container = document.getElementById('objectivesContainer');
            const row = document.createElement('div');
            row.className = 'dyn-row';
            row.innerHTML = `
                <input type="text" class="form-input obj-input" placeholder="Objetivo...">
                <button type="button" class="btn-remove-row" title="Eliminar">✕</button>`;
            container.appendChild(row);
            row.querySelector('.btn-remove-row').addEventListener('click', () => row.remove());
            row.querySelector('.obj-input').focus();
        });

        // --- CONDICIONES DINÁMICAS ---
        document.getElementById('btnAddCondition')?.addEventListener('click', () => {
            const container = document.getElementById('conditionsContainer');
            const count = container.querySelectorAll('.dyn-row').length;
            const row = document.createElement('div');
            row.className = 'dyn-row';
            row.innerHTML = `
                <span style="font-weight:700; color:#64748B; min-width:20px;">${count + 1}.</span>
                <input type="text" class="form-input cond-input" placeholder="Condición...">
                <button type="button" class="btn-remove-row" title="Eliminar">✕</button>`;
            container.appendChild(row);
            row.querySelector('.btn-remove-row').addEventListener('click', () => { row.remove(); QuotesModule._renumberConditions(); });
            row.querySelector('.cond-input').focus();
        });

        // Remove buttons para filas iniciales
        document.querySelectorAll('.btn-remove-row').forEach(btn => {
            btn.addEventListener('click', () => {
                const container = btn.closest('#conditionsContainer');
                btn.closest('.dyn-row').remove();
                if (container) QuotesModule._renumberConditions();
            });
        });

        // --- REUNIÓN: mostrar/ocultar fecha ---
        const meetingStatus = document.getElementById('meetingStatus');
        const meetingDate = document.getElementById('meetingDate');
        if (meetingStatus && meetingDate) {
            meetingStatus.addEventListener('change', () => {
                meetingDate.style.display = meetingStatus.value === 'fecha' ? 'block' : 'none';
            });
        }

        // --- PERIODICIDAD: mostrar/ocultar fechas personalizadas ---
        const quoteServicePeriod = document.getElementById('quoteServicePeriod');
        const customPeriodDates = document.getElementById('customPeriodDates');
        if (quoteServicePeriod) {
            quoteServicePeriod.addEventListener('change', () => {
                if (customPeriodDates) customPeriodDates.style.display = quoteServicePeriod.value === 'personalizada' ? 'block' : 'none';
            });
        }

        // --- COSTOS ADICIONALES DINÁMICOS ---
        const extraCostsContainer = document.getElementById('extraCostsContainer');
        document.getElementById('btnAddExtraCost')?.addEventListener('click', () => {
            const row = document.createElement('div');
            row.className = 'dyn-row';
            row.style.cssText = 'display:flex; gap:6px; align-items:center; margin-bottom:6px;';
            row.innerHTML = `
                <input type="number" class="form-input extra-cost-amount" placeholder="0.00" style="flex:1; max-width:120px;">
                <input type="text" class="form-input extra-cost-desc" placeholder="Descripción (ej: Publicidad, hosting...)" style="flex:2;">
                <button type="button" class="btn-remove-row" title="Eliminar" style="flex:none;">✕</button>`;
            extraCostsContainer.appendChild(row);
            row.querySelector('.btn-remove-row').addEventListener('click', () => { row.remove(); calculateTotal(); });
            row.querySelector('.extra-cost-amount').addEventListener('input', calculateTotal);
            row.querySelector('.extra-cost-amount').focus();
        });

        // --- LÓGICA FINANCIERA (monto + costos adicionales + dual descuento) ---
        const inputInvest = document.getElementById('inputInvest');
        const inputDiscount = document.getElementById('inputDiscount');
        const discountType = document.getElementById('discountType');
        const inputDiscount2 = document.getElementById('inputDiscount2');
        const discountType2 = document.getElementById('discountType2');
        const displayTotal = document.getElementById('displayTotal');
        const inputCurrency = document.getElementById('inputCurrency');

        const calculateTotal = () => {
            const inv = Number(inputInvest.value) || 0;
            // Sumar costos adicionales
            let extraTotal = 0;
            document.querySelectorAll('#extraCostsContainer .extra-cost-amount').forEach(inp => {
                extraTotal += Number(inp.value) || 0;
            });
            const subtotal = inv + extraTotal;
            // Descuento principal
            const discVal1 = Number(inputDiscount.value) || 0;
            const type1 = discountType.value;
            let disc1 = type1 === 'percent' ? subtotal * (discVal1 / 100) : discVal1;
            // Descuento secundario
            const discVal2 = Number(inputDiscount2?.value) || 0;
            const type2 = discountType2?.value || 'amount';
            let disc2 = type2 === 'percent' ? subtotal * (discVal2 / 100) : discVal2;
            const finalDiscount = disc1 + disc2;
            const total = Math.max(0, subtotal - finalDiscount);
            displayTotal.innerText = `${inputCurrency.value} ${total.toLocaleString('es-BO', { minimumFractionDigits: 2 })}`;
            // Actualizar beneficio estimado
            const periodLabel = { unico: '', mensual: 'mensual', trimestral: 'trimestral', semestral: 'semestral', anual: 'anual' };
            const pLabel = periodLabel[document.getElementById('inputPeriodicity').value] || '';
            const benefitEl = document.getElementById('benefitAmount');
            if (benefitEl) benefitEl.textContent = `${inputCurrency.value} ${total.toLocaleString('es-BO', { minimumFractionDigits: 2 })}${pLabel ? ' ' + pLabel : ''}`;
            return { total, finalDiscount, subtotal };
        };

        if (inputInvest) {
            [inputInvest, inputDiscount, discountType, inputDiscount2, discountType2, inputCurrency].filter(Boolean).forEach(el => {
                el.addEventListener('input', calculateTotal);
                el.addEventListener('change', calculateTotal);
            });
        }

        // --- VER PDF ---
        document.getElementById('btnPreviewPDF')?.addEventListener('click', () => {
            QuotesModule.generatePDF();
        });

        // --- GUARDAR COTIZACIÓN ---
        const form = document.getElementById('createQuoteForm');
        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();

                const client = document.getElementById('inputClient').value;
                const clientCompany = document.getElementById('inputCompany').value;
                const clientPosition = document.getElementById('inputPosition').value;
                const clientContact = document.getElementById('inputContact').value;

                const selectedServices = Array.from(document.querySelectorAll('#servicesListContainer .service-chk:checked')).map(cb => cb.value);
                const serviceScope = document.getElementById('inputScope').value;
                const duration = document.getElementById('inputDuration').value;

                // Cronograma dinámico
                const timeline = [];
                document.querySelectorAll('#timelineContainer .dyn-row').forEach(row => {
                    const unit = row.querySelector('.timeline-unit').value;
                    const num = row.querySelector('.timeline-num').value;
                    const desc = row.querySelector('.timeline-desc').value;
                    if (desc.trim()) timeline.push({ unit, num, desc });
                });

                // Objetivos dinámicos
                const objectives = [];
                document.querySelectorAll('#objectivesContainer .obj-input').forEach(input => {
                    if (input.value.trim()) objectives.push(input.value.trim());
                });

                // Financiero
                const investment = Number(document.getElementById('inputInvest').value) || 0;
                const discount = Number(document.getElementById('inputDiscount').value) || 0;
                const discountTypeVal = document.getElementById('discountType').value;
                const currency = document.getElementById('inputCurrency').value;
                const periodicity = document.getElementById('inputPeriodicity').value;

                // Condiciones dinámicas
                const conditions = [];
                document.querySelectorAll('#conditionsContainer .cond-input').forEach(input => {
                    if (input.value.trim()) conditions.push(input.value.trim());
                });

                // Beneficio
                const benefitObjective = document.getElementById('inputBenefitObj')?.value || '';

                // Próximos pasos
                const nextSteps = {
                    accepted: document.getElementById('stepAccept')?.checked || false,
                    paid: document.getElementById('stepPayment')?.checked || false,
                    meetingScheduled: document.getElementById('stepMeeting')?.checked || false,
                    meetingStatus: document.getElementById('meetingStatus')?.value || 'pendiente',
                    meetingDate: document.getElementById('meetingDate')?.value || ''
                };

                let finalDiscount = discountTypeVal === 'percent' ? investment * (discount / 100) : discount;
                const total = Math.max(0, investment - finalDiscount);

                if (!client.trim()) { Swal.fire('Error', 'Ingresa el nombre del cliente', 'error'); return; }
                if (selectedServices.length === 0) { Swal.fire('Error', 'Selecciona al menos un servicio', 'error'); return; }

                try {
                    Swal.fire({ title: 'Guardando cotización...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });

                    await QuotesService.create({
                        client: client.trim(), clientCompany, clientPosition, clientContact,
                        services: selectedServices, serviceScope, duration,
                        timeline, objectives,
                        investment, discount, discountType: discountTypeVal, discountAmount: finalDiscount,
                        currency, periodicity, conditions, total, benefitObjective, nextSteps
                    });

                    Swal.fire({ icon: 'success', title: '¡Cotización Guardada!', text: `Cotización para ${client} creada`, timer: 2000, showConfirmButton: false });
                    Modal.close('modalNewQuote');
                    form.reset();
                    await QuotesModule.loadTable();
                } catch (error) {
                    console.error('Error:', error);
                    Swal.fire('Error', 'No se pudo guardar la cotización.', 'error');
                }
            });
        }
    },

    loadTable: async () => {
        const container = document.getElementById('quotesTableContainer');
        if (!container) return;

        try {
            const quotes = await QuotesService.getAll();

            if (quotes.length === 0) {
                container.innerHTML = '<div style="text-align:center; padding:40px; color:#9CA3AF;">No hay cotizaciones registradas.</div>';
                return;
            }

            container.innerHTML = `
                <table style="width:100%; border-collapse:collapse; font-size:0.9rem;">
                    <thead>
                        <tr style="background:#F1F5F9; text-align:left;">
                            <th style="padding:12px; font-weight:600;">#</th>
                            <th style="padding:12px; font-weight:600;">Cliente</th>
                            <th style="padding:12px; font-weight:600;">Servicios</th>
                            <th style="padding:12px; font-weight:600;">Total</th>
                            <th style="padding:12px; font-weight:600;">Fecha</th>
                            <th style="padding:12px; font-weight:600;">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${quotes.map(q => `
                            <tr style="border-bottom:1px solid #E5E7EB;">
                                <td style="padding:12px; font-weight:700; color:var(--primary);">#${q.quoteNumber || '-'}</td>
                                <td style="padding:12px;">${q.client}</td>
                                <td style="padding:12px;">
                                    ${(q.services || []).slice(0, 2).map(s => `<span style="background:#EFF6FF; color:#1E40AF; padding:2px 6px; border-radius:4px; font-size:0.75rem; margin-right:4px;">${s}</span>`).join('')}
                                    ${q.services && q.services.length > 2 ? `<span style="color:#666;">+${q.services.length - 2}</span>` : ''}
                                </td>
                                <td style="padding:12px; font-weight:700; color:#059669;">${Formatters.toCurrency(q.total, q.currency)}</td>
                                <td style="padding:12px; color:#666;">${Formatters.toDate(q.createdAt)}</td>
                                <td style="padding:12px;">
                                    <button onclick="viewQuotePDF('${q.id}')" style="background:none; border:none; color:#3B82F6; cursor:pointer; padding:5px; font-size:0.85rem;" title="Ver PDF">
                                        <i class="fas fa-file-pdf"></i> PDF
                                    </button>
                                    <button onclick="deleteQuote('${q.id}')" style="background:none; border:none; color:#EF4444; cursor:pointer; padding:5px;" title="Eliminar">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;

            window.deleteQuote = async (id) => {
                const result = await Swal.fire({
                    title: '¿Eliminar cotización?', text: 'Esta acción no se puede deshacer.',
                    icon: 'warning', showCancelButton: true, confirmButtonColor: '#EF4444',
                    confirmButtonText: 'Sí, eliminar', cancelButtonText: 'Cancelar'
                });
                if (result.isConfirmed) {
                    try {
                        await QuotesService.delete(id);
                        Swal.fire('Eliminada', 'La cotización ha sido eliminada.', 'success');
                        await QuotesModule.loadTable();
                    } catch (e) { Swal.fire('Error', 'No se pudo eliminar.', 'error'); }
                }
            };

            window.viewQuotePDF = async (id) => {
                try {
                    const quote = await QuotesService.getById(id);
                    if (!quote) { Swal.fire('Error', 'No se encontró la cotización', 'error'); return; }
                    QuotesModule._openQuotePDF(quote);
                } catch (e) { Swal.fire('Error', 'No se pudo generar el PDF', 'error'); }
            };
        } catch (error) {
            console.error('Error cargando cotizaciones:', error);
            container.innerHTML = '<div style="text-align:center; padding:40px; color:#EF4444;">Error al cargar cotizaciones.</div>';
        }
    },

    // ═══ PDF CORPORATIVO (html2pdf) ═══
    _openQuotePDF: (data) => {
        const fmtCurrency = (val, cur) => {
            const sym = cur === 'USD' ? '$' : cur === 'EUR' ? '€' : 'Bs.';
            return `${sym} ${(val || 0).toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        };
        const fmtDate = (d) => {
            if (!d) return new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
            const date = d.toDate ? d.toDate() : new Date(d);
            return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
        };

        const services = data.services || [];

        // Timeline: soporta formato viejo (array strings) y nuevo (array objects)
        let timelineHTML = '';
        const tl = data.timeline || [];
        if (tl.length > 0) {
            if (typeof tl[0] === 'string') {
                timelineHTML = tl.map((t, i) => `<div class="timeline-item"><span class="timeline-week">Semana ${i + 1}</span><span class="timeline-desc">${t}</span></div>`).join('');
            } else {
                timelineHTML = tl.map(t => `<div class="timeline-item"><span class="timeline-week">${t.unit} ${t.num}</span><span class="timeline-desc">${t.desc}</span></div>`).join('');
            }
        }

        // Objectives: soporta formato viejo (string con \n) y nuevo (array)
        let objectives = [];
        if (Array.isArray(data.objectives)) {
            objectives = data.objectives;
        } else if (typeof data.objectives === 'string' && data.objectives.trim()) {
            objectives = data.objectives.split('\n').filter(o => o.trim()).map(o => o.replace(/^[•\-]\s*/, ''));
        }

        // Conditions: soporta formato viejo (string con \n) y nuevo (array)
        let conditions = [];
        if (Array.isArray(data.conditions)) {
            conditions = data.conditions;
        } else if (typeof data.conditions === 'string' && data.conditions.trim()) {
            conditions = data.conditions.split('\n').filter(c => c.trim()).map(c => c.replace(/^[•\-]\s*/, ''));
        }

        // Próximos pasos
        const ns = data.nextSteps || {};
        const meetingText = ns.meetingStatus === 'fecha' && ns.meetingDate
            ? new Date(ns.meetingDate + 'T00:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })
            : 'Por agendar';

        const html = `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Propuesta - ${data.client || 'Cliente'}</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
    <style>
        *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
        html, body { margin: 0; padding: 0; width: 480px; overflow-x: hidden; }
        body { font-family: 'Inter', 'Segoe UI', system-ui, sans-serif; color: #1E293B; background: white; }
        .page { width: 100%; max-width: 480px; margin: 0 auto; background: white; overflow: hidden; }
        .report-header { background: linear-gradient(135deg, #0F172A 0%, #1E3A5F 50%, #2563EB 100%); color: white; padding: 24px; display: flex; align-items: center; justify-content: space-between; }
        .header-left { display: flex; align-items: center; gap: 16px; }
        .header-logo { width: 42px; height: 42px; background: white; border-radius: 10px; padding: 6px; display: flex; align-items: center; justify-content: center; }
        .header-logo img { width: 100%; height: 100%; object-fit: contain; }
        .header-brand { font-size: 1.05rem; font-weight: 800; letter-spacing: -0.5px; }
        .header-sub { font-size: 0.8rem; font-weight: 400; color: rgba(255,255,255,0.7); margin-top: 2px; }
        .header-right { text-align: right; }
        .header-right .doc-type { font-size: 0.7rem; text-transform: uppercase; letter-spacing: 2px; color: rgba(255,255,255,0.6); font-weight: 600; }
        .header-right .doc-date { font-size: 0.8rem; color: rgba(255,255,255,0.8); margin-top: 4px; }
        .content { padding: 20px 24px; }
        .title-section { margin-bottom: 24px; padding-bottom: 16px; border-bottom: 2px solid #E2E8F0; }
        .title-section h1 { font-size: 1.5rem; font-weight: 800; color: #0F172A; letter-spacing: -0.5px; margin-bottom: 4px; }
        .title-section .subtitle { font-size: 0.85rem; color: #64748B; }
        .client-card { background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 10px; padding: 16px; margin-bottom: 24px; }
        .client-label { font-size: 0.65rem; text-transform: uppercase; letter-spacing: 1.5px; color: #94A3B8; font-weight: 600; margin-bottom: 6px; }
        .client-name { font-size: 1.1rem; font-weight: 700; color: #0F172A; }
        .client-detail { font-size: 0.82rem; color: #64748B; margin-top: 3px; }
        .section { margin-bottom: 22px; }
        .section-header { font-size: 0.7rem; text-transform: uppercase; letter-spacing: 1.5px; color: #94A3B8; font-weight: 700; margin-bottom: 12px; padding-bottom: 6px; border-bottom: 2px solid #E2E8F0; }
        .services-list { display: flex; flex-direction: column; gap: 6px; }
        .service-item { background: white; border: 1px solid #E2E8F0; border-radius: 8px; padding: 10px 14px; display: flex; align-items: center; gap: 10px; }
        .service-num { background: #2563EB; color: white; font-size: 0.7rem; font-weight: 700; width: 22px; height: 22px; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .service-name { font-size: 0.88rem; font-weight: 600; color: #0F172A; }
        .scope-box { background: #F8FAFC; border-left: 3px solid #2563EB; padding: 14px 18px; border-radius: 0 8px 8px 0; margin-top: 10px; }
        .scope-box p { font-size: 0.85rem; color: #475569; line-height: 1.6; font-style: italic; }
        .timeline-list { display: flex; flex-direction: column; gap: 6px; }
        .timeline-item { display: flex; align-items: center; gap: 12px; padding: 8px 14px; background: #F8FAFC; border-radius: 8px; }
        .timeline-week { font-size: 0.75rem; font-weight: 700; color: #2563EB; white-space: nowrap; min-width: 70px; }
        .timeline-desc { font-size: 0.82rem; color: #475569; }
        .obj-list { display: flex; flex-direction: column; gap: 6px; }
        .obj-item { font-size: 0.85rem; color: #475569; padding: 6px 0 6px 16px; position: relative; }
        .obj-item::before { content: '✓'; position: absolute; left: 0; color: #2563EB; font-weight: 700; }
        .finance-table { width: 100%; border-collapse: separate; border-spacing: 0; border: 1px solid #E2E8F0; border-radius: 10px; overflow: hidden; }
        .finance-table td { padding: 11px 16px; font-size: 0.85rem; border-bottom: 1px solid #F1F5F9; }
        .finance-table td:first-child { color: #64748B; font-weight: 500; }
        .finance-table td:last-child { text-align: right; font-weight: 600; color: #0F172A; }
        .finance-table tr:last-child td { border-bottom: none; }
        .finance-table .discount-row td { color: #EF4444; }
        .finance-table .total-row { background: linear-gradient(135deg, #EFF6FF, #DBEAFE); }
        .finance-table .total-row td { font-weight: 800; font-size: 1rem; border-bottom: none; }
        .finance-table .total-row td:last-child { color: #2563EB; }
        .cond-list { font-size: 0.8rem; color: #64748B; line-height: 1.8; padding-left: 0; list-style: none; counter-reset: cond; }
        .cond-list li { counter-increment: cond; padding-left: 24px; position: relative; margin-bottom: 4px; }
        .cond-list li::before { content: counter(cond) "."; position: absolute; left: 0; font-weight: 700; color: #94A3B8; }
        .cta-section { background: linear-gradient(135deg, #EFF6FF, #DBEAFE); border: 1px solid #BFDBFE; border-radius: 10px; padding: 18px; margin-bottom: 22px; }
        .cta-title { font-size: 0.85rem; font-weight: 700; color: #1E40AF; margin-bottom: 10px; }
        .step-row { display: flex; align-items: center; gap: 10px; padding: 6px 0; font-size: 0.82rem; color: #475569; }
        .step-check { width: 18px; height: 18px; border: 2px solid #CBD5E1; border-radius: 4px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .step-check.done { background: #2563EB; border-color: #2563EB; color: white; font-size: 0.7rem; }
        .step-detail { font-size: 0.72rem; color: #94A3B8; margin-left: auto; }
        .firma { padding-top: 16px; border-top: 1px solid #E2E8F0; }
        .firma-name { font-size: 0.95rem; font-weight: 700; color: #0F172A; }
        .firma-role { font-size: 0.82rem; color: #64748B; margin-top: 2px; }
        .firma-contact { font-size: 0.78rem; color: #94A3B8; margin-top: 8px; }
        .report-footer { margin-top: 20px; padding: 16px 24px 60px; background: #F8FAFC; border-top: 1px solid #E2E8F0; text-align: center; }
        .footer-text { font-size: 0.7rem; color: #94A3B8; line-height: 1.6; }
        .btn-download { display: block; width: calc(100% - 48px); margin: 20px auto; padding: 14px; background: linear-gradient(135deg, #0F172A, #2563EB); color: white; border: none; border-radius: 10px; font-family: inherit; font-size: 0.9rem; font-weight: 700; cursor: pointer; text-align: center; }
        .btn-download:active { opacity: 0.8; }
        .btn-download:disabled { opacity: 0.6; cursor: wait; }
    </style>
</head>
<body>
    <div class="page">
        <div class="report-header">
            <div class="header-left">
                <div class="header-logo"><img src="logo.png" alt="Logo"></div>
                <div>
                    <div class="header-brand">Magic Design Efecto</div>
                    <div class="header-sub">Estudio de Estrategia Digital</div>
                </div>
            </div>
            <div class="header-right">
                <div class="doc-type">Propuesta Comercial</div>
                <div class="doc-date">${fmtDate(data.createdAt)}</div>
            </div>
        </div>

        <div class="content">
            <div class="title-section">
                <h1>Propuesta Comercial</h1>
                <div class="subtitle">Cotización #${data.quoteNumber || '001'} · ${data.duration || 'Servicio profesional'}</div>
            </div>

            <div class="client-card">
                <div class="client-label">Cliente</div>
                <div class="client-name">${data.client || 'Sin nombre'}</div>
                ${data.clientCompany || data.clientPosition ? `<div class="client-detail">${data.clientCompany || ''}${data.clientPosition ? ' · ' + data.clientPosition : ''}</div>` : ''}
                ${data.clientContact ? `<div class="client-detail">${data.clientContact}</div>` : ''}
            </div>

            ${services.length > 0 ? `
            <div class="section">
                <div class="section-header">Servicios Incluidos</div>
                <div class="services-list">
                    ${services.map((s, i) => `<div class="service-item"><span class="service-num">${i + 1}</span><span class="service-name">${s}</span></div>`).join('')}
                </div>
            </div>` : ''}

            ${data.serviceScope ? `
            <div class="section">
                <div class="section-header">Alcance del Servicio</div>
                <div class="scope-box"><p>${data.serviceScope}</p></div>
            </div>` : ''}

            ${timelineHTML ? `
            <div class="section">
                <div class="section-header">Cronograma de Trabajo</div>
                <div class="timeline-list">${timelineHTML}</div>
            </div>` : ''}

            ${objectives.length > 0 ? `
            <div class="section">
                <div class="section-header">Objetivos</div>
                <div class="obj-list">
                    ${objectives.map(o => `<div class="obj-item">${o}</div>`).join('')}
                </div>
            </div>` : ''}

            <div class="section">
                <div class="section-header">Inversión</div>
                ${data.servicePeriod ? `<div style="font-size:0.82rem; color:#334155; margin-bottom:10px; padding:8px 12px; background:#F8FAFC; border-radius:6px; border-left:3px solid #2563EB;">
                    <strong>Periodicidad del servicio:</strong> ${data.servicePeriod === 'personalizada' && data.periodFrom ? 'Del ' + data.periodFrom + ' al ' + data.periodTo : data.servicePeriod}
                </div>` : ''}
                <table class="finance-table">
                    <tr><td>Monto</td><td>${fmtCurrency(data.investment, data.currency)}</td></tr>
                    ${(data.extraCosts || []).map(ec => `<tr><td>${ec.desc || 'Costo adicional'}</td><td>${fmtCurrency(ec.amount, data.currency)}</td></tr>`).join('')}
                    ${(data.discountAmount || 0) > 0 ? `<tr class="discount-row"><td>Descuento principal</td><td>- ${fmtCurrency(data.discountAmount, data.currency)}</td></tr>` : ''}
                    ${(data.discountAmount2 || 0) > 0 ? `<tr class="discount-row"><td>Descuento secundario</td><td>- ${fmtCurrency(data.discountAmount2, data.currency)}</td></tr>` : ''}
                    <tr class="total-row"><td>TOTAL</td><td>${fmtCurrency(data.total, data.currency)}</td></tr>
                </table>
                ${data.periodicity && data.periodicity !== 'unico' ? `<div style="margin-top:8px; font-size:0.82rem; color:#166534; font-weight:700; text-align:right; background:#F0FDF4; padding:8px 12px; border-radius:6px;">Inversión ${data.periodicity}: ${fmtCurrency(data.total, data.currency)}</div>` : ''}
                <div style="background:#F0FDF4; border:1px solid #BBF7D0; border-radius:8px; padding:12px 16px; margin-top:10px;">
                    <div style="font-size:0.75rem; font-weight:700; color:#15803D; text-transform:uppercase; letter-spacing:1px; margin-bottom:4px;">Beneficio Estimado</div>
                    <div style="font-size:0.82rem; color:#166534;">Inversión${data.periodicity && data.periodicity !== 'unico' ? ' ' + data.periodicity : ''}: ${fmtCurrency(data.total, data.currency)}</div>
                    ${data.benefitObjective ? `<div style="font-size:0.82rem; color:#166534; margin-top:4px;">Objetivo: ${data.benefitObjective}</div>` : ''}
                </div>
            </div>

            ${conditions.length > 0 ? `
            <div class="section">
                <div class="section-header">Condiciones Comerciales</div>
                <ul class="cond-list">
                    ${conditions.map(c => `<li>${c}</li>`).join('')}
                </ul>
            </div>` : ''}

            <div class="cta-section">
                <div class="cta-title">Para iniciar el proyecto</div>
                <div class="step-row">
                    <div class="step-check ${ns.accepted ? 'done' : ''}">${ns.accepted ? '✓' : ''}</div>
                    <span>Confirmar aceptación de la propuesta</span>
                </div>
                <div class="step-row">
                    <div class="step-check ${ns.paid ? 'done' : ''}">${ns.paid ? '✓' : ''}</div>
                    <span>Realizar pago inicial</span>
                </div>
                <div class="step-row">
                    <div class="step-check ${ns.meetingScheduled ? 'done' : ''}">${ns.meetingScheduled ? '✓' : ''}</div>
                    <span>Agendar reunión de inicio</span>
                    <span class="step-detail">${meetingText}</span>
                </div>
            </div>

            <div class="firma">
                <div class="firma-name">Diego Gonzales</div>
                <div class="firma-role">CEO — Magic Design Efecto</div>
                <div class="firma-contact">WhatsApp: +591 63212806 · La Paz – Bolivia</div>
            </div>
        </div>

        <div class="report-footer">
            <div class="footer-text">
                Magic Design Efecto © ${new Date().getFullYear()} · magicdesignefecto.com · La Paz, Bolivia<br>
                Documento generado automáticamente — CRM Magic
            </div>
        </div>
    </div>

    <button class="btn-download" id="btnDownload">📥 Descargar Propuesta PDF</button>

    <script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"><\/script>
    <script>
        document.getElementById('btnDownload').addEventListener('click', function() {
            const btn = this;
            const el = document.querySelector('.page');
            btn.textContent = '⏳ Generando PDF...';
            btn.disabled = true;
            const pxToMm = 0.2646;
            const pdfWidth = el.scrollWidth * pxToMm;
            const pdfHeight = el.scrollHeight * pxToMm;
            html2pdf().set({
                margin: 0,
                filename: 'Propuesta_${(data.client || 'Cliente').replace(/[^a-zA-Z0-9 ]/g, '_').replace(/\s+/g, '_')}_${data.quoteNumber || ''}.pdf',
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { scale: 2, useCORS: true, backgroundColor: '#ffffff', scrollY: 0, width: 480, windowWidth: 480, x: 0 },
                jsPDF: { unit: 'mm', format: [pdfWidth, pdfHeight], orientation: 'portrait' }
            }).from(el).save().then(() => {
                btn.textContent = '✅ PDF descargado';
                setTimeout(() => { btn.textContent = '📥 Descargar Propuesta PDF'; btn.disabled = false; }, 2500);
            }).catch(() => {
                btn.textContent = '❌ Error, intenta de nuevo';
                setTimeout(() => { btn.textContent = '📥 Descargar Propuesta PDF'; btn.disabled = false; }, 2000);
            });
        });
    <\/script>
</body>
</html>`;

        const w = window.open('', '_blank');
        w.document.write(html);
        w.document.close();
    },

    generatePDFFromData: async (quote) => {
        QuotesModule._openQuotePDF(quote);
    },

    generatePDF: async () => {
        const form = document.getElementById('createQuoteForm');
        const selectedServices = Array.from(document.querySelectorAll('#servicesListContainer .service-chk:checked')).map(cb => cb.value);

        const invest = Number(document.getElementById('inputInvest').value) || 0;
        // Recoger costos adicionales dinámicos
        const extraCosts = [];
        document.querySelectorAll('#extraCostsContainer .dyn-row').forEach(row => {
            const amount = Number(row.querySelector('.extra-cost-amount')?.value) || 0;
            const desc = row.querySelector('.extra-cost-desc')?.value || '';
            if (amount > 0) extraCosts.push({ amount, desc });
        });
        const extraTotal = extraCosts.reduce((sum, ec) => sum + ec.amount, 0);
        const subtotalInvest = invest + extraTotal;
        const discVal = Number(document.getElementById('inputDiscount').value) || 0;
        const discType = document.getElementById('discountType').value;
        const discountAmount = discType === 'percent' ? subtotalInvest * (discVal / 100) : discVal;
        const discVal2 = Number(document.getElementById('inputDiscount2')?.value) || 0;
        const discType2 = document.getElementById('discountType2')?.value || 'amount';
        const discountAmount2 = discType2 === 'percent' ? subtotalInvest * (discVal2 / 100) : discVal2;
        const totalDiscount = discountAmount + discountAmount2;
        const total = Math.max(0, subtotalInvest - totalDiscount);

        // Cronograma dinámico
        const timeline = [];
        document.querySelectorAll('#timelineContainer .dyn-row').forEach(row => {
            const unit = row.querySelector('.timeline-unit').value;
            const num = row.querySelector('.timeline-num').value;
            const desc = row.querySelector('.timeline-desc').value;
            if (desc.trim()) timeline.push({ unit, num, desc });
        });

        // Objetivos dinámicos
        const objectives = [];
        document.querySelectorAll('#objectivesContainer .obj-input').forEach(input => {
            if (input.value.trim()) objectives.push(input.value.trim());
        });

        // Condiciones dinámicas
        const conditions = [];
        document.querySelectorAll('#conditionsContainer .cond-input').forEach(input => {
            if (input.value.trim()) conditions.push(input.value.trim());
        });

        QuotesModule._openQuotePDF({
            client: form.client.value || 'Cliente',
            clientCompany: document.getElementById('inputCompany').value,
            clientPosition: document.getElementById('inputPosition').value,
            clientContact: document.getElementById('inputContact').value,
            services: selectedServices,
            serviceScope: document.getElementById('inputScope').value,
            servicePeriod: document.getElementById('quoteServicePeriod')?.value || 'mensual',
            periodFrom: document.getElementById('periodFrom')?.value || '',
            periodTo: document.getElementById('periodTo')?.value || '',
            duration: document.getElementById('inputDuration').value,
            timeline,
            objectives,
            investment: invest,
            extraCosts,
            discount: discVal,
            discountType: discType,
            discountAmount,
            discount2: discVal2,
            discountType2: discType2,
            discountAmount2,
            totalDiscount,
            currency: document.getElementById('inputCurrency').value,
            periodicity: document.getElementById('inputPeriodicity').value,
            conditions,
            benefitObjective: document.getElementById('inputBenefitObj')?.value || '',
            total,
            nextSteps: {
                accepted: document.getElementById('stepAccept')?.checked || false,
                paid: document.getElementById('stepPayment')?.checked || false,
                meetingScheduled: document.getElementById('stepMeeting')?.checked || false,
                meetingStatus: document.getElementById('meetingStatus')?.value || 'pendiente',
                meetingDate: document.getElementById('meetingDate')?.value || ''
            },
            quoteNumber: '-',
            createdAt: null
        });
    },

    destroy: () => { }
};

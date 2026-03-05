import { Table } from '../components/Table.js';
import { Modal } from '../components/Modal.js';
import { ClientsService } from '../services/clients.service.js';

export const ClientsModule = {
    render: async () => {
        const formHTML = `
            <style>
                .form-section { background: #F9FAFB; padding: 15px; border-radius: 8px; border: 1px solid #E5E7EB; margin-bottom: 15px; }
                .input-group { display: flex; flex-direction: column; gap: 12px; }
                .form-input, .form-select { 
                    width: 100%; padding: 10px; 
                    border: 1px solid #D1D5DB; border-radius: 6px; 
                    box-sizing: border-box; 
                    font-size: 0.95rem;
                    background: var(--bg-card);
                }
                
                /* Estilos para el bloque internacional oculto */
                #internationalFields {
                    display: none; /* Oculto por defecto */
                    margin-top: 15px;
                    padding: 15px;
                    background: #EFF6FF;
                    border: 1px dashed #3B82F6;
                    border-radius: 8px;
                    animation: slideDown 0.3s ease;
                }
                @keyframes slideDown {
                    from { opacity: 0; transform: translateY(-10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            </style>

            <form id="clientForm">
                <input type="hidden" name="id" id="clientId">
                
                <div class="form-section">
                    <div class="input-group">
                        <input type="text" name="name" id="clientName" class="form-input" placeholder="Nombre del Cliente *" required>
                        <input type="text" name="company" id="clientCompany" class="form-input" placeholder="Empresa / Negocio">
                        
                        <input type="email" name="email" id="clientEmail" class="form-input" placeholder="Correo Electrónico">
                        <input type="tel" name="phone" id="clientPhone" class="form-input" placeholder="Teléfono / WhatsApp">
                        
                        <label style="font-size:0.8rem; color:#666; margin-bottom:-8px;">Ubicación General</label>
                        <select name="locationSelector" id="clientLocationSelector" class="form-select" required>
                            <option value="" disabled selected>-- Seleccionar Ubicación --</option>
                            <optgroup label="Bolivia">
                                <option value="La Paz">La Paz</option>
                                <option value="Santa Cruz">Santa Cruz</option>
                                <option value="Cochabamba">Cochabamba</option>
                                <option value="El Alto">El Alto</option>
                                <option value="Sucre">Sucre</option>
                                <option value="Oruro">Oruro</option>
                                <option value="Tarija">Tarija</option>
                                <option value="Potosí">Potosí</option>
                                <option value="Trinidad">Trinidad</option>
                                <option value="Cobija">Cobija</option>
                            </optgroup>
                            <optgroup label="Internacional">
                                <option value="Global">Global (Remoto)</option>
                                <option value="Otro País">Otro País</option>
                            </optgroup>
                        </select>

                        <div id="internationalFields">
                            <h5 style="margin:0 0 10px 0; color:#1E40AF; font-size:0.9rem;">🌍 Detalles Internacionales</h5>
                            <div class="input-group">
                                <div style="display:flex; gap:10px;">
                                    <input type="text" name="country" id="inputCountry" class="form-input" placeholder="País">
                                    <input type="text" name="city" id="inputCity" class="form-input" placeholder="Ciudad Específica">
                                </div>
                                <textarea name="note" id="inputNote" class="form-input" rows="2" placeholder="Nota adicional (Opcional)"></textarea>
                            </div>
                        </div>
                    </div>
                </div>

                <div style="margin-bottom: 15px; font-size: 0.85rem; color: #666; text-align: center;">
                    * El estado (Activo/Inactivo) se gestiona automáticamente.
                </div>

                <button type="submit" class="btn-3d" style="width: 100%; justify-content: center;">Guardar Cliente</button>
            </form>
        `;

        const modalHTML = Modal.render('Gestión de Cliente', formHTML, 'modalClient');

        const pageContent = `
            <div class="page-header" style="display: flex; flex-wrap: wrap; gap: 15px; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <div>
                    <h2 style="font-size: 1.5rem; font-weight: 700; color: var(--text-main); margin-bottom: 5px;">Cartera de Clientes</h2>
                    <p style="color: var(--text-muted); font-size: 0.9rem;">Directorio comercial activo</p>
                </div>
                <button class="btn-3d" id="btnNewClient">+ Nuevo Cliente</button>
            </div>
            
            <div id="clientsTableContainer" style="overflow-x: auto;">
                <div style="text-align:center; padding:40px; color:#9CA3AF;">Cargando clientes...</div>
            </div>
            
            ${modalHTML}
        `;

        return pageContent;
    },

    init: async () => {
        Modal.initEvents('modalClient');
        await ClientsModule.loadTable();

        // --- LÓGICA DE CAMPOS DINÁMICOS ---
        const locationSelect = document.getElementById('clientLocationSelector');
        const internationalBox = document.getElementById('internationalFields');

        const toggleInternationalFields = () => {
            const val = locationSelect.value;
            if (val === 'Global' || val === 'Otro País') {
                internationalBox.style.display = 'block';
                // Hacemos requeridos los campos manuales si es internacional
                document.getElementById('inputCountry').required = true;
                document.getElementById('inputCity').required = true;
            } else {
                internationalBox.style.display = 'none';
                document.getElementById('inputCountry').required = false;
                document.getElementById('inputCity').required = false;
            }
        };

        if (locationSelect) {
            locationSelect.addEventListener('change', toggleInternationalFields);
        }
        // ----------------------------------

        const btnNew = document.getElementById('btnNewClient');
        if (btnNew) {
            btnNew.addEventListener('click', () => {
                document.getElementById('clientForm').reset();
                document.getElementById('clientId').value = '';
                internationalBox.style.display = 'none'; // Resetear visibilidad
                Modal.open('modalClient');
            });
        }

        const form = document.getElementById('clientForm');
        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                const btn = form.querySelector('button[type="submit"]');
                btn.innerText = 'Guardando...'; btn.disabled = true;

                try {
                    const id = form.id.value;
                    const locationVal = locationSelect.value;

                    // Lógica para definir qué ciudad y país guardar
                    let finalCity = locationVal;
                    let finalCountry = 'Bolivia';
                    let note = '';

                    if (locationVal === 'Global' || locationVal === 'Otro País') {
                        finalCountry = form.country.value;
                        finalCity = form.city.value; // Ciudad manual
                        note = form.note.value;
                    }

                    const data = {
                        name: form.name.value,
                        company: form.company.value,
                        email: form.email.value,
                        phone: form.phone.value,
                        city: finalCity,
                        country: finalCountry,
                        note: note,
                        isInternational: (locationVal === 'Global' || locationVal === 'Otro País')
                    };

                    if (id) {
                        await ClientsService.update(id, data);
                    } else {
                        await ClientsService.create(data);
                    }

                    Modal.close('modalClient');
                    await ClientsModule.loadTable();
                } catch (error) {
                    alert('Error al guardar');
                } finally {
                    btn.innerText = 'Guardar Cliente'; btn.disabled = false;
                }
            });
        }
    },

    loadTable: async () => {
        const container = document.getElementById('clientsTableContainer');
        try {
            const clients = await ClientsService.getAll();

            if (clients.length === 0) {
                container.innerHTML = `<div style="text-align:center; padding:40px; color:#9CA3AF;">No hay clientes registrados.</div>`;
                return;
            }

            const columns = [
                { header: 'CLIENTE', key: 'name', render: (row) => `<div><strong>${row.name}</strong><div style="font-size:0.75rem; color:#666;">${row.company || '-'}</div></div>` },
                {
                    header: 'UBICACIÓN', key: 'city', render: (row) => {
                        const loc = row.isInternational ? `🌍 ${row.city}, ${row.country}` : `🇧🇴 ${row.city}`;
                        return `<span style="font-size:0.85rem;">${loc}</span>`;
                    }
                },
                { header: 'TELÉFONO', key: 'phone', render: (row) => row.phone || '-' },
                {
                    header: 'ESTADO', key: 'status', render: (row) => {
                        const isActive = row.status === 'Activo';
                        return `<span style="color:${isActive ? '#10B981' : '#9CA3AF'}; font-weight:600; font-size:0.85rem;">● ${row.status || 'Inactivo'}</span>`;
                    }
                },
                {
                    header: 'ACCIONES', key: 'id', render: (row) => `
                    <div class="actions-cell">
                        <button class="btn-action-icon edit btn-edit-client" data-id="${row.id}" title="Editar"><i class="fas fa-edit"></i></button>
                        <button class="btn-action-icon delete btn-delete-client" data-id="${row.id}" title="Eliminar"><i class="fas fa-trash"></i></button>
                    </div>`
                }
            ];
            container.innerHTML = Table.render(columns, clients);

            // Editar
            container.querySelectorAll('.btn-edit-client').forEach(btn => {
                btn.addEventListener('click', async () => {
                    const id = btn.getAttribute('data-id');
                    const client = await ClientsService.getById(id);
                    if (client) {
                        const form = document.getElementById('clientForm');
                        form.id.value = client.id;
                        form.name.value = client.name;
                        form.company.value = client.company;
                        form.email.value = client.email;
                        form.phone.value = client.phone;

                        const sel = document.getElementById('clientLocationSelector');
                        const box = document.getElementById('internationalFields');

                        if (client.isInternational) {
                            sel.value = 'Otro País';
                            box.style.display = 'block';
                            form.country.value = client.country;
                            form.city.value = client.city;
                            form.note.value = client.note || '';
                        } else {
                            sel.value = client.city;
                            box.style.display = 'none';
                        }

                        Modal.open('modalClient');
                    }
                });
            });

            // Eliminar
            container.querySelectorAll('.btn-delete-client').forEach(btn => {
                btn.addEventListener('click', async () => {
                    const id = btn.getAttribute('data-id');
                    const result = await Swal.fire({
                        title: '¿Eliminar cliente?',
                        text: "Esta acción no se puede deshacer",
                        icon: 'warning',
                        showCancelButton: true,
                        confirmButtonColor: '#EF4444',
                        cancelButtonColor: '#3B82F6',
                        confirmButtonText: 'Sí, eliminar',
                        cancelButtonText: 'Cancelar'
                    });

                    if (result.isConfirmed) {
                        try {
                            const success = await ClientsService.delete(id);
                            if (success) {
                                Swal.fire('Eliminado', 'El cliente ha sido eliminado.', 'success');
                                await ClientsModule.loadTable();
                            } else {
                                Swal.fire('Error', 'No se pudo eliminar el cliente.', 'error');
                            }
                        } catch (e) {
                            Swal.fire('Error', 'Ocurrió un error al eliminar.', 'error');
                        }
                    }
                });
            });

        } catch (e) { container.innerHTML = '<p>Error cargando clientes.</p>'; }
    },

    destroy: () => { }
};

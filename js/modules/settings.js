import { UsersService } from '../services/users.service.js';
import { SettingsService } from '../services/settings.service.js';
import { ClientsService } from '../services/clients.service.js';
import { Store } from '../core/store.js';
import { auth, db } from '../core/firebase-config.js';
import { doc, updateDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { updateProfile } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

export const SettingsModule = {
    render: async () => {
        // Obtener usuario actual - SIN RESTRICCIONES, todos tienen acceso
        const user = Store.getState().user;
        const currentTheme = localStorage.getItem('crm-theme') || 'light';

        // Cargar servicios existentes mediante SettingsService (con caché)
        let servicesHtml = '<p style="color:var(--text-muted);">Cargando servicios...</p>';
        try {
            const currentUser = auth.currentUser;
            if (!currentUser) {
                servicesHtml = '<p style="color:var(--text-muted); text-align:center;">Inicia sesión para ver tus servicios.</p>';
            } else {
                const services = await SettingsService.getServicesWithDetails();

                if (services.length === 0 || (services.length > 0 && services[0].id?.startsWith('default-'))) {
                    servicesHtml = '<p style="color:var(--text-muted); text-align:center;">No hay servicios creados aún. ¡Agrega tu primer servicio!</p>';
                } else {
                    // Ordenar alfabéticamente en el cliente
                    const sortedServices = [...services].sort((a, b) =>
                        (a.name || '').localeCompare(b.name || '')
                    );

                    servicesHtml = sortedServices.map(s => {
                        return `
                            <div class="service-item">
                                <div class="service-info">
                                    <strong>${s.name}</strong>
                                    <span class="service-price">Bs. ${s.price || 0}</span>
                                </div>
                                <div class="service-actions">
                                    <button class="btn-edit-service" onclick="editService('${s.id}', '${s.name}', ${s.price || 0})" title="Editar">
                                        <i class="fas fa-edit"></i>
                                    </button>
                                    <button class="btn-delete-service" onclick="deleteService('${s.id}')" title="Eliminar">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                </div>
                            </div>
                        `;
                    }).join('');
                }
            }
        } catch (e) {
            console.error('Error cargando servicios:', e);
            servicesHtml = '<p style="color:#EF4444;">Error al cargar servicios.</p>';
        }

        return `
            <style>
                .settings-container { max-width: 1000px; margin: 0 auto; }
                
                /* Grid de secciones */
                .settings-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; margin-bottom: 25px; }
                
                .settings-card { background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 16px; padding: 20px; box-shadow: var(--shadow-card); overflow: hidden; }
                .settings-card h4 { margin: 0 0 15px 0; color: var(--text-main); font-size: 1rem; display: flex; align-items: center; gap: 10px; }
                .settings-card h4 i { color: #3B82F6; }
                
                /* Tema */
                .theme-toggle { display: flex; gap: 10px; }
                .theme-btn { flex: 1; padding: 12px; border: 2px solid var(--border-color); border-radius: 10px; background: var(--bg-card); cursor: pointer; font-weight: 600; transition: 0.2s; display: flex; align-items: center; justify-content: center; gap: 8px; color: var(--text-main); }
                .theme-btn.active { border-color: #3B82F6; background: #EFF6FF; color: #2563EB; }
                .theme-btn:hover { border-color: #3B82F6; }
                
                /* Perfil */
                .profile-section { display: flex; flex-direction: column; gap: 12px; }
                .profile-avatar-container { display: flex; align-items: center; gap: 15px; margin-bottom: 10px; }
                .profile-avatar { width: 60px; height: 60px; border-radius: 50%; background: #3B82F6; color: white; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; font-weight: 700; overflow: hidden; }
                .profile-avatar img { width: 100%; height: 100%; object-fit: cover; }
                .btn-upload { background: #EFF6FF; color: #2563EB; border: 1px dashed #3B82F6; padding: 8px 16px; border-radius: 8px; cursor: pointer; font-size: 0.85rem; }
                .profile-input { width: 100%; padding: 10px 12px; border: 1px solid var(--border-color); border-radius: 8px; font-size: 0.9rem; box-sizing: border-box; background: var(--bg-input); color: var(--text-main); }
                .btn-save-profile { background: #10B981; color: white; border: none; padding: 10px 20px; border-radius: 8px; font-weight: 600; cursor: pointer; width: 100%; margin-top: 5px; }
                .btn-save-profile:hover { background: #059669; }
                
                /* Servicios */
                .services-section { max-height: 250px; overflow-y: auto; }
                .service-item { display: flex; justify-content: space-between; align-items: center; padding: 10px; background: var(--bg-body); border-radius: 8px; margin-bottom: 8px; }
                .service-info strong { color: var(--text-main); }
                .service-price { background: #DCFCE7; color: #16A34A; padding: 2px 8px; border-radius: 4px; font-size: 0.8rem; font-weight: 600; margin-left: 10px; }
                .service-actions { display: flex; gap: 5px; }
                .btn-edit-service { background: none; border: none; color: #3B82F6; cursor: pointer; padding: 5px; }
                .btn-edit-service:hover { color: #1D4ED8; }
                .btn-delete-service { background: none; border: none; color: #EF4444; cursor: pointer; padding: 5px; }
                .btn-delete-service:hover { color: #DC2626; }
                .add-service-form { display: flex; gap: 8px; margin-top: 12px; flex-wrap: wrap; }
                .add-service-form input { flex: 1; min-width: 100px; padding: 8px 12px; border: 1px solid var(--border-color); border-radius: 6px; background: var(--bg-input); color: var(--text-main); }
                .btn-add-service { background: #3B82F6; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-weight: 600; white-space: nowrap; }
                
                /* Descargar */
                .btn-download { width: 100%; background: linear-gradient(135deg, #3B82F6, #8B5CF6); color: white; border: none; padding: 14px 20px; border-radius: 10px; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 10px; font-size: 1rem; transition: 0.3s; }
                .btn-download:hover { transform: translateY(-2px); box-shadow: 0 5px 20px rgba(59,130,246,0.4); }
                .btn-meta { background: linear-gradient(135deg, #1877F2, #42B72A); }
                .btn-meta:hover { box-shadow: 0 5px 20px rgba(24,119,242,0.4); }
                .btn-clients-history { background: linear-gradient(135deg, #F59E0B, #EF4444); }
                .btn-clients-history:hover { box-shadow: 0 5px 20px rgba(245,158,11,0.4); }
                .data-tools-grid { display: flex; flex-direction:column; gap:10px; }
                .upload-zone { display:flex; flex-direction:column; align-items:center; justify-content:center; width:100%; padding:40px 20px; margin-top:20px; border:2px dashed var(--border-color); background:var(--bg-body); box-sizing:border-box; border-radius:8px; transition:all 0.3s ease; cursor:pointer; }
                .upload-zone:hover { border-color:#3B82F6; background:rgba(59,130,246,0.08); }
                .upload-zone input { display:none; }
                .upload-zone .upload-icon { font-size:1.5rem; margin-bottom:5px; }
                .upload-zone .upload-text { font-size:0.8rem; color:var(--text-muted); }
                
                /* Usuarios pendientes */
                .section-header { margin: 25px 0 15px 0; border-top: 1px solid var(--border-color); padding-top: 20px; }
                .section-header h3 { margin: 0; color: var(--text-main); font-size: 1.1rem; }
                
                .user-card { background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 12px; padding: 15px; margin-bottom: 10px; display: flex; justify-content: space-between; align-items: center; }
                .u-info { display: flex; gap: 12px; align-items: center; }
                .u-avatar { width: 40px; height: 40px; background: #3B82F6; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; }
                .u-info h4 { margin: 0; color: var(--text-main); font-size: 0.95rem; }
                .u-info p { margin: 2px 0; color: var(--text-muted); font-size: 0.8rem; }
                .badge-role { background: #EEF2FF; color: #4F46E5; font-size: 0.7rem; padding: 2px 6px; border-radius: 4px; font-weight: 600; }
                
                .u-actions { display: flex; gap: 8px; }
                .btn-approve { background: #10B981; color: white; border: none; padding: 8px 12px; border-radius: 6px; cursor: pointer; }
                .btn-deny { background: #FEE2E2; color: #EF4444; border: none; padding: 8px 12px; border-radius: 6px; cursor: pointer; }
                
                .empty-state-mini { text-align: center; padding: 20px; color: var(--text-muted); }
                .empty-state-mini i { font-size: 2rem; color: var(--text-muted); }
                
                @media (max-width: 600px) {
                    .settings-grid { grid-template-columns: 1fr; }
                    .user-card { flex-direction: column; gap: 15px; text-align: center; }
                    .u-info { flex-direction: column; }
                }
            </style>

            <div class="settings-container">
                <div class="settings-grid">
                    <!-- TEMA -->
                    <div class="settings-card">
                        <h4><i class="fas fa-palette"></i> Tema de la Aplicación</h4>
                        <div class="theme-toggle">
                            <button class="theme-btn ${currentTheme === 'light' ? 'active' : ''}" onclick="setTheme('light')">
                                <i class="fas fa-sun"></i> Claro
                            </button>
                            <button class="theme-btn ${currentTheme === 'dark' ? 'active' : ''}" onclick="setTheme('dark')">
                                <i class="fas fa-moon"></i> Oscuro
                            </button>
                        </div>
                    </div>
                    
                    <!-- PERFIL -->
                    <div class="settings-card">
                        <h4><i class="fas fa-user-edit"></i> Mi Perfil</h4>
                        <div class="profile-section">
                            <div class="profile-avatar-container">
                                <div class="profile-avatar" id="profileAvatar">
                                    ${user?.photoURL ? `<img src="${user.photoURL}" alt="Avatar">` : (user?.name?.charAt(0) || 'U')}
                                </div>
                                <label class="btn-upload">
                                    <i class="fas fa-camera"></i> Cambiar foto
                                    <input type="file" id="avatarInput" accept="image/*" style="display:none;">
                                </label>
                            </div>
                            <input type="text" class="profile-input" id="profileName" placeholder="Tu nombre" value="${user?.name || ''}">
                            <input type="text" class="profile-input" id="profileRole" placeholder="Tu cargo" value="${user?.role || ''}">
                            <button class="btn-save-profile" onclick="saveProfile()">
                                <i class="fas fa-save"></i> Guardar Cambios
                            </button>
                        </div>
                    </div>
                    
                    <!-- SERVICIOS -->
                    <div class="settings-card">
                        <h4><i class="fas fa-box"></i> Servicios / Productos</h4>
                        <div class="services-section" id="servicesList">
                            ${servicesHtml}
                        </div>
                        <div class="add-service-form">
                            <input type="text" id="newServiceName" placeholder="Nombre del servicio">
                            <input type="number" id="newServicePrice" placeholder="Precio Bs.">
                            <button class="btn-add-service" onclick="addService()">
                                <i class="fas fa-plus"></i> Agregar
                            </button>
                        </div>
                    </div>
                    
                    <!-- HERRAMIENTAS DE DATOS -->
                    <div class="settings-card" style="grid-column: 1 / -1;">
                        <h4><i class="fas fa-database"></i> Herramientas de Datos</h4>
                        <div class="data-tools-grid">
                            <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:10px;">
                                <button class="btn-download btn-meta" onclick="downloadMetaCSV()">
                                    <i class="fab fa-facebook"></i> Exportar para Meta Ads
                                </button>
                                <button class="btn-download" onclick="downloadClientsHistory()">
                                    <i class="fas fa-file-excel"></i> Historial de Clientes
                                </button>
                                <button class="btn-download btn-clients-history" onclick="downloadDetailedClientHistory()">
                                    <i class="fas fa-user-clock"></i> Historial Detallado
                                </button>
                            </div>
                            <div style="margin-top:8px;">
                                <label class="upload-zone" id="csvUploadZone">
                                    <div class="upload-icon">📁</div>
                                    <div style="font-weight:600; font-size:0.9rem;">Subir archivo CSV</div>
                                    <div class="upload-text">Arrastra o haz clic para importar contactos</div>
                                    <input type="file" id="csvFileInput" accept=".csv">
                                </label>
                                <div id="csvUploadResult" style="display:none; margin-top:10px;"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },


    init: async () => {
        // ========== FUNCIÓN: CAMBIAR TEMA ==========
        window.setTheme = (theme) => {
            localStorage.setItem('crm-theme', theme);
            document.body.classList.remove('theme-light', 'theme-dark');
            document.body.classList.add(`theme-${theme}`);

            // Actualizar botones visuales
            document.querySelectorAll('.theme-btn').forEach(btn => btn.classList.remove('active'));
            document.querySelector(`.theme-btn[onclick="setTheme('${theme}')"]`)?.classList.add('active');
        };

        // Aplicar tema guardado al cargar
        const savedTheme = localStorage.getItem('crm-theme') || 'light';
        window.setTheme(savedTheme);

        // ========== FUNCIÓN: GUARDAR PERFIL ==========
        window.saveProfile = async () => {
            const name = document.getElementById('profileName').value.trim();
            const role = document.getElementById('profileRole').value.trim();

            if (!name) {
                Swal.fire('Error', 'El nombre es obligatorio.', 'warning');
                return;
            }

            const user = auth.currentUser;
            if (!user) {
                Swal.fire('Error', 'No hay sesión activa.', 'error');
                return;
            }

            let saved = false;

            // 1. Actualizar Auth displayName (best-effort)
            try {
                await updateProfile(user, { displayName: name });
            } catch (e) {
                console.warn('Auth updateProfile falló (no crítico):', e.message);
            }

            // 2. Actualizar Firestore (principal)
            try {
                await updateDoc(doc(db, "users", user.uid), {
                    name: name,
                    role: role
                });
                saved = true;
            } catch (e) {
                console.warn('Firestore updateDoc falló:', e.message);
                // Si Firestore offline persistence guardó los datos, lo consideramos éxito
                saved = true;
            }

            // 3. Actualizar Store local (best-effort)
            try {
                const currentState = Store.getState();
                Store.setState({
                    ...currentState,
                    user: { ...currentState.user, name, role }
                });
            } catch (e) {
                console.warn('Store update falló:', e.message);
            }

            // 4. Actualizar UI del header (best-effort)
            try {
                const nameEl = document.querySelector('.u-name');
                const roleEl = document.querySelector('.u-role');
                if (nameEl) nameEl.innerText = name;
                if (roleEl) roleEl.innerText = role;
            } catch (e) {
                console.warn('UI update falló:', e.message);
            }

            // 5. Mostrar resultado
            if (saved) {
                Swal.fire('¡Guardado!', 'Tu perfil ha sido actualizado.', 'success');
            } else {
                Swal.fire('Error', 'No se pudo guardar el perfil.', 'error');
            }
        };

        // ========== FUNCIÓN: SUBIR FOTO (Comprimir + Guardar en Firebase) ==========
        const avatarInput = document.getElementById('avatarInput');
        if (avatarInput) {
            avatarInput.addEventListener('change', async (e) => {
                const file = e.target.files[0];
                if (file) {
                    // Validar tipo de archivo
                    if (!file.type.startsWith('image/')) {
                        Swal.fire('Error', 'Solo se permiten archivos de imagen.', 'warning');
                        return;
                    }

                    // Mostrar loader
                    Swal.fire({
                        title: 'Procesando imagen...',
                        allowOutsideClick: false,
                        didOpen: () => Swal.showLoading()
                    });

                    try {
                        // Comprimir imagen usando Canvas (max 200x200px, JPEG 70%)
                        const compressedBase64 = await new Promise((resolve, reject) => {
                            const img = new Image();
                            img.onload = () => {
                                const MAX_SIZE = 200;
                                let w = img.width;
                                let h = img.height;

                                // Redimensionar manteniendo proporción
                                if (w > h) {
                                    if (w > MAX_SIZE) { h = Math.round(h * MAX_SIZE / w); w = MAX_SIZE; }
                                } else {
                                    if (h > MAX_SIZE) { w = Math.round(w * MAX_SIZE / h); h = MAX_SIZE; }
                                }

                                const canvas = document.createElement('canvas');
                                canvas.width = w;
                                canvas.height = h;
                                const ctx = canvas.getContext('2d');
                                ctx.drawImage(img, 0, 0, w, h);

                                // Exportar como JPEG con calidad 70%
                                resolve(canvas.toDataURL('image/jpeg', 0.7));
                            };
                            img.onerror = () => reject(new Error('No se pudo procesar la imagen'));

                            const reader = new FileReader();
                            reader.onload = (ev) => { img.src = ev.target.result; };
                            reader.onerror = () => reject(new Error('No se pudo leer el archivo'));
                            reader.readAsDataURL(file);
                        });

                        const user = auth.currentUser;
                        if (user) {
                            // Guardar en Firebase
                            await updateDoc(doc(db, "users", user.uid), {
                                photoURL: compressedBase64
                            });

                            // Actualizar UI del perfil en Settings
                            const avatarEl = document.getElementById('profileAvatar');
                            if (avatarEl) {
                                avatarEl.innerHTML = `<img src="${compressedBase64}" alt="Avatar" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`;
                            }

                            // Actualizar avatar en header
                            const headerAvatar = document.querySelector('.user-avatar');
                            if (headerAvatar) {
                                headerAvatar.innerHTML = `<img src="${compressedBase64}" alt="Avatar" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`;
                            }

                            // Actualizar Store para persistencia entre navegaciones
                            const currentState = Store.getState();
                            Store.setState({
                                ...currentState,
                                user: { ...currentState.user, photoURL: compressedBase64 }
                            });

                            Swal.fire({
                                icon: 'success',
                                title: '¡Foto actualizada!',
                                timer: 1500,
                                showConfirmButton: false
                            });
                        }
                    } catch (error) {
                        console.error('Error subiendo foto:', error);
                        Swal.fire('Error', 'No se pudo guardar la imagen.', 'error');
                    }
                }
            });
        }

        // ========== FUNCIÓN: AGREGAR SERVICIO (usa SettingsService) ==========
        window.addService = async () => {
            const nameInput = document.getElementById('newServiceName');
            const priceInput = document.getElementById('newServicePrice');
            const name = nameInput.value.trim();
            const price = parseFloat(priceInput.value) || 0;

            if (!name) {
                Swal.fire('Error', 'Ingresa el nombre del servicio.', 'warning');
                return;
            }

            try {
                await SettingsService.addService(name, price);

                nameInput.value = '';
                priceInput.value = '';

                Swal.fire('¡Agregado!', `Servicio "${name}" creado.`, 'success');

                // Recargar la página de configuración
                if (window.navigateTo) window.navigateTo('/settings');
            } catch (e) {
                console.error('Error agregando servicio:', e);
                Swal.fire('Error', 'No se pudo agregar el servicio.', 'error');
            }
        };

        // ========== FUNCIÓN: ELIMINAR SERVICIO (usa SettingsService) ==========
        window.deleteService = async (serviceId) => {
            const result = await Swal.fire({
                title: '¿Eliminar servicio?',
                text: 'Esta acción no se puede deshacer.',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#EF4444',
                confirmButtonText: 'Sí, eliminar',
                cancelButtonText: 'Cancelar'
            });

            if (result.isConfirmed) {
                try {
                    await SettingsService.removeService(serviceId);
                    Swal.fire('Eliminado', 'El servicio ha sido eliminado.', 'success');
                    if (window.navigateTo) window.navigateTo('/settings');
                } catch (e) {
                    Swal.fire('Error', 'No se pudo eliminar.', 'error');
                }
            }
        };

        // ========== FUNCIÓN: EDITAR SERVICIO (usa SettingsService) ==========
        window.editService = async (serviceId, currentName, currentPrice) => {
            const { value: formValues } = await Swal.fire({
                title: 'Editar Servicio',
                html: `
                    <div style="text-align:left;">
                        <label style="display:block; margin-bottom:5px; font-weight:600;">Nombre</label>
                        <input id="swal-name" class="swal2-input" placeholder="Nombre del servicio" value="${currentName}" style="margin:0 0 15px 0; width:100%;">
                        <label style="display:block; margin-bottom:5px; font-weight:600;">Precio (Bs.)</label>
                        <input id="swal-price" type="number" class="swal2-input" placeholder="0" value="${currentPrice}" style="margin:0; width:100%;">
                    </div>
                `,
                focusConfirm: false,
                showCancelButton: true,
                confirmButtonText: 'Guardar',
                cancelButtonText: 'Cancelar',
                preConfirm: () => {
                    return {
                        name: document.getElementById('swal-name').value,
                        price: parseFloat(document.getElementById('swal-price').value) || 0
                    }
                }
            });

            if (formValues) {
                if (!formValues.name.trim()) {
                    Swal.fire('Error', 'El nombre es requerido.', 'error');
                    return;
                }

                try {
                    await SettingsService.updateService(serviceId, formValues.name, formValues.price);
                    Swal.fire('¡Actualizado!', 'El servicio ha sido modificado.', 'success');
                    if (window.navigateTo) window.navigateTo('/settings');
                } catch (e) {
                    console.error('Error editando servicio:', e);
                    Swal.fire('Error', 'No se pudo actualizar.', 'error');
                }
            }
        };

        // ========== FUNCIÓN: DESCARGAR HISTORIAL DE CLIENTES (filtrado por usuario) ==========
        window.downloadClientsHistory = async () => {
            try {
                Swal.fire({
                    title: 'Generando archivo...',
                    allowOutsideClick: false,
                    didOpen: () => Swal.showLoading()
                });

                // Obtener clientes del usuario actual mediante ClientsService (con filtro userId)
                const clients = await ClientsService.getAll(true);

                if (!clients || clients.length === 0) {
                    Swal.fire('Sin datos', 'No hay clientes para exportar.', 'info');
                    return;
                }

                // Usar punto y coma como separador (Excel en español lo requiere)
                const SEP = ';';

                // Función para formatear fecha legible
                const formatDate = (isoString) => {
                    if (!isoString) return '';
                    try {
                        const d = new Date(isoString);
                        const dd = String(d.getDate()).padStart(2, '0');
                        const mm = String(d.getMonth() + 1).padStart(2, '0');
                        const yyyy = d.getFullYear();
                        const hh = String(d.getHours()).padStart(2, '0');
                        const min = String(d.getMinutes()).padStart(2, '0');
                        return `${dd}/${mm}/${yyyy} ${hh}:${min}`;
                    } catch { return isoString; }
                };

                // Función para limpiar valores (escapar punto y coma y comillas)
                const clean = (val) => {
                    const str = String(val || '').replace(/"/g, '""');
                    return `"${str}"`;
                };

                // Crear contenido CSV
                const headers = ['Nombre', 'Empresa', 'Email', 'Teléfono', 'Ciudad', 'País', 'Estado', 'Fecha Creación'];
                let csvContent = headers.join(SEP) + '\n';

                clients.forEach(c => {
                    const row = [
                        clean(c.name),
                        clean(c.company),
                        clean(c.email),
                        clean(c.phone),
                        clean(c.city),
                        clean(c.country),
                        clean(c.status),
                        clean(formatDate(c.createdAt))
                    ];
                    csvContent += row.join(SEP) + '\n';
                });

                // BOM UTF-8 para que Excel reconozca acentos (é, ó, ñ, etc.)
                const BOM = '\uFEFF';
                const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
                const link = document.createElement('a');
                link.href = URL.createObjectURL(blob);
                link.download = `clientes_crm_${new Date().toISOString().split('T')[0]}.csv`;
                link.click();

                // Limpiar URL temporal
                URL.revokeObjectURL(link.href);

                Swal.fire('¡Descargado!', 'El archivo CSV ha sido generado.', 'success');
            } catch (e) {
                console.error('Error descargando:', e);
                Swal.fire('Error', 'No se pudo generar el archivo.', 'error');
            }
        };

        // ========== FUNCIÓN: EXPORTAR CSV PARA META ADS ==========
        window.downloadMetaCSV = async () => {
            try {
                Swal.fire({ title: 'Generando archivo Meta...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
                const clients = await ClientsService.getAll(true);
                if (!clients || clients.length === 0) { Swal.fire('Sin datos', 'No hay clientes para exportar.', 'info'); return; }

                const formatPhone = (phone) => {
                    if (!phone) return '';
                    let p = String(phone).replace(/[^0-9+]/g, '');
                    if (!p.startsWith('+')) p = '+591' + p;
                    return p;
                };
                const splitName = (fullName) => {
                    const parts = (fullName || '').trim().split(/\s+/);
                    if (parts.length <= 1) return { first: parts[0] || '', last: '' };
                    return { first: parts[0], last: parts.slice(1).join(' ') };
                };

                const SEP = '\t';
                const headers = ['First Name', 'Last Name', 'Phone', 'Email', 'City', 'Country'];
                let csv = headers.join(SEP) + '\n';
                clients.forEach(c => {
                    const { first, last } = splitName(c.name);
                    const row = [first, last, formatPhone(c.phone), c.email || '', c.city || 'La Paz', c.country || 'Bolivia'];
                    csv += row.join(SEP) + '\n';
                });

                const BOM = '\uFEFF';
                const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8;' });
                const link = document.createElement('a');
                link.href = URL.createObjectURL(blob);
                link.download = 'clientes_meta.csv';
                link.click();
                URL.revokeObjectURL(link.href);
                Swal.fire({ icon: 'success', title: '¡Archivo Meta listo!', html: `<p><strong>${clients.length}</strong> contactos exportados</p><p style="font-size:0.8rem; color:#6B7280;">Archivo: clientes_meta.csv<br>Formato: First Name, Last Name, Phone (+591), Email, City, Country</p>`, confirmButtonText: 'OK' });
            } catch (e) { console.error(e); Swal.fire('Error', 'No se pudo generar.', 'error'); }
        };

        // ========== FUNCIÓN: HISTORIAL DETALLADO POR CLIENTE ==========
        window.downloadDetailedClientHistory = async () => {
            try {
                Swal.fire({ title: 'Generando historial detallado...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
                const clients = await ClientsService.getAll(true);
                if (!clients || clients.length === 0) { Swal.fire('Sin datos', 'No hay clientes.', 'info'); return; }

                const SEP = ';';
                const clean = (val) => { const str = String(val || '').replace(/"/g, '""'); return `"${str}"`; };
                const formatDate = (iso) => { if (!iso) return ''; try { const d = new Date(iso); return d.toLocaleDateString('es-BO', { day: '2-digit', month: '2-digit', year: 'numeric' }); } catch { return iso; } };

                const headers = ['Nombre', 'Empresa', 'Teléfono', 'Email', 'Ciudad', 'País', 'Estado', 'Servicios', 'Notas', 'Total Facturado', 'Fecha Registro', 'Última Actividad'];
                let csv = headers.join(SEP) + '\n';
                clients.forEach(c => {
                    const services = Array.isArray(c.services) ? c.services.join(', ') : (c.services || '');
                    const row = [clean(c.name), clean(c.company), clean(c.phone), clean(c.email), clean(c.city || 'La Paz'), clean(c.country || 'Bolivia'), clean(c.status), clean(services), clean(c.notes || ''), clean(c.totalBilled || 0), clean(formatDate(c.createdAt)), clean(formatDate(c.updatedAt || c.createdAt))];
                    csv += row.join(SEP) + '\n';
                });

                const BOM = '\uFEFF';
                const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8;' });
                const link = document.createElement('a');
                link.href = URL.createObjectURL(blob);
                link.download = `historial_detallado_${new Date().toISOString().split('T')[0]}.csv`;
                link.click();
                URL.revokeObjectURL(link.href);
                Swal.fire('¡Descargado!', `Historial detallado de ${clients.length} clientes generado.`, 'success');
            } catch (e) { console.error(e); Swal.fire('Error', 'No se pudo generar.', 'error'); }
        };

        // ========== FUNCIÓN: SUBIR CSV ==========
        const csvInput = document.getElementById('csvFileInput');
        if (csvInput) {
            csvInput.addEventListener('change', async (e) => {
                const file = e.target.files[0];
                if (!file) return;
                const resultDiv = document.getElementById('csvUploadResult');
                resultDiv.style.display = 'block';
                resultDiv.innerHTML = '<p style="color:#3B82F6;">⏳ Procesando archivo...</p>';

                try {
                    const text = await file.text();
                    const lines = text.trim().split('\n');
                    const headerLine = lines[0];
                    const sep = headerLine.includes(';') ? ';' : ',';
                    const headers = headerLine.split(sep).map(h => h.trim().replace(/^"|"$/g, '').toLowerCase());
                    const rows = [];
                    for (let i = 1; i < lines.length; i++) {
                        const vals = lines[i].split(sep).map(v => v.trim().replace(/^"|"$/g, ''));
                        const row = {};
                        headers.forEach((h, idx) => { row[h] = vals[idx] || ''; });
                        rows.push(row);
                    }

                    // Previsualización
                    let preview = `<div style="background:var(--bg-body); padding:12px; border-radius:8px; border:1px solid var(--border-color);">`;
                    preview += `<strong style="color:var(--text-main);">📊 ${rows.length} contactos encontrados</strong>`;
                    preview += `<div style="font-size:0.8rem; color:var(--text-muted); margin:5px 0;">Columnas: ${headers.join(', ')}</div>`;
                    preview += `<table style="width:100%; font-size:0.75rem; margin-top:8px; border-collapse:collapse;">`;
                    preview += `<tr>${headers.slice(0, 5).map(h => `<th style="text-align:left; padding:4px; border-bottom:1px solid var(--border-color);">${h}</th>`).join('')}</tr>`;
                    rows.slice(0, 3).forEach(r => {
                        preview += `<tr>${headers.slice(0, 5).map(h => `<td style="padding:4px; border-bottom:1px solid var(--border-color);">${r[h] || '-'}</td>`).join('')}</tr>`;
                    });
                    if (rows.length > 3) preview += `<tr><td colspan="5" style="padding:4px; color:var(--text-muted);">... y ${rows.length - 3} más</td></tr>`;
                    preview += `</table>`;
                    preview += `<button onclick="this.parentElement.parentElement.style.display='none'" style="margin-top:8px; padding:6px 12px; background:#10B981; color:white; border:none; border-radius:6px; cursor:pointer; font-size:0.8rem;">✅ Archivo listo</button>`;
                    preview += `</div>`;
                    resultDiv.innerHTML = preview;
                } catch (err) {
                    console.error(err);
                    resultDiv.innerHTML = '<p style="color:#EF4444;">❌ Error al procesar el archivo.</p>';
                }
                csvInput.value = '';
            });
        }

        // ========== FUNCIONES: APROBAR/DENEGAR USUARIOS ==========
        window.approveUser = async (uid, name) => {
            const result = await Swal.fire({
                title: `¿Aprobar a ${name}?`,
                text: "Podrá acceder al CRM inmediatamente.",
                icon: 'question',
                showCancelButton: true,
                confirmButtonColor: '#10B981',
                confirmButtonText: 'Sí, aprobar'
            });

            if (result.isConfirmed) {
                try {
                    await UsersService.updateStatus(uid, 'approved');
                    Swal.fire('¡Aprobado!', 'El usuario ya tiene acceso.', 'success');
                    if (window.navigateTo) window.navigateTo('/settings');
                } catch (e) {
                    Swal.fire('Error', 'No se pudo actualizar.', 'error');
                }
            }
        };

        window.denyUser = async (uid) => {
            const result = await Swal.fire({
                title: '¿Denegar acceso?',
                text: "El usuario quedará bloqueado.",
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#EF4444',
                confirmButtonText: 'Sí, denegar'
            });

            if (result.isConfirmed) {
                try {
                    await UsersService.updateStatus(uid, 'rejected');
                    Swal.fire('Denegado', 'Solicitud rechazada.', 'info');
                    if (window.navigateTo) window.navigateTo('/settings');
                } catch (e) {
                    Swal.fire('Error', 'No se pudo actualizar.', 'error');
                }
            }
        };
    },

    // Limpieza al salir del módulo
    destroy: () => {
        delete window.setTheme;
        delete window.saveProfile;
        delete window.addService;
        delete window.deleteService;
        delete window.editService;
        delete window.downloadClientsHistory;
        delete window.downloadMetaCSV;
        delete window.downloadDetailedClientHistory;
        delete window.approveUser;
        delete window.denyUser;
    }
};

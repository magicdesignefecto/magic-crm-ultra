import { Store } from '../core/store.js';
import { auth, db } from '../core/firebase-config.js';
import { PullToRefresh } from '../utils/pull-to-refresh.js';
import { CacheManager } from '../utils/cache-manager.js';

// Cache para datos del usuario (evita múltiples consultas a Firestore)
let cachedUserData = null;
let sidebarClickListenerAdded = false;

export const Layout = {
    render: (content, title = 'CRM') => {
        // 1. Intentamos obtener el usuario de Firebase directamente
        const fbUser = auth.currentUser;
        const storeUser = Store.getState().user;

        // Prioridad: Firebase > Store > Default
        const displayName = fbUser?.displayName || storeUser?.name || 'Usuario';

        // Usamos el rol cacheado o el default
        const role = cachedUserData?.role || storeUser?.role || 'Usuario';
        const email = fbUser?.email || '';

        // Photo URL: Store > cached user data > Firebase Auth
        const photoURL = storeUser?.photoURL || cachedUserData?.photoURL || fbUser?.photoURL || null;

        // Iniciales (fallback si no hay foto)
        const initials = displayName.substring(0, 2).toUpperCase();

        // Avatar HTML: foto si existe, sino iniciales
        const avatarHTML = photoURL
            ? `<img src="${photoURL}" alt="Avatar" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`
            : initials;

        // Detectar ruta activa (usando pathname)
        const currentPath = window.location.pathname;

        return `
        <div class="app-layout">
            <aside class="sidebar" id="sidebar">
                <div class="logo-area">
                    <div class="logo-circle">
                        <img src="logo-dark.png" alt="Logo" style="width:45px; height:45px; object-fit:contain;">
                    </div>
                    <span class="logo-text">Magic CRM</span>
                </div>
                
                <nav class="nav-links">
                    <a href="javascript:void(0)" data-route="/dashboard" class="nav-item ${currentPath.includes('dashboard') ? 'active' : ''}">
                        <span>Dashboard</span>
                    </a>
                    <a href="javascript:void(0)" data-route="/leads" class="nav-item ${currentPath.includes('leads') ? 'active' : ''}">
                        <span>Leads</span>
                    </a>
                    <a href="javascript:void(0)" data-route="/clients" class="nav-item ${currentPath.includes('clients') ? 'active' : ''}">
                        <span>Clientes</span>
                    </a>
                    <a href="javascript:void(0)" data-route="/pipeline" class="nav-item ${currentPath.includes('pipeline') ? 'active' : ''}">
                        <span>Pipeline</span>
                    </a>
                    <a href="javascript:void(0)" data-route="/quotes" class="nav-item ${currentPath.includes('quotes') ? 'active' : ''}">
                        <span>Cotizaciones</span>
                    </a>
                    <a href="javascript:void(0)" data-route="/projects" class="nav-item ${currentPath.includes('projects') ? 'active' : ''}">
                        <span>Proyectos</span>
                    </a>
                    <a href="javascript:void(0)" data-route="/calendar" class="nav-item ${currentPath.includes('calendar') ? 'active' : ''}">
                        <span>Calendario</span>
                    </a>
                    <a href="javascript:void(0)" data-route="/reports" class="nav-item ${currentPath.includes('reports') ? 'active' : ''}">
                        <span>Reportes</span>
                    </a>
                    <a href="javascript:void(0)" data-route="/goals" class="nav-item ${currentPath.includes('goals') ? 'active' : ''}">
                        <span>Metas</span>
                    </a>
                    <a href="javascript:void(0)" data-route="/settings" class="nav-item ${currentPath.includes('settings') ? 'active' : ''}">
                        <span>Configuración</span>
                    </a>
                </nav>
            </aside>

            <div class="main-wrapper">
                <header class="top-bar">
                    <div class="header-left">
                        <button id="menuToggle" class="menu-toggle">☰</button>
                        <h2 class="page-title">${title}</h2>
                    </div>
                    
                    <div class="header-right" style="display:flex; align-items:center; gap:15px;">
                        <div class="user-capsule">
                            <div class="user-meta">
                                <span class="u-name">${displayName}</span>
                                <span class="u-divider">|</span>
                                <span class="u-role">${role}</span>
                            </div>
                            <div class="user-avatar">
                                ${avatarHTML}
                            </div>
                        </div>

                        <button id="btnLogout" class="btn-logout" title="Cerrar Sesión">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                        </button>
                    </div>
                </header>

                <main class="content-scroll-area">
                    <div class="content-container">
                        ${content}
                    </div>
                </main>
            </div>
        </div>

        `;
    },

    init: async () => {
        const menuToggle = document.getElementById('menuToggle');
        const sidebar = document.getElementById('sidebar');

        // --- CARGAR DATOS DEL USUARIO DESDE FIRESTORE ---
        const fbUser = auth.currentUser;
        if (fbUser && !cachedUserData) {
            try {
                const { doc, getDoc } = await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js");
                const userDoc = await getDoc(doc(db, "users", fbUser.uid));
                if (userDoc.exists()) {
                    cachedUserData = userDoc.data();
                    // Actualizar el UI con los datos reales
                    const nameEl = document.querySelector('.u-name');
                    const roleEl = document.querySelector('.u-role');
                    const avatarEl = document.querySelector('.user-avatar');
                    if (nameEl) nameEl.innerText = cachedUserData.name || fbUser.displayName || 'Usuario';
                    if (roleEl) roleEl.innerText = cachedUserData.role || 'Usuario';
                    if (avatarEl) {
                        if (cachedUserData.photoURL) {
                            avatarEl.innerHTML = `<img src="${cachedUserData.photoURL}" alt="Avatar" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`;
                        } else if (cachedUserData.name) {
                            avatarEl.innerText = cachedUserData.name.substring(0, 2).toUpperCase();
                        }
                    }
                }
            } catch (error) {
                console.warn("No se pudieron cargar datos del usuario:", error);
            }
        }

        // Cierre de menú móvil al hacer clic fuera
        if (!sidebarClickListenerAdded) {
            document.addEventListener('click', (e) => {
                const sb = document.getElementById('sidebar');
                const mt = document.getElementById('menuToggle');
                if (sb && mt && window.innerWidth <= 768 && sb.classList.contains('active')) {
                    if (!sb.contains(e.target) && !mt.contains(e.target)) sb.classList.remove('active');
                }
            });
            sidebarClickListenerAdded = true;
        }

        if (menuToggle) menuToggle.addEventListener('click', (e) => { e.stopPropagation(); sidebar.classList.toggle('active'); });

        // Click handlers para navegación con URLs limpias
        document.querySelectorAll('[data-route]').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const route = link.getAttribute('data-route');
                if (window.navigateTo) {
                    window.navigateTo(route);
                }
                // Cerrar sidebar en móvil
                if (sidebar && window.innerWidth <= 768) {
                    sidebar.classList.remove('active');
                }
            });
        });

        // LOGOUT - Diálogo moderno con SweetAlert2
        const btnLogout = document.getElementById('btnLogout');
        if (btnLogout) {
            btnLogout.addEventListener('click', async () => {
                const result = await Swal.fire({
                    title: '¿Cerrar sesión?',
                    text: 'Tu sesión actual se cerrará de forma segura.',
                    icon: 'question',
                    showCancelButton: true,
                    confirmButtonColor: '#EF4444',
                    cancelButtonColor: '#64748B',
                    confirmButtonText: '<i class="fas fa-sign-out-alt"></i> Sí, salir',
                    cancelButtonText: 'Cancelar',
                    reverseButtons: true,
                    customClass: {
                        popup: 'swal-logout-popup',
                        title: 'swal-logout-title'
                    }
                });

                if (result.isConfirmed) {
                    try {
                        // Mostrar loader mientras cierra
                        Swal.fire({
                            title: 'Cerrando sesión...',
                            allowOutsideClick: false,
                            didOpen: () => Swal.showLoading()
                        });

                        const { AuthService } = await import('../services/auth.service.js');
                        await AuthService.logout();
                        cachedUserData = null; // Limpiar cache

                        Swal.close();
                        if (window.navigateTo) window.navigateTo('/login');
                    } catch (error) {
                        console.error("Error logout:", error);
                        Swal.close();
                        if (window.navigateTo) window.navigateTo('/login');
                    }
                }
            });
        }

        // Inicializar Pull-to-Refresh para móviles
        PullToRefresh.init(async () => {
            // Limpiar todo el caché
            CacheManager.clearAll();

            // Recargar la página actual
            window.location.reload();
        });
    },

    // Función para limpiar el cache (útil cuando cambia el usuario)
    clearCache: () => {
        cachedUserData = null;
    }
};

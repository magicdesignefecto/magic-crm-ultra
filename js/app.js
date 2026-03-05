import { AuthService } from './services/auth.service.js';
import { Layout } from './components/Layout.js';
import { db } from './core/firebase-config.js';
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Login se importa directo (siempre se necesita al inicio)
import { LoginModule } from './modules/login.js';

// Los demás módulos se cargan BAJO DEMANDA (lazy loading)
const lazyModule = (importFn) => {
    let cached = null;
    return async () => {
        if (!cached) {
            const mod = await importFn();
            // Cada módulo exporta su Module como primer export
            cached = Object.values(mod)[0];
        }
        return cached;
    };
};

const dashboardLoader = lazyModule(() => import('./modules/dashboard.js'));

const routes = {
    '/': dashboardLoader,
    '/dashboard': dashboardLoader,
    '/leads': lazyModule(() => import('./modules/leads.js')),
    '/clients': lazyModule(() => import('./modules/clients.js')),
    '/pipeline': lazyModule(() => import('./modules/pipeline.js')),
    '/quotes': lazyModule(() => import('./modules/quotes.js')),
    '/projects': lazyModule(() => import('./modules/projects.js')),
    '/calendar': lazyModule(() => import('./modules/calendar.js')),
    '/reports': lazyModule(() => import('./modules/reports.js')),
    '/goals': lazyModule(() => import('./modules/goals.js')),
    '/settings': lazyModule(() => import('./modules/settings.js'))
};

let currentModule = null;
let isRouting = false;

// ========== DETECCIÓN AUTOMÁTICA DE BASE PATH ==========
// Prioridad: __SPA_BASE (guardado por index.html) > <base> tag > detección por pathname
const detectBasePath = () => {
    // 1. Fuente más confiable: guardado por el script de index.html ANTES de cualquier cambio
    if (window.__SPA_BASE) return window.__SPA_BASE;

    // 2. Si hay un <base> tag, usar ese
    const baseEl = document.querySelector('base');
    if (baseEl) return baseEl.getAttribute('href');

    // 3. Fallback: extraer del pathname actual
    const path = window.location.pathname;
    // Remover index.html
    const cleanPath = path.replace(/index\.html$/, '');
    // Buscar el primer segmento (nombre del repo/carpeta)
    const match = cleanPath.match(/^(\/[^/]+\/)/);
    return match ? match[1] : '/';
};

const BASE_PATH = detectBasePath();

// ========== FUNCIÓN DE NAVEGACIÓN GLOBAL ==========
export function navigateTo(path) {
    const fullPath = BASE_PATH.replace(/\/$/, '') + path;
    window.history.pushState(null, '', fullPath);
    router();
}

// Hacer disponible globalmente para módulos que no usen import
window.navigateTo = navigateTo;

// ========== OBTENER RUTA ACTUAL ==========
function getCurrentRoute() {
    let path = window.location.pathname;

    // Remover el base path
    const base = BASE_PATH.replace(/\/$/, '');
    if (base && path.startsWith(base)) {
        path = path.substring(base.length);
    }

    // Remover index.html si está presente
    if (path.endsWith('/index.html')) {
        path = path.replace('/index.html', '/');
    }

    // Asegurar que empieza con /
    if (!path.startsWith('/')) path = '/' + path;

    // Normalizar trailing slash
    if (path !== '/' && path.endsWith('/')) path = path.slice(0, -1);

    return path || '/';
}

// ========== ROUTER PRINCIPAL ==========
const router = async () => {
    // Guardia contra ejecuciones simultáneas
    if (isRouting) return;
    isRouting = true;

    const contentDiv = document.getElementById('app');
    let path = getCurrentRoute();

    console.log("📍 Navegando a:", path);

    // Limpiar módulo anterior
    if (currentModule && currentModule.destroy) {
        currentModule.destroy();
    }

    if (path === '/login' || path === '/register') {
        currentModule = LoginModule;
        contentDiv.innerHTML = await LoginModule.render();
        if (LoginModule.init) await LoginModule.init();
        isRouting = false;
        return;
    }

    // Resolver módulo lazy (routes[path] es una función async)
    const moduleLoader = routes[path] || routes['/'];

    try {
        const module = await moduleLoader();
        const moduleContent = await module.render();
        const pageTitle = path.replace('/', '').toUpperCase() || 'DASHBOARD';
        contentDiv.innerHTML = Layout.render(moduleContent, pageTitle);
        if (Layout.init) await Layout.init();
        if (module.init) await module.init();
        currentModule = module;
    } catch (error) {
        console.error("❌ Error cargando módulo:", error);
        contentDiv.innerHTML = `<div style="padding:20px; text-align:center;"><h2>Error cargando la página</h2><p>${error.message}</p></div>`;
        currentModule = null;
    }

    isRouting = false;
};

document.addEventListener('DOMContentLoaded', () => {
    console.log("🚀 Iniciando Magic CRM...");
    console.log("📂 Base Path:", BASE_PATH);

    // ========== APLICAR TEMA GUARDADO AL INICIO ==========
    const savedTheme = localStorage.getItem('crm-theme') || 'light';
    document.body.classList.remove('theme-light', 'theme-dark');
    document.body.classList.add(`theme-${savedTheme}`);
    console.log("🎨 Tema aplicado:", savedTheme);

    AuthService.onAuthStateChanged(async (user) => {
        if (user) {
            console.log("✅ Usuario detectado:", user.email);

            try {
                const userDoc = await getDoc(doc(db, "users", user.uid));

                if (userDoc.exists()) {
                    const userData = userDoc.data();

                    if (userData.status === 'pending') {
                        console.warn("⛔ Usuario PENDIENTE detectado.");

                        // --- SOLUCIÓN AL CONFLICTO DE ALERTAS ---
                        const isAlertOpen = document.querySelector('.swal2-container');
                        const isRegisterFlow = window.isRegisterFlow === true;

                        // Si es flujo de registro, esperar a que el SweetAlert del registro termine
                        if (isRegisterFlow) {
                            console.log("📝 Flujo de registro detectado, esperando mensaje...");
                            window.isRegisterFlow = false;

                            // Esperar 5 segundos para que el usuario vea el mensaje de éxito
                            await new Promise(r => setTimeout(r, 5000));

                            // Ahora sí cerrar sesión
                            await AuthService.logout();
                            navigateTo('/login');
                            return;
                        }

                        // Si NO es flujo de registro, mostrar alerta azul normal
                        if (!isAlertOpen) {
                            if (typeof Swal !== 'undefined') {
                                Swal.fire({
                                    icon: 'info',
                                    title: 'Cuenta en Revisión',
                                    text: 'Tu solicitud ha sido recibida pero aún no ha sido aprobada por el administrador.',
                                    confirmButtonColor: '#2563EB'
                                });
                            } else {
                                alert("Cuenta en revisión.");
                            }
                        }

                        // Cerramos sesión
                        await AuthService.logout();
                        navigateTo('/login');
                        return;
                    }
                }
            } catch (error) {
                console.error("Error verificando estado:", error);
            }

            const currentRoute = getCurrentRoute();
            if (currentRoute === '/login' || currentRoute === '/' || currentRoute === '') {
                navigateTo('/dashboard');
            } else {
                router();
            }

        } else {
            console.log("⚠️ No hay sesión, redirigiendo a Login");
            const currentRoute = getCurrentRoute();
            if (currentRoute !== '/register') {
                navigateTo('/login');
            } else {
                router();
            }
        }
    });

    // Navegación con botón atrás/adelante del navegador
    window.addEventListener('popstate', router);
});

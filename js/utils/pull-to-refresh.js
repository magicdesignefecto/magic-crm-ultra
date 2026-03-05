/**
 * PullToRefresh - Utilidad para gesto de "deslizar para actualizar"
 * Solo se activa cuando estás en el TOPE y tiras hacia abajo (como Instagram/Facebook)
 */
export const PullToRefresh = {
    isEnabled: false,
    startY: 0,
    currentY: 0,
    pullDistance: 0,
    threshold: 100, // Distancia mínima para activar refresh (más grande para evitar accidentes)
    maxPull: 150,
    isRefreshing: false,
    isPulling: false,
    indicator: null,
    onRefresh: null,
    scrollContainer: null,

    /**
     * Inicializar Pull-to-Refresh
     * @param {Function} refreshCallback - Función async a ejecutar al hacer refresh
     */
    init: (refreshCallback) => {
        if (PullToRefresh.isEnabled) return;

        PullToRefresh.onRefresh = refreshCallback;
        PullToRefresh.createIndicator();
        PullToRefresh.bindEvents();
        PullToRefresh.isEnabled = true;
    },

    /**
     * Crear el indicador visual
     */
    createIndicator: () => {
        const existing = document.getElementById('ptr-indicator');
        if (existing) existing.remove();

        const indicator = document.createElement('div');
        indicator.id = 'ptr-indicator';
        indicator.innerHTML = `
            <style>
                #ptr-indicator {
                    position: fixed;
                    top: -70px;
                    left: 50%;
                    transform: translateX(-50%);
                    width: 50px;
                    height: 50px;
                    background: var(--bg-card, #fff);
                    border-radius: 50%;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.15);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 9999;
                    transition: top 0.3s ease-out, opacity 0.3s;
                    opacity: 0;
                    pointer-events: none;
                }
                @media (min-width: 769px) {
                    #ptr-indicator { display: none !important; }
                }
                #ptr-indicator.visible {
                    opacity: 1;
                }
                #ptr-indicator.pulling {
                    transition: none;
                }
                #ptr-indicator.refreshing {
                    top: 80px !important;
                    opacity: 1;
                }
                #ptr-indicator .ptr-spinner {
                    width: 24px;
                    height: 24px;
                    border: 3px solid var(--border-color, #e5e7eb);
                    border-top-color: #3B82F6;
                    border-radius: 50%;
                }
                #ptr-indicator.refreshing .ptr-spinner {
                    animation: ptr-spin 0.8s linear infinite;
                }
                #ptr-indicator .ptr-arrow {
                    font-size: 22px;
                    color: #3B82F6;
                    transition: transform 0.2s;
                }
                @keyframes ptr-spin {
                    to { transform: rotate(360deg); }
                }
            </style>
            <div class="ptr-spinner" style="display: none;"></div>
            <div class="ptr-arrow">↓</div>
        `;
        document.body.appendChild(indicator);
        PullToRefresh.indicator = indicator;
    },

    /**
     * Vincular eventos táctiles
     */
    bindEvents: () => {
        // Buscar el contenedor de scroll principal
        const scrollArea = document.querySelector('.content-scroll-area');
        PullToRefresh.scrollContainer = scrollArea || document.body;

        document.addEventListener('touchstart', PullToRefresh.handleTouchStart, { passive: true });
        document.addEventListener('touchmove', PullToRefresh.handleTouchMove, { passive: false });
        document.addEventListener('touchend', PullToRefresh.handleTouchEnd, { passive: true });
    },

    /**
     * Verificar si estamos en el tope del scroll
     */
    isAtTop: () => {
        const scrollArea = document.querySelector('.content-scroll-area');
        if (scrollArea) {
            return scrollArea.scrollTop <= 0;
        }
        return (window.pageYOffset || document.documentElement.scrollTop) <= 0;
    },

    /**
     * Manejar inicio del toque
     */
    handleTouchStart: (e) => {
        if (PullToRefresh.isRefreshing) return;

        // IMPORTANTE: Solo iniciar si estamos en el TOPE
        if (!PullToRefresh.isAtTop()) {
            PullToRefresh.startY = 0;
            return;
        }

        PullToRefresh.startY = e.touches[0].clientY;
        PullToRefresh.isPulling = false;
    },

    /**
     * Manejar movimiento del dedo
     */
    handleTouchMove: (e) => {
        // No hacer nada si no iniciamos correctamente o estamos refrescando
        if (PullToRefresh.startY === 0 || PullToRefresh.isRefreshing) return;

        // Verificar que seguimos en el tope
        if (!PullToRefresh.isAtTop()) {
            PullToRefresh.reset();
            return;
        }

        PullToRefresh.currentY = e.touches[0].clientY;
        const diff = PullToRefresh.currentY - PullToRefresh.startY;

        // Solo activar si estamos tirando HACIA ABAJO (diff positivo)
        if (diff <= 0) {
            PullToRefresh.reset();
            return;
        }

        // Aplicar resistencia al pull (efecto elástico)
        PullToRefresh.pullDistance = Math.min(diff * 0.5, PullToRefresh.maxPull);

        // Solo mostrar indicador si hay pull significativo (> 20px)
        if (PullToRefresh.pullDistance > 20) {
            e.preventDefault(); // Prevenir scroll nativo SOLO cuando hay pull real
            PullToRefresh.isPulling = true;

            if (PullToRefresh.indicator) {
                PullToRefresh.indicator.classList.add('pulling', 'visible');

                const indicatorY = -70 + PullToRefresh.pullDistance;
                PullToRefresh.indicator.style.top = `${indicatorY}px`;

                // Rotar flecha según progreso
                const progress = Math.min(PullToRefresh.pullDistance / PullToRefresh.threshold, 1);
                const arrow = PullToRefresh.indicator.querySelector('.ptr-arrow');
                if (arrow) {
                    arrow.style.transform = `rotate(${progress * 180}deg)`;
                }
            }
        }
    },

    /**
     * Manejar fin del toque
     */
    handleTouchEnd: async () => {
        if (!PullToRefresh.isPulling || PullToRefresh.startY === 0) {
            PullToRefresh.reset();
            return;
        }

        PullToRefresh.indicator?.classList.remove('pulling');

        // Si pasó el umbral, ejecutar refresh
        if (PullToRefresh.pullDistance >= PullToRefresh.threshold && !PullToRefresh.isRefreshing) {
            PullToRefresh.isRefreshing = true;

            // Mostrar spinner
            const spinner = PullToRefresh.indicator?.querySelector('.ptr-spinner');
            const arrow = PullToRefresh.indicator?.querySelector('.ptr-arrow');
            if (spinner) spinner.style.display = 'block';
            if (arrow) arrow.style.display = 'none';
            PullToRefresh.indicator?.classList.add('refreshing');

            try {
                if (PullToRefresh.onRefresh) {
                    await PullToRefresh.onRefresh();
                }
            } catch (error) {
                console.error('Error en refresh:', error);
            }

            // Esperar para que se vea el spinner
            await new Promise(r => setTimeout(r, 600));

            // Ocultar
            if (spinner) spinner.style.display = 'none';
            if (arrow) arrow.style.display = 'block';
            PullToRefresh.indicator?.classList.remove('refreshing', 'visible');
            PullToRefresh.isRefreshing = false;
        }

        PullToRefresh.reset();
    },

    /**
     * Resetear estado
     */
    reset: () => {
        PullToRefresh.startY = 0;
        PullToRefresh.currentY = 0;
        PullToRefresh.pullDistance = 0;
        PullToRefresh.isPulling = false;

        if (PullToRefresh.indicator && !PullToRefresh.isRefreshing) {
            PullToRefresh.indicator.style.top = '-70px';
            PullToRefresh.indicator.classList.remove('pulling', 'visible');
            const arrow = PullToRefresh.indicator.querySelector('.ptr-arrow');
            if (arrow) arrow.style.transform = 'rotate(0deg)';
        }
    },

    /**
     * Destruir instancia
     */
    destroy: () => {
        document.removeEventListener('touchstart', PullToRefresh.handleTouchStart);
        document.removeEventListener('touchmove', PullToRefresh.handleTouchMove);
        document.removeEventListener('touchend', PullToRefresh.handleTouchEnd);

        PullToRefresh.indicator?.remove();
        PullToRefresh.isEnabled = false;
    }
};

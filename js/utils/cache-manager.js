/**
 * CacheManager - Sistema de caché en memoria con localStorage
 * Reduce lecturas a Firebase y mejora rendimiento
 */
export const CacheManager = {
    // Tiempo de expiración por defecto: 5 minutos
    DEFAULT_TTL: 5 * 60 * 1000,

    // Prefijo para keys en localStorage
    PREFIX: 'crm_cache_',

    /**
     * Obtener datos del caché
     * @param {string} key - Identificador único
     * @returns {any|null} - Datos cacheados o null si expiró/no existe
     */
    get: (key) => {
        try {
            const fullKey = CacheManager.PREFIX + key;
            const cached = localStorage.getItem(fullKey);

            if (!cached) return null;

            const { data, expiry } = JSON.parse(cached);

            // Verificar si expiró
            if (Date.now() > expiry) {
                localStorage.removeItem(fullKey);
                return null;
            }

            return data;
        } catch (e) {
            console.warn('Cache read error:', e);
            return null;
        }
    },

    /**
     * Guardar datos en caché
     * @param {string} key - Identificador único
     * @param {any} data - Datos a cachear
     * @param {number} ttl - Tiempo de vida en ms (opcional)
     */
    set: (key, data, ttl = CacheManager.DEFAULT_TTL) => {
        try {
            const fullKey = CacheManager.PREFIX + key;
            const cacheData = {
                data: data,
                expiry: Date.now() + ttl
            };
            localStorage.setItem(fullKey, JSON.stringify(cacheData));
        } catch (e) {
            console.warn('Cache write error:', e);
            // Si localStorage está lleno, limpiar caché antiguo
            if (e.name === 'QuotaExceededError') {
                CacheManager.clearOld();
            }
        }
    },

    /**
     * Invalidar una key específica
     * @param {string} key - Identificador a invalidar
     */
    invalidate: (key) => {
        try {
            localStorage.removeItem(CacheManager.PREFIX + key);
        } catch (e) { }
    },

    /**
     * Invalidar todas las keys que empiecen con un patrón
     * @param {string} pattern - Patrón a buscar
     */
    invalidatePattern: (pattern) => {
        try {
            const prefix = CacheManager.PREFIX + pattern;
            const keysToRemove = [];

            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith(prefix)) {
                    keysToRemove.push(key);
                }
            }

            keysToRemove.forEach(k => localStorage.removeItem(k));
        } catch (e) { }
    },

    /**
     * Limpiar todo el caché del CRM
     */
    clearAll: () => {
        try {
            const keysToRemove = [];

            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith(CacheManager.PREFIX)) {
                    keysToRemove.push(key);
                }
            }

            keysToRemove.forEach(k => localStorage.removeItem(k));
        } catch (e) { }
    },

    /**
     * Limpiar items expirados
     */
    clearOld: () => {
        try {
            const keysToRemove = [];

            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith(CacheManager.PREFIX)) {
                    try {
                        const cached = localStorage.getItem(key);
                        const { expiry } = JSON.parse(cached);
                        if (Date.now() > expiry) {
                            keysToRemove.push(key);
                        }
                    } catch (e) {
                        keysToRemove.push(key);
                    }
                }
            }

            keysToRemove.forEach(k => localStorage.removeItem(k));
        } catch (e) { }
    },

    /**
     * Obtener userId del usuario actual para keys únicas
     * @returns {string}
     */
    getUserKey: () => {
        try {
            // Intentar obtener del auth de Firebase
            const authData = sessionStorage.getItem('firebase:authUser');
            if (authData) {
                const parsed = JSON.parse(authData);
                return parsed?.uid || 'anonymous';
            }
        } catch (e) { }
        return 'anonymous';
    }
};

// Limpiar caché expirado al cargar
CacheManager.clearOld();

// SettingsService - Conectado a Firebase Firestore con Caché
import { db, auth } from '../core/firebase-config.js';
import {
    collection,
    getDocs,
    addDoc,
    deleteDoc,
    updateDoc,
    doc,
    query,
    where
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { CacheManager } from '../utils/cache-manager.js';

const CACHE_KEY = 'services';

// Servicios por defecto
const DEFAULT_SERVICES = [
    { name: "Gestión Redes Sociales", price: 0 },
    { name: "Facebook/IG Ads", price: 0 },
    { name: "Diseño Web", price: 0 },
    { name: "Google Ads", price: 0 },
    { name: "SEO", price: 0 },
    { name: "Branding", price: 0 },
    { name: "Desarrollo Software", price: 0 }
];

export const SettingsService = {
    // Obtener lista de servicios (con caché)
    getServices: async (forceRefresh = false) => {
        try {
            const user = auth.currentUser;
            if (!user) return DEFAULT_SERVICES.map(s => s.name);

            const cacheKey = `${CACHE_KEY}_${user.uid}`;

            // Verificar caché
            if (!forceRefresh) {
                const cached = CacheManager.get(cacheKey);
                if (cached) return cached;
            }

            // Ir a Firebase
            const servicesRef = collection(db, "services");
            const q = query(servicesRef, where("userId", "==", user.uid));
            const snapshot = await getDocs(q);

            let services;
            if (snapshot.empty) {
                services = DEFAULT_SERVICES.map(s => s.name);
            } else {
                services = snapshot.docs.map(doc => doc.data().name);
            }

            // Guardar en caché (10 minutos para settings)
            CacheManager.set(cacheKey, services, 10 * 60 * 1000);

            return services;
        } catch (error) {
            console.error("Error al cargar servicios:", error);
            return DEFAULT_SERVICES.map(s => s.name);
        }
    },

    // Obtener servicios con detalles (con caché)
    getServicesWithDetails: async (forceRefresh = false) => {
        try {
            const user = auth.currentUser;
            if (!user) {
                return DEFAULT_SERVICES.map((s, idx) => ({
                    id: `default-${idx}`,
                    name: s.name,
                    price: s.price
                }));
            }

            const cacheKey = `${CACHE_KEY}_details_${user.uid}`;

            // Verificar caché
            if (!forceRefresh) {
                const cached = CacheManager.get(cacheKey);
                if (cached) return cached;
            }

            const servicesRef = collection(db, "services");
            const q = query(servicesRef, where("userId", "==", user.uid));
            const snapshot = await getDocs(q);

            let services;
            if (snapshot.empty) {
                services = DEFAULT_SERVICES.map((s, idx) => ({
                    id: `default-${idx}`,
                    name: s.name,
                    price: s.price
                }));
            } else {
                services = snapshot.docs.map(doc => ({
                    id: doc.id,
                    name: doc.data().name,
                    price: doc.data().price || 0
                }));
            }

            CacheManager.set(cacheKey, services, 10 * 60 * 1000);
            return services;
        } catch (error) {
            console.error("Error al cargar servicios con detalles:", error);
            return [];
        }
    },

    // Agregar nuevo servicio
    addService: async (serviceName, servicePrice = 0) => {
        try {
            const user = auth.currentUser;
            if (!user) throw new Error("Debes estar autenticado");

            if (!serviceName || serviceName.trim() === "") {
                throw new Error("El nombre del servicio es requerido");
            }

            await addDoc(collection(db, "services"), {
                name: serviceName.trim(),
                price: parseFloat(servicePrice) || 0,
                userId: user.uid,
                createdAt: new Date().toISOString()
            });

            // Invalidar caché
            SettingsService._invalidateCache(user.uid);

            return await SettingsService.getServices(true);
        } catch (error) {
            console.error("Error al agregar servicio:", error);
            throw error;
        }
    },

    // Actualizar servicio existente
    updateService: async (serviceId, serviceName, servicePrice) => {
        try {
            const user = auth.currentUser;
            if (!user) throw new Error("Debes estar autenticado");

            if (!serviceName || serviceName.trim() === "") {
                throw new Error("El nombre del servicio es requerido");
            }

            await updateDoc(doc(db, "services", serviceId), {
                name: serviceName.trim(),
                price: parseFloat(servicePrice) || 0
            });

            // Invalidar caché
            SettingsService._invalidateCache(user.uid);

            return await SettingsService.getServicesWithDetails(true);
        } catch (error) {
            console.error("Error al actualizar servicio:", error);
            throw error;
        }
    },

    // Eliminar servicio
    removeService: async (serviceId) => {
        try {
            const user = auth.currentUser;
            await deleteDoc(doc(db, "services", serviceId));

            // Invalidar caché
            if (user) {
                SettingsService._invalidateCache(user.uid);
            }

            return await SettingsService.getServices(true);
        } catch (error) {
            console.error("Error al eliminar servicio:", error);
            throw error;
        }
    },

    // Forzar actualización
    refresh: async () => {
        await SettingsService.getServices(true);
        return await SettingsService.getServicesWithDetails(true);
    },

    // Método interno para invalidar ambas cachés
    _invalidateCache: (userId) => {
        CacheManager.invalidate(`${CACHE_KEY}_${userId}`);
        CacheManager.invalidate(`${CACHE_KEY}_details_${userId}`);
    }
};
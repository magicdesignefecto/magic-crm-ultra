import { db, auth } from '../core/firebase-config.js';
import {
    collection,
    addDoc,
    getDocs,
    doc,
    updateDoc,
    deleteDoc,
    getDoc,
    query,
    where
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { CacheManager } from '../utils/cache-manager.js';

const COLLECTION_NAME = 'clients';
const CACHE_KEY = 'clients';

export const ClientsService = {
    // Obtener todos los clientes (con caché)
    getAll: async (forceRefresh = false) => {
        try {
            const user = auth.currentUser;
            if (!user) return [];

            const cacheKey = `${CACHE_KEY}_${user.uid}`;

            // Verificar caché primero (si no es forzado)
            if (!forceRefresh) {
                const cached = CacheManager.get(cacheKey);
                if (cached) return cached;
            }

            // Si no hay caché o está expirado, ir a Firebase
            const q = query(
                collection(db, COLLECTION_NAME),
                where("userId", "==", user.uid)
            );

            const querySnapshot = await getDocs(q);
            const clients = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            // Ordenar en cliente
            clients.sort((a, b) => {
                const dateA = new Date(a.createdAt || 0);
                const dateB = new Date(b.createdAt || 0);
                return dateB - dateA;
            });

            // Guardar en caché
            CacheManager.set(cacheKey, clients);

            return clients;
        } catch (error) {
            console.error("Error obteniendo clientes:", error);
            return [];
        }
    },

    // Crear cliente
    create: async (clientData) => {
        try {
            const user = auth.currentUser;
            if (!user) throw new Error("Debes estar logueado");

            const newClient = {
                ...clientData,
                userId: user.uid,
                createdBy: user.displayName || user.email,
                createdAt: new Date().toISOString(),
                status: 'Activo'
            };

            const docRef = await addDoc(collection(db, COLLECTION_NAME), newClient);

            // Invalidar caché para forzar recarga
            CacheManager.invalidate(`${CACHE_KEY}_${user.uid}`);

            return { id: docRef.id, ...newClient };
        } catch (error) {
            console.error("Error guardando cliente:", error);
            throw error;
        }
    },

    // Obtener por ID
    getById: async (id) => {
        try {
            const docRef = doc(db, COLLECTION_NAME, id);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                return { id: docSnap.id, ...docSnap.data() };
            }
            return null;
        } catch (error) {
            console.error("Error buscando cliente:", error);
            return null;
        }
    },

    // Actualizar cliente
    update: async (id, data) => {
        try {
            const user = auth.currentUser;
            const docRef = doc(db, COLLECTION_NAME, id);
            await updateDoc(docRef, data);

            // Invalidar caché
            if (user) CacheManager.invalidate(`${CACHE_KEY}_${user.uid}`);

            return { id, ...data };
        } catch (error) { throw error; }
    },

    // Eliminar cliente
    delete: async (id) => {
        try {
            const user = auth.currentUser;
            await deleteDoc(doc(db, COLLECTION_NAME, id));

            // Invalidar caché
            if (user) CacheManager.invalidate(`${CACHE_KEY}_${user.uid}`);

            return true;
        } catch (error) { return false; }
    },

    // Forzar actualización del caché
    refresh: async () => {
        return await ClientsService.getAll(true);
    }
};

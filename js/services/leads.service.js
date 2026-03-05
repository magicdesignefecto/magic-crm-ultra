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

const COLLECTION_NAME = 'leads';
const CACHE_KEY = 'leads';

export const LeadsService = {
    // Obtener todos los leads (con caché)
    getAll: async (forceRefresh = false) => {
        try {
            const user = auth.currentUser;
            if (!user) return [];

            const cacheKey = `${CACHE_KEY}_${user.uid}`;

            // Verificar caché primero
            if (!forceRefresh) {
                const cached = CacheManager.get(cacheKey);
                if (cached) return cached;
            }

            // Ir a Firebase
            const q = query(
                collection(db, COLLECTION_NAME),
                where("userId", "==", user.uid)
            );

            const querySnapshot = await getDocs(q);
            const leads = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            // Ordenar en cliente
            leads.sort((a, b) => {
                const dateA = new Date(a.createdAt || 0);
                const dateB = new Date(b.createdAt || 0);
                return dateB - dateA;
            });

            // Guardar en caché
            CacheManager.set(cacheKey, leads);

            return leads;
        } catch (error) {
            console.error("Error obteniendo leads:", error);
            return [];
        }
    },

    create: async (leadData) => {
        try {
            const user = auth.currentUser;
            if (!user) throw new Error("No autenticado");

            const newLead = {
                ...leadData,
                userId: user.uid,
                createdBy: user.displayName || user.email,
                createdAt: new Date().toISOString()
            };
            const docRef = await addDoc(collection(db, COLLECTION_NAME), newLead);

            // Invalidar caché
            CacheManager.invalidate(`${CACHE_KEY}_${user.uid}`);

            return { id: docRef.id, ...newLead };
        } catch (error) {
            console.error("Error creando lead:", error);
            throw error;
        }
    },

    getById: async (id) => {
        try {
            const docRef = doc(db, COLLECTION_NAME, id);
            const docSnap = await getDoc(docRef);
            return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;
        } catch (error) { return null; }
    },

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
        return await LeadsService.getAll(true);
    }
};

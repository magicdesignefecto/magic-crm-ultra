// QuotesService - Conectado a Firebase Firestore con Caché
import { db, auth } from '../core/firebase-config.js';
import {
    collection,
    getDocs,
    addDoc,
    doc,
    getDoc,
    deleteDoc,
    updateDoc,
    query,
    where
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { CacheManager } from '../utils/cache-manager.js';

const CACHE_KEY = 'quotes';

export const QuotesService = {
    // Obtener todas las cotizaciones (con caché)
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
            const quotesRef = collection(db, "quotes");
            const q = query(quotesRef, where("userId", "==", user.uid));
            const snapshot = await getDocs(q);

            if (snapshot.empty) {
                CacheManager.set(cacheKey, []);
                return [];
            }

            const quotes = snapshot.docs.map(docSnap => ({
                id: docSnap.id,
                ...docSnap.data()
            }));

            // Ordenar por fecha
            quotes.sort((a, b) => {
                const dateA = new Date(a.createdAt || 0);
                const dateB = new Date(b.createdAt || 0);
                return dateB - dateA;
            });

            // Guardar en caché
            CacheManager.set(cacheKey, quotes);

            return quotes;
        } catch (error) {
            console.error("Error al cargar cotizaciones:", error);
            return [];
        }
    },

    // Crear nueva cotización
    create: async (quoteData) => {
        try {
            const user = auth.currentUser;
            if (!user) throw new Error("Debes estar autenticado");

            // Obtener número siguiente
            const cached = CacheManager.get(`${CACHE_KEY}_${user.uid}`);
            const nextNumber = cached ? cached.length + 1 : 1;

            const newQuote = {
                ...quoteData,
                quoteNumber: nextNumber,
                userId: user.uid,
                createdBy: user.displayName || user.email,
                createdAt: new Date().toISOString(),
                status: quoteData.status || 'Pendiente'
            };

            const docRef = await addDoc(collection(db, "quotes"), newQuote);

            // Invalidar caché
            CacheManager.invalidate(`${CACHE_KEY}_${user.uid}`);

            return { id: docRef.id, ...newQuote };
        } catch (error) {
            console.error("Error al crear cotización:", error);
            throw error;
        }
    },

    // Obtener por ID
    getById: async (id) => {
        try {
            const docRef = doc(db, "quotes", id);
            const docSnap = await getDoc(docRef);
            return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;
        } catch (error) {
            console.error("Error al obtener cotización:", error);
            return null;
        }
    },

    // Actualizar cotización
    update: async (id, data) => {
        try {
            const user = auth.currentUser;
            const docRef = doc(db, "quotes", id);
            await updateDoc(docRef, data);

            // Invalidar caché
            if (user) CacheManager.invalidate(`${CACHE_KEY}_${user.uid}`);

            return { id, ...data };
        } catch (error) { throw error; }
    },

    // Eliminar cotización
    delete: async (id) => {
        try {
            const user = auth.currentUser;
            await deleteDoc(doc(db, "quotes", id));

            // Invalidar caché
            if (user) CacheManager.invalidate(`${CACHE_KEY}_${user.uid}`);

            return true;
        } catch (error) {
            console.error("Error al eliminar cotización:", error);
            return false;
        }
    },

    // Forzar actualización
    refresh: async () => {
        return await QuotesService.getAll(true);
    }
};
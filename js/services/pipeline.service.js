// PipelineService - Conectado a Firebase usando LEADS
// El Pipeline muestra los LEADS como oportunidades de venta
import { db, auth } from '../core/firebase-config.js';
import {
    collection,
    getDocs,
    doc,
    updateDoc,
    query,
    where
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { CacheManager } from '../utils/cache-manager.js';

const CACHE_KEY = 'pipeline';

export const PipelineService = {
    // Obtener todos los leads como oportunidades
    getAll: async (forceRefresh = false) => {
        try {
            const user = auth.currentUser;
            if (!user) return [];

            const cacheKey = `${CACHE_KEY}_${user.uid}`;

            if (!forceRefresh) {
                const cached = CacheManager.get(cacheKey);
                if (cached) return cached;
            }

            // Obtener LEADS del usuario
            const leadsRef = collection(db, "leads");
            const q = query(leadsRef, where("userId", "==", user.uid));
            const snapshot = await getDocs(q);

            if (snapshot.empty) {
                CacheManager.set(cacheKey, [], 2 * 60 * 1000);
                return [];
            }

            // Mapear leads a formato de pipeline
            const deals = snapshot.docs.map(docSnap => {
                const data = docSnap.data();

                // Mapear status de lead a stage de pipeline
                let stage = 'Nuevo';
                const status = (data.status || '').toLowerCase();

                if (status === 'nuevo' || status === 'pendiente' || status === '') {
                    stage = 'Nuevo';
                } else if (status === 'contactado' || status === 'en seguimiento' || status === 'seguimiento') {
                    stage = 'Propuesta';
                } else if (status === 'negociacion' || status === 'negociación' || status === 'cotizado') {
                    stage = 'Negociación';
                } else if (status === 'cerrado' || status === 'ganado' || status === 'cliente' || status === 'convertido') {
                    stage = 'Cierre';
                }

                // Si tiene pipelineStage guardado, usarlo
                if (data.pipelineStage) {
                    stage = data.pipelineStage;
                }

                return {
                    id: docSnap.id,
                    title: data.name || data.company || 'Lead sin nombre',
                    client: data.company || data.name || 'Sin empresa',
                    value: parseFloat(data.total) || parseFloat(data.budget) || 0,
                    currency: data.currency || 'BOB',
                    stage: stage,
                    status: data.status,
                    phone: data.phone || '',
                    email: data.email || '',
                    createdAt: data.createdAt
                };
            });

            deals.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
            CacheManager.set(cacheKey, deals, 2 * 60 * 1000);

            return deals;
        } catch (error) {
            console.error("Error obteniendo pipeline:", error);
            return [];
        }
    },

    // Actualizar la etapa (Drag & Drop)
    updateStage: async (id, newStage) => {
        try {
            const user = auth.currentUser;
            if (!user) throw new Error("No autenticado");

            const docRef = doc(db, "leads", id);

            // Mapear stage a status para mantener consistencia
            let newStatus = 'Nuevo';
            if (newStage === 'Nuevo') newStatus = 'Nuevo';
            else if (newStage === 'Propuesta') newStatus = 'Contactado';
            else if (newStage === 'Negociación') newStatus = 'Negociación';
            else if (newStage === 'Cierre') newStatus = 'Cerrado';

            await updateDoc(docRef, {
                pipelineStage: newStage,
                status: newStatus,
                updatedAt: new Date().toISOString()
            });

            // Invalidar cachés
            CacheManager.invalidate(`${CACHE_KEY}_${user.uid}`);
            CacheManager.invalidate(`leads_${user.uid}`);
            CacheManager.invalidate(`dashboard_${user.uid}`);

            return true;
        } catch (error) {
            console.error("Error actualizando stage:", error);
            return false;
        }
    },

    refresh: async () => {
        return await PipelineService.getAll(true);
    }
};

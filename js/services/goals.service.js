// GoalsService - Conectado a Firebase Firestore con Caché
import { db, auth } from '../core/firebase-config.js';
import {
    collection,
    getDocs,
    doc,
    setDoc,
    deleteDoc,
    addDoc,
    query,
    where
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { CacheManager } from '../utils/cache-manager.js';

const CACHE_KEY = 'goals';

export const GoalsService = {
    // =====================================================
    // HELPERS - Cálculo de progreso real (usa caché de otros servicios)
    // =====================================================

    getLeadsCountInRange: async (startDate, endDate) => {
        try {
            const user = auth.currentUser;
            if (!user) return 0;

            // Intentar usar caché de leads primero
            const cachedLeads = CacheManager.get(`leads_${user.uid}`);

            let leads;
            if (cachedLeads) {
                leads = cachedLeads;
            } else {
                const leadsRef = collection(db, "leads");
                const q = query(leadsRef, where("userId", "==", user.uid));
                const snapshot = await getDocs(q);
                leads = snapshot.docs.map(d => d.data());
            }

            const start = new Date(startDate).toISOString();
            const end = new Date(endDate + 'T23:59:59').toISOString();

            let count = 0;
            leads.forEach(data => {
                const createdAt = data.createdAt || '';
                if (createdAt >= start && createdAt <= end) count++;
            });

            return count;
        } catch (error) {
            console.error("Error al contar leads:", error);
            return 0;
        }
    },

    getSalesInRange: async (startDate, endDate, currency = 'BOB') => {
        try {
            const user = auth.currentUser;
            if (!user) return 0;

            // Intentar usar caché de quotes primero
            const cachedQuotes = CacheManager.get(`quotes_${user.uid}`);

            let quotes;
            if (cachedQuotes) {
                quotes = cachedQuotes;
            } else {
                const quotesRef = collection(db, "quotes");
                const q = query(quotesRef, where("userId", "==", user.uid));
                const snapshot = await getDocs(q);
                quotes = snapshot.docs.map(d => d.data());
            }

            const start = new Date(startDate).toISOString();
            const end = new Date(endDate + 'T23:59:59').toISOString();

            let total = 0;
            quotes.forEach(data => {
                const createdAt = data.createdAt || '';
                const status = (data.status || '').toLowerCase();
                const quoteCurrency = data.currency || 'BOB';

                if (createdAt >= start && createdAt <= end && quoteCurrency === currency) {
                    if (['aceptada', 'aprobada', 'cerrada', 'accepted', 'closed'].includes(status)) {
                        total += parseFloat(data.total) || 0;
                    }
                }
            });

            return total;
        } catch (error) {
            console.error("Error al calcular ventas:", error);
            return 0;
        }
    },

    // =====================================================
    // CRUD - Operaciones principales
    // =====================================================

    getAll: async (forceRefresh = false) => {
        try {
            const user = auth.currentUser;
            if (!user) return [];

            const cacheKey = `${CACHE_KEY}_${user.uid}`;

            // Verificar caché (TTL corto de 2 minutos para goals porque dependen de otros datos)
            if (!forceRefresh) {
                const cached = CacheManager.get(cacheKey);
                if (cached) return cached;
            }

            const goalsRef = collection(db, "goals");
            const q = query(goalsRef, where("userId", "==", user.uid));
            const snapshot = await getDocs(q);

            if (snapshot.empty) {
                CacheManager.set(cacheKey, [], 2 * 60 * 1000);
                return [];
            }

            const goals = [];
            for (const docSnap of snapshot.docs) {
                const data = docSnap.data();

                let current = 0;
                if (data.startDate && data.targetDate) {
                    if (data.type === 'leads') {
                        current = await GoalsService.getLeadsCountInRange(data.startDate, data.targetDate);
                    } else {
                        current = await GoalsService.getSalesInRange(
                            data.startDate,
                            data.targetDate,
                            data.currency || 'BOB'
                        );
                    }
                }

                goals.push({
                    id: docSnap.id,
                    name: data.name || (data.type === 'leads' ? 'Meta de Leads' : 'Meta de Facturación'),
                    type: data.type || 'sales',
                    currency: data.currency || 'BOB',
                    target: data.target || 0,
                    current: current,
                    achievements: data.achievements || 0,
                    startDate: data.startDate || null,
                    targetDate: data.targetDate || null,
                    notificationThreshold: data.notificationThreshold || 80,
                    notificationShown: data.notificationShown || false,
                    createdAt: data.createdAt,
                    updatedAt: data.updatedAt
                });
            }

            goals.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

            // Caché con TTL corto (2 min) porque progress depende de leads/quotes
            CacheManager.set(cacheKey, goals, 2 * 60 * 1000);

            return goals;
        } catch (error) {
            console.error("Error al cargar metas:", error);
            return [];
        }
    },

    create: async (goalData) => {
        try {
            const user = auth.currentUser;
            if (!user) throw new Error("Debes estar autenticado");

            const newGoal = {
                userId: user.uid,
                name: goalData.name || (goalData.type === 'leads' ? 'Meta de Leads' : 'Meta de Facturación'),
                type: goalData.type || 'sales',
                currency: goalData.currency || 'BOB',
                target: parseFloat(goalData.target) || 0,
                achievements: parseInt(goalData.achievements) || 0,
                startDate: goalData.startDate || new Date().toISOString().split('T')[0],
                targetDate: goalData.targetDate || '',
                notificationThreshold: parseInt(goalData.notificationThreshold) || 80,
                notificationShown: false,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            const docRef = await addDoc(collection(db, "goals"), newGoal);

            // Invalidar caché
            CacheManager.invalidate(`${CACHE_KEY}_${user.uid}`);

            return { id: docRef.id, ...newGoal };
        } catch (error) {
            console.error("Error al crear meta:", error);
            throw error;
        }
    },

    update: async (goalId, goalData) => {
        try {
            const user = auth.currentUser;
            if (!user) throw new Error("Debes estar autenticado");

            const updateData = {
                name: goalData.name,
                type: goalData.type || 'sales',
                currency: goalData.currency || 'BOB',
                target: parseFloat(goalData.target) || 0,
                achievements: parseInt(goalData.achievements) || 0,
                startDate: goalData.startDate,
                targetDate: goalData.targetDate,
                notificationThreshold: parseInt(goalData.notificationThreshold) || 80,
                updatedAt: new Date().toISOString()
            };

            await setDoc(doc(db, "goals", goalId), updateData, { merge: true });

            // Invalidar caché
            CacheManager.invalidate(`${CACHE_KEY}_${user.uid}`);

            return { id: goalId, ...updateData };
        } catch (error) {
            console.error("Error al actualizar meta:", error);
            throw error;
        }
    },

    delete: async (goalId) => {
        try {
            const user = auth.currentUser;
            await deleteDoc(doc(db, "goals", goalId));

            // Invalidar caché
            if (user) CacheManager.invalidate(`${CACHE_KEY}_${user.uid}`);

            return true;
        } catch (error) {
            console.error("Error al eliminar meta:", error);
            return false;
        }
    },

    markNotificationShown: async (goalId) => {
        try {
            const user = auth.currentUser;
            await setDoc(doc(db, "goals", goalId), {
                notificationShown: true,
                updatedAt: new Date().toISOString()
            }, { merge: true });

            if (user) CacheManager.invalidate(`${CACHE_KEY}_${user.uid}`);

            return true;
        } catch (error) {
            console.error("Error al marcar notificación:", error);
            return false;
        }
    },

    getSummary: async () => {
        try {
            const goals = await GoalsService.getAll();
            return {
                total: goals.length,
                completed: goals.filter(g => g.current >= g.target).length,
                inProgress: goals.filter(g => g.current < g.target && g.current > 0).length,
                totalAchievements: goals.reduce((sum, g) => sum + (g.achievements || 0), 0)
            };
        } catch (error) {
            return { total: 0, completed: 0, inProgress: 0, totalAchievements: 0 };
        }
    },

    // Forzar actualización
    refresh: async () => {
        return await GoalsService.getAll(true);
    }
};
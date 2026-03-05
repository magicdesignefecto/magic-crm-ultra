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

const COLLECTION_NAME = 'projects';
const CACHE_KEY = 'projects';

export const ProjectsService = {
    // Obtener todos los proyectos (con caché)
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
            const projects = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            projects.sort((a, b) => {
                const dateA = new Date(a.createdAt || 0);
                const dateB = new Date(b.createdAt || 0);
                return dateB - dateA;
            });

            // Guardar en caché
            CacheManager.set(cacheKey, projects);

            return projects;
        } catch (error) {
            console.error("Error obteniendo proyectos:", error);
            return [];
        }
    },

    create: async (data) => {
        try {
            const user = auth.currentUser;
            if (!user) throw new Error("No autenticado");

            const payments = [];
            let totalPaid = 0;

            if (data.initialPayment && data.initialPayment > 0) {
                payments.push({
                    id: `pay_${Date.now()}`,
                    concept: 'Anticipo inicial',
                    amount: parseFloat(data.initialPayment),
                    type: 'income',
                    date: new Date().toISOString()
                });
                totalPaid = parseFloat(data.initialPayment);
            }

            const newProject = {
                ...data,
                userId: user.uid,
                createdBy: user.displayName || user.email,
                createdAt: new Date().toISOString(),
                tasks: [],
                payments: payments,
                costs: 0,
                totalPaid: totalPaid
            };

            const docRef = await addDoc(collection(db, COLLECTION_NAME), newProject);

            // Invalidar caché
            CacheManager.invalidate(`${CACHE_KEY}_${user.uid}`);

            return { id: docRef.id, ...newProject };
        } catch (error) {
            console.error("Error creando proyecto:", error);
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

    // =====================================================
    // TASK MANAGEMENT
    // =====================================================
    addTask: async (projectId, taskData) => {
        try {
            const project = await ProjectsService.getById(projectId);
            if (!project) throw new Error("Proyecto no encontrado");

            const tasks = project.tasks || [];
            const newTask = {
                id: `task_${Date.now()}`,
                description: taskData.description,
                dueDate: taskData.dueDate || null,
                status: taskData.status || 'pendiente',
                createdAt: new Date().toISOString()
            };
            tasks.push(newTask);

            await ProjectsService.update(projectId, { tasks });
            return newTask;
        } catch (error) { throw error; }
    },

    updateTask: async (projectId, taskId, updates) => {
        try {
            const project = await ProjectsService.getById(projectId);
            if (!project) throw new Error("Proyecto no encontrado");

            const tasks = (project.tasks || []).map(t =>
                t.id === taskId ? { ...t, ...updates } : t
            );

            await ProjectsService.update(projectId, { tasks });
            return true;
        } catch (error) { throw error; }
    },

    deleteTask: async (projectId, taskId) => {
        try {
            const project = await ProjectsService.getById(projectId);
            if (!project) throw new Error("Proyecto no encontrado");

            const tasks = (project.tasks || []).filter(t => t.id !== taskId);
            await ProjectsService.update(projectId, { tasks });
            return true;
        } catch (error) { throw error; }
    },

    // =====================================================
    // FINANCE MANAGEMENT
    // =====================================================
    addPayment: async (projectId, paymentData) => {
        try {
            const project = await ProjectsService.getById(projectId);
            if (!project) throw new Error("Proyecto no encontrado");

            const payments = project.payments || [];
            const newPayment = {
                id: `pay_${Date.now()}`,
                concept: paymentData.concept,
                amount: parseFloat(paymentData.amount) || 0,
                type: paymentData.type,
                date: new Date().toISOString()
            };
            payments.push(newPayment);

            let totalPaid = 0;
            let totalCosts = 0;
            payments.forEach(p => {
                if (p.type === 'income') totalPaid += p.amount;
                else totalCosts += p.amount;
            });

            await ProjectsService.update(projectId, {
                payments,
                totalPaid,
                costs: totalCosts
            });
            return newPayment;
        } catch (error) { throw error; }
    },

    deletePayment: async (projectId, paymentId) => {
        try {
            const project = await ProjectsService.getById(projectId);
            if (!project) throw new Error("Proyecto no encontrado");

            const payments = (project.payments || []).filter(p => p.id !== paymentId);

            let totalPaid = 0;
            let totalCosts = 0;
            payments.forEach(p => {
                if (p.type === 'income') totalPaid += p.amount;
                else totalCosts += p.amount;
            });

            await ProjectsService.update(projectId, {
                payments,
                totalPaid,
                costs: totalCosts
            });
            return true;
        } catch (error) { throw error; }
    },

    // Forzar actualización
    refresh: async () => {
        return await ProjectsService.getAll(true);
    }
};
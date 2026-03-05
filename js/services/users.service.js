// js/services/users.service.js
import { db } from '../core/firebase-config.js';
import { 
    collection, 
    getDocs, 
    doc, 
    updateDoc, 
    query, 
    where, 
    orderBy 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const COLLECTION_NAME = 'users';

export const UsersService = {
    // 1. Obtener solo los usuarios PENDIENTES
    getPendingUsers: async () => {
        try {
            // Buscamos usuarios donde status sea 'pending'
            const q = query(
                collection(db, COLLECTION_NAME), 
                where("status", "==", "pending"),
                orderBy("createdAt", "desc")
            );
            
            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error("Error cargando usuarios pendientes:", error);
            return [];
        }
    },

    // 2. Cambiar estado (Aprobar o Rechazar)
    updateStatus: async (uid, newStatus) => {
        try {
            const userRef = doc(db, COLLECTION_NAME, uid);
            
            // Si aprobamos, el estado es 'approved'. Si denegamos, 'rejected'.
            await updateDoc(userRef, {
                status: newStatus,
                updatedAt: new Date().toISOString()
            });
            
            return true;
        } catch (error) {
            console.error("Error actualizando usuario:", error);
            throw error;
        }
    }
};
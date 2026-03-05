// js/services/auth.service.js
import { auth, db } from '../core/firebase-config.js';
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    updateProfile,
    sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { CacheManager } from '../utils/cache-manager.js';

export const AuthService = {
    // 1. SOLICITUD DE REGISTRO (Nace como 'pending')
    register: async (email, password, name, phone, role) => {
        try {
            // A. Crear autenticación (El correo y contraseña)
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            await updateProfile(user, { displayName: name });

            // B. Crear ficha de usuario en Base de Datos con estado PENDIENTE
            // Esto es lo que faltaba: Escribir en la DB
            await setDoc(doc(db, "users", user.uid), {
                uid: user.uid,
                name: name,
                email: email,
                phone: phone || '', // Guardamos el teléfono
                role: role || 'Ventas',
                status: 'pending', // <--- EL CANDADO 🔒 (Nace bloqueado)
                createdAt: new Date().toISOString(),
                photoURL: user.photoURL
            });

            // C. Cerramos sesión inmediatamente para que no entre directo
            await signOut(auth);

            return user;
        } catch (error) {
            console.error("Error registro:", error);
            throw error;
        }
    },

    // 2. LOGIN CON VERIFICACIÓN DE APROBACIÓN
    login: async (email, password) => {
        try {
            // A. Intentar login técnico (Correo y contraseña coinciden)
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // B. Verificar si el jefe (Tú) lo aprobó en la base de datos
            const userDocRef = doc(db, "users", user.uid);
            const userDoc = await getDoc(userDocRef);

            if (userDoc.exists()) {
                const userData = userDoc.data();

                // SI ESTÁ PENDIENTE O RECHAZADO -> ¡FUERA! 🚫
                if (userData.status !== 'approved') {
                    await signOut(auth); // Cerramos la sesión forzosamente
                    throw new Error("Tu cuenta está en revisión. Espera la aprobación del administrador.");
                }
            } else {
                // Si el usuario existe en Auth pero no tiene ficha en la DB (por las pruebas anteriores)
                // Lo creamos ahora mismo como pendiente y lo bloqueamos.
                await setDoc(doc(db, "users", user.uid), {
                    uid: user.uid,
                    email: user.email,
                    status: 'pending', // Bloqueado
                    role: 'Ventas'
                });
                await signOut(auth);
                throw new Error("Tu cuenta está en revisión.");
            }

            // Si pasa el filtro, entra.
            return user;
        } catch (error) {
            console.error("Error login:", error);
            throw error;
        }
    },

    resetPassword: async (email) => {
        await sendPasswordResetEmail(auth, email);
    },

    logout: async () => {
        // Clear all cached data to prevent stale data on next login
        CacheManager.clearAll();
        await signOut(auth);
    },

    onAuthStateChanged: (callback) => {
        return onAuthStateChanged(auth, callback);
    }
};

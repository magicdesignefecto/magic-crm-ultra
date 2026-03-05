// js/core/firebase-config.js

// 1. Importaciones (NO BORRAR)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// 2. Tu configuración NUEVA (crm-exito)
const firebaseConfig = {
  apiKey: "AIzaSyAY2Yq3tN7_Lb01GKogqUSxuZvA_TEBSyk",
  authDomain: "crm-exito.firebaseapp.com",
  projectId: "crm-exito",
  storageBucket: "crm-exito.firebasestorage.app",
  messagingSenderId: "737591479638",
  appId: "1:737591479638:web:27b68aa687811d62b41af7"
};

// 3. INICIALIZACIÓN (¡ESTO ES LO QUE FALTABA!)
const app = initializeApp(firebaseConfig);

// 4. EXPORTACIÓN (Para que los otros archivos puedan usarlo)
export const auth = getAuth(app);
export const db = getFirestore(app);

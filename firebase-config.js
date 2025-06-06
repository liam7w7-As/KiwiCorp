// ============================================================================
// ARCHIVO DE CONFIGURACIÓN DE FIREBASE - EJEMPLO
// ============================================================================
// 
// INSTRUCCIONES:
// 1. Copia este archivo y renómbralo a 'firebase-config.js'
// 2. Ve a Firebase Console (https://console.firebase.google.com/)
// 3. Crea un nuevo proyecto o selecciona uno existente
// 4. Ve a Configuración del proyecto > General > Tus apps
// 5. Haz clic en '</>' para agregar una app web
// 6. Copia la configuración y reemplaza los valores de ejemplo abajo
// 7. Configura Firestore Database en modo de prueba
//
// ============================================================================

// Importar Firebase SDK
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { 
    getFirestore, 
    doc, 
    setDoc, 
    getDoc, 
    updateDoc, 
    arrayUnion,
    collection,
    getDocs,
    onSnapshot
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

// ============================================================================
// CONFIGURACIÓN DE FIREBASE
// ============================================================================
// ⚠️ REEMPLAZA ESTOS VALORES CON TU CONFIGURACIÓN REAL DE FIREBASE
const firebaseConfig = {
    apiKey: "AIzaSyBeIFsNNDq2_KEI4tzYBmpupB7vRUR5fKA",
    authDomain: "nova-49fae.firebaseapp.com",
    projectId: "nova-49fae",
    storageBucket: "nova-49fae.firebasestorage.app",
    messagingSenderId: "603375412075",
    appId: "1:603375412075:web:55f90912588faf4b13e22e",
    measurementId: "G-R2CTHPYPDQ"
  };

// ============================================================================
// EJEMPLO DE CONFIGURACIÓN REAL (COMENTADO)
// ============================================================================
// const firebaseConfig = {
//     apiKey: "AIzaSyBxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
//     authDomain: "kiwi-exams-12345.firebaseapp.com",
//     projectId: "kiwi-exams-12345",
//     storageBucket: "kiwi-exams-12345.appspot.com",
//     messagingSenderId: "123456789012",
//     appId: "1:123456789012:web:abcdef123456789abcdef"
// };

// ============================================================================
// INICIALIZACIÓN (NO MODIFICAR)
// ============================================================================

let app;
let db;
let isFirebaseInitialized = false;

try {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    isFirebaseInitialized = true;
    console.log('🔥 Firebase inicializado correctamente');
} catch (error) {
    console.error('❌ Error inicializando Firebase:', error);
    console.log('📱 Usando modo local (localStorage)');
}

// ============================================================================
// SERVICIOS DE FIREBASE
// ============================================================================

// Servicio para guardar exámenes
export async function saveExam(examId, examData) {
    if (!isFirebaseInitialized) {
        throw new Error('Firebase no está inicializado');
    }
    
    try {
        const examRef = doc(db, 'exams', examId);
        await setDoc(examRef, {
            ...examData,
            updatedAt: new Date().toISOString()
        });
        return true;
    } catch (error) {
        console.error('Error guardando examen:', error);
        throw error;
    }
}

// Servicio para obtener exámenes
export async function getExam(examId) {
    if (!isFirebaseInitialized) {
        throw new Error('Firebase no está inicializado');
    }
    
    try {
        const examRef = doc(db, 'exams', examId);
        const examSnap = await getDoc(examRef);
        
        if (examSnap.exists()) {
            return examSnap.data();
        } else {
            return null;
        }
    } catch (error) {
        console.error('Error obteniendo examen:', error);
        throw error;
    }
}

// Servicio para guardar resultados de estudiantes
export async function saveStudentResult(examId, result) {
    if (!isFirebaseInitialized) {
        throw new Error('Firebase no está inicializado');
    }
    
    try {
        const examRef = doc(db, 'exams', examId);
        await updateDoc(examRef, {
            results: arrayUnion(result),
            lastResultAt: new Date().toISOString()
        });
        return true;
    } catch (error) {
        console.error('Error guardando resultado:', error);
        throw error;
    }
}

// Servicio para obtener todos los exámenes
export async function getAllExams() {
    if (!isFirebaseInitialized) {
        throw new Error('Firebase no está inicializado');
    }
    
    try {
        const examsRef = collection(db, 'exams');
        const querySnapshot = await getDocs(examsRef);
        const exams = [];
        
        querySnapshot.forEach((doc) => {
            exams.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        return exams;
    } catch (error) {
        console.error('Error obteniendo exámenes:', error);
        throw error;
    }
}

// Servicio para escuchar cambios en resultados en tiempo real
export function onExamResultsChange(examId, callback) {
    if (!isFirebaseInitialized) {
        throw new Error('Firebase no está inicializado');
    }
    
    try {
        const examRef = doc(db, 'exams', examId);
        return onSnapshot(examRef, (doc) => {
            if (doc.exists()) {
                callback(doc.data());
            }
        });
    } catch (error) {
        console.error('Error configurando listener:', error);
        throw error;
    }
}

// Función para probar la conexión
export async function testFirebaseConnection() {
    if (!isFirebaseInitialized) {
        return false;
    }
    
    try {
        // Intentar una operación simple para verificar conectividad
        const testRef = doc(db, 'test', 'connection');
        await setDoc(testRef, {
            timestamp: new Date().toISOString(),
            test: true
        });
        console.log('✅ Conexión a Firebase verificada');
        return true;
    } catch (error) {
        console.error('❌ Error de conexión a Firebase:', error);
        return false;
    }
}

// ============================================================================
// SERVICIO DE ALMACENAMIENTO CON FALLBACK
// ============================================================================

export const StorageService = {
    // Guardar examen
    saveExam: async (examId, examData) => {
        if (isFirebaseInitialized) {
            try {
                await saveExam(examId, examData);
                return true;
            } catch (error) {
                console.log('📱 Fallback a localStorage para guardar examen');
                localStorage.setItem(examId, JSON.stringify(examData));
                return true;
            }
        } else {
            localStorage.setItem(examId, JSON.stringify(examData));
            return true;
        }
    },
    
    // Obtener examen
    getExam: async (examId) => {
        if (isFirebaseInitialized) {
            try {
                const data = await getExam(examId);
                if (data) return data;
            } catch (error) {
                console.log('📱 Fallback a localStorage para obtener examen');
            }
        }
        
        // Fallback a localStorage
        const localData = localStorage.getItem(examId);
        return localData ? JSON.parse(localData) : null;
    },
    
    // Guardar resultado de estudiante
    saveStudentResult: async (examId, result) => {
        if (isFirebaseInitialized) {
            try {
                await saveStudentResult(examId, result);
                return true;
            } catch (error) {
                console.log('📱 Fallback a localStorage para guardar resultado');
            }
        }
        
        // Fallback a localStorage
        const localData = localStorage.getItem(examId);
        if (localData) {
            const exam = JSON.parse(localData);
            if (!exam.results) exam.results = [];
            exam.results.push(result);
            localStorage.setItem(examId, JSON.stringify(exam));
        }
        return true;
    }
};

// ============================================================================
// EXPORTACIONES PARA COMPATIBILIDAD
// ============================================================================

export { 
    app as FirebaseApp, 
    db as FirebaseDB, 
    isFirebaseInitialized as FirebaseInitialized 
};

export const FirebaseService = {
    saveExam,
    getExam,
    saveStudentResult,
    getAllExams,
    onExamResultsChange,
    testFirebaseConnection
};

// ============================================================================
// NOTAS IMPORTANTES
// ============================================================================
//
// 1. SEGURIDAD:
//    - Las reglas de Firestore deben configurarse apropiadamente
//    - Para producción, implementa autenticación
//    - No expongas credenciales sensibles
//
// 2. REGLAS DE FIRESTORE RECOMENDADAS PARA DESARROLLO:
//    rules_version = '2';
//    service cloud.firestore {
//      match /databases/{database}/documents {
//        match /exams/{examId} {
//          allow read, write: if true;
//        }
//      }
//    }
//
// 3. PARA PRODUCCIÓN:
//    - Implementa autenticación de usuarios
//    - Configura reglas más restrictivas
//    - Usa variables de entorno para credenciales
//    - Implementa validación de datos
//
// ============================================================================
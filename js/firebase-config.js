// Configuración de Firebase
// Reemplaza estos valores con los de tu proyecto Firebase
const firebaseConfig = {
    apiKey: "AIzaSyBeIFsNNDq2_KEI4tzYBmpupB7vRUR5fKA",
    authDomain: "nova-49fae.firebaseapp.com",
    projectId: "nova-49fae",
    storageBucket: "nova-49fae.firebasestorage.app",
    messagingSenderId: "603375412075",
    appId: "1:603375412075:web:a02092db397e9b8f13e22e",
    measurementId: "G-BJ8Y9H1K3P"
};

// Inicializar Firebase
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
// Obtener la instancia de Firestore
const db = getFirestore(app);

export { db };

// Funciones auxiliares para Firestore
export const FirebaseService = {
    // Guardar examen
    async saveExam(examId, examData) {
        try {
            const { doc, setDoc } = await import('firebase/firestore');
            await setDoc(doc(db, 'exams', examId), examData);
            console.log('Examen guardado en Firebase');
            return true;
        } catch (error) {
            console.error('Error guardando examen:', error);
            return false;
        }
    },

    // Obtener examen
    async getExam(examId) {
        try {
            const { doc, getDoc } = await import('firebase/firestore');
            const docRef = doc(db, 'exams', examId);
            const docSnap = await getDoc(docRef);
            
            if (docSnap.exists()) {
                return docSnap.data();
            } else {
                console.log('Examen no encontrado');
                return null;
            }
        } catch (error) {
            console.error('Error obteniendo examen:', error);
            return null;
        }
    },

    // Guardar resultado de estudiante
    async saveStudentResult(examId, resultData) {
        try {
            const { doc, updateDoc, arrayUnion, getDoc } = await import('firebase/firestore');
            const examRef = doc(db, 'exams', examId);
            
            // Verificar si el examen existe
            const examSnap = await getDoc(examRef);
            if (!examSnap.exists()) {
                console.error('Examen no encontrado');
                return false;
            }
            
            // Agregar resultado al array de resultados
            await updateDoc(examRef, {
                results: arrayUnion(resultData)
            });
            
            console.log('Resultado guardado en Firebase');
            return true;
        } catch (error) {
            console.error('Error guardando resultado:', error);
            return false;
        }
    },

    // Obtener todos los exámenes (para el profesor)
    async getAllExams() {
        try {
            const { collection, getDocs } = await import('firebase/firestore');
            const querySnapshot = await getDocs(collection(db, 'exams'));
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
            return [];
        }
    },

    // Escuchar cambios en tiempo real (para resultados)
    onExamResultsChange(examId, callback) {
        try {
            const { doc, onSnapshot } = import('firebase/firestore').then(({ doc, onSnapshot }) => {
                const examRef = doc(db, 'exams', examId);
                return onSnapshot(examRef, (docSnap) => {
                    if (docSnap.exists()) {
                        callback(docSnap.data());
                    }
                });
            });
            return () => {}; // Función para desuscribirse
        } catch (error) {
            console.error('Error configurando listener:', error);
            return () => {};
        }
    }
};

// Función para verificar conexión a Firebase
export async function testFirebaseConnection() {
    try {
        const { doc, getDoc } = await import('firebase/firestore');
        const testDoc = doc(db, 'test', 'connection');
        await getDoc(testDoc);
        console.log('✅ Conexión a Firebase exitosa');
        return true;
    } catch (error) {
        console.error('❌ Error de conexión a Firebase:', error);
        return false;
    }
}

// Fallback a localStorage si Firebase no está disponible
export const StorageService = {
    async saveExam(examId, examData) {
        if (window.navigator.onLine) {
            const success = await FirebaseService.saveExam(examId, examData);
            if (success) {
                // También guardar localmente como backup
                localStorage.setItem(examId, JSON.stringify(examData));
                return true;
            }
        }
        
        // Fallback a localStorage
        localStorage.setItem(examId, JSON.stringify(examData));
        console.log('Examen guardado localmente (sin conexión)');
        return true;
    },

    async getExam(examId) {
        if (window.navigator.onLine) {
            const examData = await FirebaseService.getExam(examId);
            if (examData) {
                return examData;
            }
        }
        
        // Fallback a localStorage
        const localData = localStorage.getItem(examId);
        return localData ? JSON.parse(localData) : null;
    },

    async saveStudentResult(examId, resultData) {
        if (window.navigator.onLine) {
            const success = await FirebaseService.saveStudentResult(examId, resultData);
            if (success) {
                return true;
            }
        }
        
        // Fallback a localStorage
        const examData = localStorage.getItem(examId);
        if (examData) {
            const exam = JSON.parse(examData);
            if (!exam.results) {
                exam.results = [];
            }
            exam.results.push(resultData);
            localStorage.setItem(examId, JSON.stringify(exam));
            console.log('Resultado guardado localmente (sin conexión)');
            return true;
        }
        return false;
    }
};
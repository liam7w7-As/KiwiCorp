// Variables globales
let questionCount = 0;
let currentExamId = null;

// Funciones para manejar modales
function openCreateExamModal() {
    document.getElementById('createExamModal').style.display = 'block';
    addQuestion(); // Agregar la primera pregunta automáticamente
}

function closeCreateExamModal() {
    document.getElementById('createExamModal').style.display = 'none';
    document.getElementById('examForm').reset();
    document.getElementById('questionsContainer').innerHTML = '';
    document.getElementById('examCreated').style.display = 'none';
    document.getElementById('examForm').style.display = 'block';
    questionCount = 0;
}

function openResultsModal() {
    document.getElementById('resultsModal').style.display = 'block';
}

function closeResultsModal() {
    document.getElementById('resultsModal').style.display = 'none';
    document.getElementById('resultsContent').innerHTML = '';
}

// Cerrar modales al hacer clic fuera de ellos
window.onclick = function(event) {
    const createModal = document.getElementById('createExamModal');
    const resultsModal = document.getElementById('resultsModal');
    
    if (event.target == createModal) {
        closeCreateExamModal();
    }
    if (event.target == resultsModal) {
        closeResultsModal();
    }
}

// Función para agregar una nueva pregunta
function addQuestion() {
    questionCount++;
    const questionsContainer = document.getElementById('questionsContainer');
    
    const questionDiv = document.createElement('div');
    questionDiv.className = 'question-item';
    questionDiv.id = `question-${questionCount}`;
    
    questionDiv.innerHTML = `
        <h4>Pregunta ${questionCount}</h4>
        <div class="form-group">
            <label>Pregunta:</label>
            <textarea name="question-${questionCount}" required placeholder="Escribe tu pregunta aquí..."></textarea>
        </div>
        
        <div class="form-group">
            <label>Opciones de respuesta:</label>
            <div class="option-input">
                <input type="text" name="option-${questionCount}-1" required placeholder="Opción A">
            </div>
            <div class="option-input">
                <input type="text" name="option-${questionCount}-2" required placeholder="Opción B">
            </div>
            <div class="option-input">
                <input type="text" name="option-${questionCount}-3" required placeholder="Opción C">
            </div>
            <div class="option-input">
                <input type="text" name="option-${questionCount}-4" required placeholder="Opción D">
            </div>
        </div>
        
        <div class="form-group">
            <label>Respuesta correcta:</label>
            <select name="correct-${questionCount}" required>
                <option value="">Selecciona la respuesta correcta</option>
                <option value="1">Opción A</option>
                <option value="2">Opción B</option>
                <option value="3">Opción C</option>
                <option value="4">Opción D</option>
            </select>
        </div>
        
        ${questionCount > 1 ? `<button type="button" class="remove-question-btn" onclick="removeQuestion(${questionCount})">Eliminar Pregunta</button>` : ''}
    `;
    
    questionsContainer.appendChild(questionDiv);
}

// Función para eliminar una pregunta
function removeQuestion(questionId) {
    const questionDiv = document.getElementById(`question-${questionId}`);
    if (questionDiv) {
        questionDiv.remove();
    }
}

// Función para manejar el envío del formulario
document.addEventListener('DOMContentLoaded', function() {
    const examForm = document.getElementById('examForm');
    if (examForm) {
        examForm.addEventListener('submit', function(e) {
            e.preventDefault();
            createExam();
        });
    }
});

// Importar Firebase (se cargará dinámicamente)
let FirebaseService = null;
let StorageService = null;

// Cargar Firebase dinámicamente
async function loadFirebase() {
    try {
        const firebaseModule = await import('./firebase-config.js');
        FirebaseService = firebaseModule.FirebaseService;
        StorageService = firebaseModule.StorageService;
        
        // Probar conexión
        const connected = await firebaseModule.testFirebaseConnection();
        if (connected) {
            console.log('🔥 Firebase conectado exitosamente');
            showFirebaseStatus(true);
        } else {
            console.log('📱 Usando modo local (sin conexión)');
            showFirebaseStatus(false);
        }
    } catch (error) {
        console.log('📱 Firebase no disponible, usando localStorage');
        showFirebaseStatus(false);
        // Usar localStorage como fallback
        StorageService = {
            saveExam: (id, data) => {
                localStorage.setItem(id, JSON.stringify(data));
                return Promise.resolve(true);
            },
            getExam: (id) => {
                const data = localStorage.getItem(id);
                return Promise.resolve(data ? JSON.parse(data) : null);
            },
            saveStudentResult: (id, result) => {
                const data = localStorage.getItem(id);
                if (data) {
                    const exam = JSON.parse(data);
                    if (!exam.results) exam.results = [];
                    exam.results.push(result);
                    localStorage.setItem(id, JSON.stringify(exam));
                }
                return Promise.resolve(true);
            }
        };
    }
}

// Mostrar estado de Firebase
function showFirebaseStatus(connected) {
    const statusEl = document.getElementById('firebaseStatus');
    if (statusEl) {
        statusEl.innerHTML = connected 
            ? '<i class="fas fa-cloud"></i> Conectado a Firebase (acceso remoto habilitado)'
            : '<i class="fas fa-wifi"></i> Modo local (solo acceso desde esta computadora)';
        statusEl.className = connected ? 'firebase-status connected' : 'firebase-status local';
    }
}

// Función para crear examen (modificada para Firebase)
async function createExam() {
    const formData = new FormData(document.getElementById('examForm'));
    const examData = {
        title: formData.get('examTitle'),
        description: formData.get('examDescription'),
        timePerQuestion: parseInt(formData.get('timePerQuestion')),
        questions: [],
        createdAt: new Date().toISOString(),
        results: []
    };
    
    // Recopilar preguntas
    for (let i = 1; i <= questionCount; i++) {
        const questionElement = document.querySelector(`[name="question-${i}"]`);
        if (questionElement && questionElement.value.trim()) {
            const question = {
                numb: i,
                question: questionElement.value.trim(),
                options: [
                    formData.get(`option-${i}-1`),
                    formData.get(`option-${i}-2`),
                    formData.get(`option-${i}-3`),
                    formData.get(`option-${i}-4`)
                ],
                answer: formData.get(`option-${i}-${formData.get(`correct-${i}`)}`)
            };
            examData.questions.push(question);
        }
    }
    
    if (examData.questions.length === 0) {
        alert('Debes agregar al menos una pregunta.');
        return;
    }
    
    // Generar ID único para el examen
    const examId = generateExamId();
    examData.id = examId;
    
    // Mostrar loading
    const createBtn = document.querySelector('#createExamModal .btn-primary');
    if (createBtn) {
        const originalText = createBtn.textContent;
        createBtn.textContent = 'Guardando...';
        createBtn.disabled = true;
    }
    
    try {
        // Guardar examen usando StorageService (Firebase o localStorage)
        if (StorageService) {
            await StorageService.saveExam(examId, examData);
        } else {
            // Fallback directo a localStorage
            saveExam(examId, examData);
        }
        
        // Mostrar enlaces
        showExamLinks(examId);
        
        console.log('✅ Examen creado exitosamente');
    } catch (error) {
        console.error('❌ Error creando examen:', error);
        alert('Error al crear el examen. Por favor, intenta nuevamente.');
    } finally {
        // Restaurar botón
        if (createBtn) {
            createBtn.textContent = 'Crear Examen';
            createBtn.disabled = false;
        }
    }
}

function generateExamId() {
    return 'exam_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

function saveExam(examId, examData) {
    localStorage.setItem(examId, JSON.stringify(examData));
    
    // También guardar en una lista de exámenes
    let examsList = JSON.parse(localStorage.getItem('examsList') || '[]');
    examsList.push({
        id: examId,
        title: examData.title,
        createdAt: examData.createdAt,
        questionsCount: examData.questions.length
    });
    localStorage.setItem('examsList', JSON.stringify(examsList));
}

function showExamLinks(examId) {
    const baseUrl = window.location.origin + window.location.pathname.replace('main.html', '');
    const studentLink = `${baseUrl}exam.html?id=${examId}`;
    const resultsLink = `${baseUrl}results.html?id=${examId}`;
    
    document.getElementById('studentLink').value = studentLink;
    document.getElementById('resultsLink').value = resultsLink;
    
    document.getElementById('examForm').style.display = 'none';
    document.getElementById('examCreated').style.display = 'block';
    
    currentExamId = examId;
}

function copyStudentLink() {
    const linkInput = document.getElementById('studentLink');
    linkInput.select();
    linkInput.setSelectionRange(0, 99999);
    document.execCommand('copy');
    
    // Mostrar feedback visual
    const copyBtn = event.target;
    const originalText = copyBtn.textContent;
    copyBtn.textContent = '¡Copiado!';
    copyBtn.style.background = '#28a745';
    
    setTimeout(() => {
        copyBtn.textContent = originalText;
        copyBtn.style.background = '#28a745';
    }, 2000);
}

function copyResultsLink() {
    const linkInput = document.getElementById('resultsLink');
    linkInput.select();
    linkInput.setSelectionRange(0, 99999);
    document.execCommand('copy');
    
    // Mostrar feedback visual
    const copyBtn = event.target;
    const originalText = copyBtn.textContent;
    copyBtn.textContent = '¡Copiado!';
    copyBtn.style.background = '#28a745';
    
    setTimeout(() => {
        copyBtn.textContent = originalText;
        copyBtn.style.background = '#28a745';
    }, 2000);
}

function loadResults() {
    const examId = document.getElementById('examId').value.trim();
    
    if (!examId) {
        alert('Por favor ingresa un ID de examen válido.');
        return;
    }
    
    const examData = localStorage.getItem(examId);
    
    if (!examData) {
        document.getElementById('resultsContent').innerHTML = `
            <div style="text-align: center; padding: 20px; color: #dc3545;">
                <i class="fas fa-exclamation-triangle" style="font-size: 3rem; margin-bottom: 15px;"></i>
                <h3>Examen no encontrado</h3>
                <p>No se encontró ningún examen con el ID proporcionado.</p>
            </div>
        `;
        return;
    }
    
    const exam = JSON.parse(examData);
    displayResults(exam);
}

function displayResults(exam) {
    const resultsContent = document.getElementById('resultsContent');
    
    if (!exam.results || exam.results.length === 0) {
        resultsContent.innerHTML = `
            <div style="text-align: center; padding: 20px;">
                <i class="fas fa-inbox" style="font-size: 3rem; margin-bottom: 15px; color: #6c757d;"></i>
                <h3>Sin resultados aún</h3>
                <p>Aún no hay estudiantes que hayan completado este examen.</p>
                <p><strong>Título:</strong> ${exam.title}</p>
                <p><strong>Preguntas:</strong> ${exam.questions.length}</p>
                <p><strong>Creado:</strong> ${new Date(exam.createdAt).toLocaleString()}</p>
            </div>
        `;
        return;
    }
    
    // Calcular estadísticas
    const totalStudents = exam.results.length;
    const averageScore = exam.results.reduce((sum, result) => sum + result.score, 0) / totalStudents;
    const maxScore = Math.max(...exam.results.map(r => r.score));
    const minScore = Math.min(...exam.results.map(r => r.score));
    
    let resultsHTML = `
        <div style="margin-bottom: 30px;">
            <h3>${exam.title}</h3>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin: 20px 0;">
                <div style="background: #e3f2fd; padding: 15px; border-radius: 8px; text-align: center;">
                    <h4 style="margin: 0; color: #1976d2;">Total Estudiantes</h4>
                    <p style="font-size: 2rem; margin: 5px 0; font-weight: bold;">${totalStudents}</p>
                </div>
                <div style="background: #e8f5e8; padding: 15px; border-radius: 8px; text-align: center;">
                    <h4 style="margin: 0; color: #388e3c;">Promedio</h4>
                    <p style="font-size: 2rem; margin: 5px 0; font-weight: bold;">${averageScore.toFixed(1)}/${exam.questions.length}</p>
                </div>
                <div style="background: #fff3e0; padding: 15px; border-radius: 8px; text-align: center;">
                    <h4 style="margin: 0; color: #f57c00;">Mejor Puntaje</h4>
                    <p style="font-size: 2rem; margin: 5px 0; font-weight: bold;">${maxScore}/${exam.questions.length}</p>
                </div>
                <div style="background: #ffebee; padding: 15px; border-radius: 8px; text-align: center;">
                    <h4 style="margin: 0; color: #d32f2f;">Menor Puntaje</h4>
                    <p style="font-size: 2rem; margin: 5px 0; font-weight: bold;">${minScore}/${exam.questions.length}</p>
                </div>
            </div>
        </div>
        
        <h4>Resultados Individuales:</h4>
        <div style="max-height: 400px; overflow-y: auto;">
    `;
    
    exam.results.forEach((result, index) => {
        const percentage = (result.score / exam.questions.length * 100).toFixed(1);
        const completedAt = new Date(result.completedAt).toLocaleString();
        
        resultsHTML += `
            <div style="background: #f8f9fa; padding: 15px; margin-bottom: 10px; border-radius: 8px; border-left: 4px solid ${getScoreColor(percentage)};">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <strong>Estudiante ${index + 1}</strong>
                        <p style="margin: 5px 0; color: #666;">Completado: ${completedAt}</p>
                    </div>
                    <div style="text-align: right;">
                        <div style="font-size: 1.5rem; font-weight: bold; color: ${getScoreColor(percentage)};">
                            ${result.score}/${exam.questions.length}
                        </div>
                        <div style="color: #666;">${percentage}%</div>
                    </div>
                </div>
            </div>
        `;
    });
    
    resultsHTML += '</div>';
    
    resultsContent.innerHTML = resultsHTML;
}

function getScoreColor(percentage) {
    if (percentage >= 80) return '#28a745';
    if (percentage >= 60) return '#ffc107';
    return '#dc3545';
}

// Función para guardar resultado de estudiante (será llamada desde exam.html)
function saveStudentResult(examId, score, totalQuestions) {
    const examData = localStorage.getItem(examId);
    
    if (examData) {
        const exam = JSON.parse(examData);
        
        if (!exam.results) {
            exam.results = [];
        }
        
        exam.results.push({
            score: score,
            totalQuestions: totalQuestions,
            completedAt: new Date().toISOString()
        });
        
        localStorage.setItem(examId, JSON.stringify(exam));
    }
}
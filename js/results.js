// Variables globales
let currentExam = null;
let StorageService = null;

// Cargar Firebase
async function loadFirebaseForResults() {
    try {
        const firebaseModule = await import('./firebase-config.js');
        StorageService = firebaseModule.StorageService;
        console.log('🔥 Firebase cargado para resultados');
    } catch (error) {
        console.log('📱 Firebase no disponible, usando localStorage');
        // Crear fallback para localStorage
        StorageService = {
            getExam: (id) => {
                const data = localStorage.getItem(id);
                return Promise.resolve(data ? JSON.parse(data) : null);
            }
        };
    }
}

// Cargar resultados al cargar la página
document.addEventListener('DOMContentLoaded', function() {
    loadResultsFromUrl();
});

async function loadResultsFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    const examId = urlParams.get('id');
    
    if (!examId) {
        showExamNotFound();
        return;
    }
    
    // Cargar Firebase primero
    await loadFirebaseForResults();
    
    try {
        let examData;
        
        if (StorageService) {
            // Intentar cargar desde Firebase/StorageService
            examData = await StorageService.getExam(examId);
        } else {
            // Fallback directo a localStorage
            const data = localStorage.getItem(examId);
            examData = data ? JSON.parse(data) : null;
        }
        
        if (!examData) {
            showExamNotFound();
            return;
        }
        
        currentExam = examData;
        displayResults();
        hideLoading();
        
    } catch (error) {
        console.error('Error loading exam:', error);
        showExamNotFound();
    }
}

function showExamNotFound() {
    document.getElementById('loadingScreen').style.display = 'none';
    document.getElementById('examNotFound').style.display = 'block';
}

function hideLoading() {
    document.getElementById('loadingScreen').style.display = 'none';
    document.getElementById('resultsContent').style.display = 'block';
}

function displayResults() {
    const resultsContent = document.getElementById('resultsContent');
    
    if (!currentExam.results || currentExam.results.length === 0) {
        resultsContent.innerHTML = getNoResultsHTML();
        return;
    }
    
    // Calcular estadísticas
    const stats = calculateStats();
    
    // Generar HTML
    resultsContent.innerHTML = `
        ${getExamInfoHTML()}
        ${getStatsHTML(stats)}
        ${getResultsListHTML()}
        ${getExportSectionHTML()}
    `;
}

function calculateStats() {
    const results = currentExam.results;
    const totalStudents = results.length;
    const scores = results.map(r => r.score);
    const percentages = results.map(r => (r.score / r.totalQuestions) * 100);
    
    const averageScore = scores.reduce((sum, score) => sum + score, 0) / totalStudents;
    const averagePercentage = percentages.reduce((sum, perc) => sum + perc, 0) / totalStudents;
    const maxScore = Math.max(...scores);
    const minScore = Math.min(...scores);
    
    const excellent = percentages.filter(p => p >= 80).length;
    const good = percentages.filter(p => p >= 60 && p < 80).length;
    const poor = percentages.filter(p => p < 60).length;
    
    return {
        totalStudents,
        averageScore: averageScore.toFixed(1),
        averagePercentage: averagePercentage.toFixed(1),
        maxScore,
        minScore,
        excellent,
        good,
        poor
    };
}

function getExamInfoHTML() {
    const createdDate = new Date(currentExam.createdAt).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    
    return `
        <div class="exam-info">
            <h2><i class="fas fa-file-alt"></i> ${currentExam.title}</h2>
            <p><strong>Descripción:</strong> ${currentExam.description || 'Sin descripción'}</p>
            <p><strong>Total de preguntas:</strong> ${currentExam.questions.length}</p>
            <p><strong>Tiempo por pregunta:</strong> ${currentExam.timePerQuestion} segundos</p>
            <p><strong>Creado:</strong> ${createdDate}</p>
        </div>
    `;
}

function getStatsHTML(stats) {
    return `
        <div class="stats-grid">
            <div class="stat-card info">
                <h3><i class="fas fa-users"></i> Total Estudiantes</h3>
                <div class="number">${stats.totalStudents}</div>
            </div>
            <div class="stat-card">
                <h3><i class="fas fa-chart-line"></i> Promedio</h3>
                <div class="number">${stats.averageScore}/${currentExam.questions.length}</div>
                <small>${stats.averagePercentage}%</small>
            </div>
            <div class="stat-card success">
                <h3><i class="fas fa-trophy"></i> Mejor Puntaje</h3>
                <div class="number">${stats.maxScore}/${currentExam.questions.length}</div>
                <small>${((stats.maxScore / currentExam.questions.length) * 100).toFixed(1)}%</small>
            </div>
            <div class="stat-card warning">
                <h3><i class="fas fa-chart-bar"></i> Menor Puntaje</h3>
                <div class="number">${stats.minScore}/${currentExam.questions.length}</div>
                <small>${((stats.minScore / currentExam.questions.length) * 100).toFixed(1)}%</small>
            </div>
        </div>
        
        <div class="stats-grid">
            <div class="stat-card success">
                <h3><i class="fas fa-star"></i> Excelente (≥80%)</h3>
                <div class="number">${stats.excellent}</div>
                <small>${((stats.excellent / stats.totalStudents) * 100).toFixed(1)}% del total</small>
            </div>
            <div class="stat-card warning">
                <h3><i class="fas fa-thumbs-up"></i> Bueno (60-79%)</h3>
                <div class="number">${stats.good}</div>
                <small>${((stats.good / stats.totalStudents) * 100).toFixed(1)}% del total</small>
            </div>
            <div class="stat-card">
                <h3><i class="fas fa-thumbs-down"></i> Necesita Mejorar (<60%)</h3>
                <div class="number">${stats.poor}</div>
                <small>${((stats.poor / stats.totalStudents) * 100).toFixed(1)}% del total</small>
            </div>
        </div>
    `;
}

function getResultsListHTML() {
    let html = `
        <div class="results-section">
            <h3><i class="fas fa-list"></i> Resultados Individuales</h3>
    `;
    
    currentExam.results.forEach((result, index) => {
        const percentage = (result.score / result.totalQuestions * 100).toFixed(1);
        const completedDate = new Date(result.completedAt).toLocaleString('es-ES');
        const scoreClass = getScoreClass(percentage);
        const studentNumber = index + 1;
        
        html += `
            <div class="result-item">
                <div class="result-header">
                    <div class="student-info">
                        <div class="student-avatar">${studentNumber}</div>
                        <div>
                            <strong>${result.studentName || `Estudiante ${studentNumber}`}</strong>
                            <br>
                            <small style="color: #6c757d;">
                                <i class="fas fa-clock"></i> ${completedDate}
                            </small>
                        </div>
                    </div>
                    <div class="score-badge ${scoreClass}">
                        ${result.score}/${result.totalQuestions} (${percentage}%)
                    </div>
                </div>
                <div style="margin-top: 10px;">
                    <div style="background: #e9ecef; border-radius: 10px; height: 8px; overflow: hidden;">
                        <div style="background: ${getScoreColor(percentage)}; height: 100%; width: ${percentage}%; transition: width 0.3s ease;"></div>
                    </div>
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    return html;
}

function getNoResultsHTML() {
    const createdDate = new Date(currentExam.createdAt).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    
    return `
        ${getExamInfoHTML()}
        <div class="no-results">
            <i class="fas fa-inbox"></i>
            <h3>Sin resultados aún</h3>
            <p>Aún no hay estudiantes que hayan completado este examen.</p>
            <p style="margin-top: 20px; color: #495057;">
                Comparte el enlace del examen con tus estudiantes para que puedan realizarlo.
            </p>
        </div>
        ${getExportSectionHTML()}
    `;
}

function getExportSectionHTML() {
    return `
        <div class="export-section">
            <h4><i class="fas fa-download"></i> Exportar Resultados</h4>
            <p style="margin-bottom: 15px;">Descarga los resultados en diferentes formatos</p>
            <button class="btn" onclick="exportToCSV()" style="margin: 5px;">
                <i class="fas fa-file-csv"></i> Exportar CSV
            </button>
            <button class="btn" onclick="exportToPDF()" style="margin: 5px;">
                <i class="fas fa-file-pdf"></i> Exportar PDF
            </button>
            <button class="btn" onclick="printResults()" style="margin: 5px;">
                <i class="fas fa-print"></i> Imprimir
            </button>
        </div>
    `;
}

function getScoreClass(percentage) {
    if (percentage >= 80) return 'score-excellent';
    if (percentage >= 60) return 'score-good';
    return 'score-poor';
}

function getScoreColor(percentage) {
    if (percentage >= 80) return '#28a745';
    if (percentage >= 60) return '#ffc107';
    return '#dc3545';
}

function exportToCSV() {
    if (!currentExam.results || currentExam.results.length === 0) {
        alert('No hay resultados para exportar.');
        return;
    }
    
    let csv = 'Nombre,Puntaje,Total Preguntas,Porcentaje,Fecha Completado\n';
    
    currentExam.results.forEach((result, index) => {
        const percentage = (result.score / result.totalQuestions * 100).toFixed(1);
        const completedDate = new Date(result.completedAt).toLocaleString('es-ES');
        const studentName = result.studentName || `Estudiante ${index + 1}`;
        
        csv += `"${studentName}",${result.score},${result.totalQuestions},${percentage}%,"${completedDate}"\n`;
    });
    
    downloadFile(csv, `resultados_${currentExam.title.replace(/[^a-zA-Z0-9]/g, '_')}.csv`, 'text/csv');
}

function exportToPDF() {
    alert('Funcionalidad de exportar PDF estará disponible próximamente.');
}

function printResults() {
    window.print();
}

function downloadFile(content, fileName, contentType) {
    const blob = new Blob([content], { type: contentType });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
}

// Función para refrescar resultados
function refreshResults() {
    loadResultsFromUrl();
}

// Auto-refresh cada 30 segundos
setInterval(refreshResults, 30000);
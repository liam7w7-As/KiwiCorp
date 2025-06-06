// Variables globales
let currentExam = null;
let questions = [];
let timeValue = 15;
let que_count = 0;
let que_numb = 1;
let userScore = 0;
let counter;
let counterLine;
let widthValue = 0;

// Elementos del DOM
const info_box = document.querySelector(".info_box");
const quiz_box = document.querySelector(".quiz_box");
const result_box = document.querySelector(".result_box");
const option_list = document.querySelector(".option_list");
const time_line = document.querySelector("header .time_line");
const timeText = document.querySelector(".timer .time_left_txt");
const timeCount = document.querySelector(".timer .timer_sec");
const next_btn = document.querySelector("footer .next_btn");
const bottom_ques_counter = document.querySelector("footer .total_que");

// Cargar examen al cargar la página
document.addEventListener('DOMContentLoaded', function() {
    loadExamFromUrl();
});

// Importar Firebase dinámicamente
let StorageService = null;

// Cargar Firebase
async function loadFirebaseForExam() {
    try {
        const firebaseModule = await import('./firebase-config.js');
        StorageService = firebaseModule.StorageService;
        console.log('🔥 Firebase cargado para examen');
    } catch (error) {
        console.log('📱 Firebase no disponible, usando localStorage');
        // Crear fallback para localStorage
        StorageService = {
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

// Cargar examen desde URL (modificado para Firebase)
async function loadExamFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    const examId = urlParams.get('id');
    
    if (!examId) {
        showExamNotFound();
        return;
    }
    
    // Cargar Firebase primero
    await loadFirebaseForExam();
    
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
        questions = currentExam.questions;
        timeValue = currentExam.timePerQuestion || 15;
        
        displayExamInfo();
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
    document.getElementById('examContent').style.display = 'block';
}

function displayExamInfo() {
    document.getElementById('examTitle').textContent = currentExam.title;
    document.getElementById('examDescription').textContent = currentExam.description || '';
    document.getElementById('totalQuestions').textContent = questions.length;
    document.getElementById('timePerQuestion').textContent = timeValue;
    document.getElementById('ruleTime').textContent = timeValue + ' segundos';
    document.getElementById('quizTitle').textContent = currentExam.title;
    
    // Actualizar el tiempo en el timer
    if (timeCount) {
        timeCount.textContent = timeValue;
    }
}

function startExam() {
    const studentName = document.getElementById('studentName').value.trim();
    
    if (!studentName) {
        alert('Por favor, ingresa tu nombre completo antes de iniciar el examen.');
        document.getElementById('studentName').focus();
        return;
    }
    
    // Guardar el nombre del estudiante
    window.currentStudentName = studentName;
    
    if (info_box) {
        info_box.classList.add("activeInfo");
    }
}

function cancelExam() {
    if (info_box) {
        info_box.classList.remove("activeInfo");
    }
}

function continueExam() {
    if (info_box) {
        info_box.classList.remove("activeInfo");
    }
    if (quiz_box) {
        quiz_box.classList.add("activeQuiz");
    }
    
    // Resetear variables
    que_count = 0;
    que_numb = 1;
    userScore = 0;
    widthValue = 0;
    
    showQuestions(0);
    queCounter(1);
    startTimer(timeValue);
    startTimerLine(0);
}

function retakeExam() {
    if (result_box) {
        result_box.classList.remove("activeResult");
    }
    if (quiz_box) {
        quiz_box.classList.add("activeQuiz");
    }
    
    // Resetear variables
    que_count = 0;
    que_numb = 1;
    userScore = 0;
    widthValue = 0;
    
    showQuestions(0);
    queCounter(1);
    clearInterval(counter);
    clearInterval(counterLine);
    startTimer(timeValue);
    startTimerLine(0);
    
    if (timeText) {
        timeText.textContent = "Tiempo Restante";
    }
    if (next_btn) {
        next_btn.classList.remove("show");
    }
}

function exitExam() {
    window.close();
    // Si no se puede cerrar la ventana, redirigir
    setTimeout(() => {
        window.location.href = 'main.html';
    }, 100);
}

// Event listener para el botón siguiente
if (next_btn) {
    next_btn.onclick = () => {
        if (que_count < questions.length - 1) {
            que_count++;
            que_numb++;
            showQuestions(que_count);
            queCounter(que_numb);
            clearInterval(counter);
            clearInterval(counterLine);
            startTimer(timeValue);
            startTimerLine(widthValue);
            if (timeText) {
                timeText.textContent = "Tiempo Restante";
            }
            next_btn.classList.remove("show");
        } else {
            clearInterval(counter);
            clearInterval(counterLine);
            showResult();
        }
    };
}

function showQuestions(index) {
    const que_text = document.querySelector(".que_text");
    
    if (!que_text || !questions[index]) return;
    
    let que_tag = '<span>' + questions[index].numb + ". " + questions[index].question + '</span>';
    let option_tag = '<div class="option"><span>' + questions[index].options[0] + '</span></div>'
        + '<div class="option"><span>' + questions[index].options[1] + '</span></div>'
        + '<div class="option"><span>' + questions[index].options[2] + '</span></div>'
        + '<div class="option"><span>' + questions[index].options[3] + '</span></div>';
    
    que_text.innerHTML = que_tag;
    if (option_list) {
        option_list.innerHTML = option_tag;
        
        const option = option_list.querySelectorAll(".option");
        for (let i = 0; i < option.length; i++) {
            option[i].setAttribute("onclick", "optionSelected(this)");
        }
    }
}

let tickIconTag = '<div class="icon tick"><i class="fas fa-check"></i></div>';
let crossIconTag = '<div class="icon cross"><i class="fas fa-times"></i></div>';

function optionSelected(answer) {
    clearInterval(counter);
    clearInterval(counterLine);
    
    let userAns = answer.textContent;
    let correctAns = questions[que_count].answer;
    const allOptions = option_list.children.length;
    
    if (userAns == correctAns) {
        userScore += 1;
        answer.classList.add("correct");
        answer.insertAdjacentHTML("beforeend", tickIconTag);
        console.log("Respuesta Correcta");
        console.log("Tus respuestas correctas = " + userScore);
    } else {
        answer.classList.add("incorrect");
        answer.insertAdjacentHTML("beforeend", crossIconTag);
        console.log("Respuesta Incorrecta");
        
        for (let i = 0; i < allOptions; i++) {
            if (option_list.children[i].textContent == correctAns) {
                option_list.children[i].setAttribute("class", "option correct");
                option_list.children[i].insertAdjacentHTML("beforeend", tickIconTag);
                console.log("Respuesta correcta seleccionada automáticamente.");
            }
        }
    }
    
    for (let i = 0; i < allOptions; i++) {
        option_list.children[i].classList.add("disabled");
    }
    
    if (next_btn) {
        next_btn.classList.add("show");
    }
}

function showResult() {
    if (info_box) info_box.classList.remove("activeInfo");
    if (quiz_box) quiz_box.classList.remove("activeQuiz");
    if (result_box) result_box.classList.add("activeResult");
    
    const scoreText = result_box.querySelector(".score_text");
    
    if (scoreText) {
        let scoreTag;
        const percentage = (userScore / questions.length) * 100;
        
        if (percentage >= 80) {
            scoreTag = '<span>¡Felicitaciones! 🎉, Conseguiste <p>' + userScore + '</p> de <p>' + questions.length + '</p></span>';
        } else if (percentage >= 60) {
            scoreTag = '<span>¡Que bien! 😎, Conseguiste <p>' + userScore + '</p> de <p>' + questions.length + '</p></span>';
        } else {
            scoreTag = '<span>Lo siento 😐, Solo conseguiste <p>' + userScore + '</p> de <p>' + questions.length + '</p></span>';
        }
        
        scoreText.innerHTML = scoreTag;
    }
    
    // Guardar resultado
    saveResult();
}

async function saveResult() {
    const urlParams = new URLSearchParams(window.location.search);
    const examId = urlParams.get('id');
    
    if (!examId) return;
    
    // Crear objeto de resultado
    const result = {
        score: userScore,
        totalQuestions: questions.length,
        completedAt: new Date().toISOString(),
        percentage: Math.round((userScore / questions.length) * 100),
        studentName: window.currentStudentName || 'Estudiante Anónimo'
    };
    
    try {
        if (StorageService && StorageService.saveStudentResult) {
            // Usar Firebase/StorageService
            await StorageService.saveStudentResult(examId, result);
            console.log('✅ Resultado guardado exitosamente');
        } else {
            // Fallback a localStorage
            const examData = localStorage.getItem(examId);
            if (examData) {
                const exam = JSON.parse(examData);
                if (!exam.results) exam.results = [];
                exam.results.push(result);
                localStorage.setItem(examId, JSON.stringify(exam));
            }
        }
    } catch (error) {
        console.error('❌ Error guardando resultado:', error);
        // Intentar guardar en localStorage como último recurso
        try {
            const examData = localStorage.getItem(examId);
            if (examData) {
                const exam = JSON.parse(examData);
                if (!exam.results) exam.results = [];
                exam.results.push(result);
                localStorage.setItem(examId, JSON.stringify(exam));
                console.log('📱 Resultado guardado en localStorage como respaldo');
            }
        } catch (fallbackError) {
            console.error('❌ Error en respaldo localStorage:', fallbackError);
        }
    }
}

function startTimer(time) {
    counter = setInterval(timer, 1000);
    function timer() {
        if (timeCount) {
            timeCount.textContent = time;
        }
        time--;
        
        if (time < 9) {
            let addZero = timeCount ? timeCount.textContent : '0';
            if (timeCount) {
                timeCount.textContent = "0" + addZero;
            }
        }
        
        if (time < 0) {
            clearInterval(counter);
            if (timeText) {
                timeText.textContent = "Finalizó Tiempo";
            }
            
            const allOptions = option_list ? option_list.children.length : 0;
            let correctAns = questions[que_count].answer;
            
            for (let i = 0; i < allOptions; i++) {
                if (option_list.children[i].textContent == correctAns) {
                    option_list.children[i].setAttribute("class", "option correct");
                    option_list.children[i].insertAdjacentHTML("beforeend", tickIconTag);
                    console.log("Time Off: Auto selected correct answer.");
                }
            }
            
            for (let i = 0; i < allOptions; i++) {
                option_list.children[i].classList.add("disabled");
            }
            
            if (next_btn) {
                next_btn.classList.add("show");
            }
        }
    }
}

function startTimerLine(time) {
    counterLine = setInterval(timer, 29);
    function timer() {
        time += 1;
        if (time_line) {
            time_line.style.width = time + "px";
        }
        if (time > 549) {
            clearInterval(counterLine);
        }
    }
}

function queCounter(index) {
    if (bottom_ques_counter) {
        let totalQueCounTag = '<span><p>' + index + '</p> de <p>' + questions.length + '</p> Preguntas</span>';
        bottom_ques_counter.innerHTML = totalQueCounTag;
    }
}
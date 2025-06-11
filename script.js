let questions = [];
let currentIndex = 0;
let user = null;
let userData = {};

async function loadQuestions() {
    const res = await fetch('questions.json');
    questions = await res.json();
}

function loadUser() {
    const name = document.getElementById('username').value.trim();
    if (!name) return;
    user = name;
    const saved = localStorage.getItem('user_' + user);
    userData = saved ? JSON.parse(saved) : { correct: 0, doubtful: 0, total: 0, badges: [] };
    document.getElementById('login-screen').classList.add('hidden');
    document.getElementById('quiz-screen').classList.remove('hidden');
    document.getElementById('open-ref').classList.remove('hidden');
    showQuestion();
    updateProgress();
}

function saveUser() {
    localStorage.setItem('user_' + user, JSON.stringify(userData));
}

function showQuestion() {
    if (currentIndex >= questions.length) currentIndex = 0;
    const q = questions[currentIndex];
    const container = document.getElementById('question-container');
    container.innerHTML = '';
    let html = `<p>${q.question}</p>`;
    if (q.image) {
        html += `<img src="${q.image}" alt="imagen" width="80" />`;
    }
    switch (q.type) {
        case 'multiple':
            q.options.forEach((opt, i) => {
                html += `<div><label><input type="radio" name="option" value="${i}"> ${opt}</label></div>`;
            });
            break;
        case 'truefalse':
            html += `<div><label><input type="radio" name="option" value="true"> Verdadero</label></div>`;
            html += `<div><label><input type="radio" name="option" value="false"> Falso</label></div>`;
            break;
        case 'fillblank':
            html += `<input type="text" id="answer" />`;
            break;
        case 'short':
            html += `<input type="text" id="answer" />`;
            break;
        case 'match':
            q.pairs.forEach((p, idx) => {
                html += `<div>${p.left} <select data-index="${idx}">` +
                    q.pairs.map((_, i) => `<option value="${i}">${q.pairs[i].right}</option>`).join('') +
                    `</select></div>`;
            });
            break;
    }
    container.innerHTML = html;
    document.getElementById('feedback').classList.add('hidden');
}

function checkAnswer() {
    const q = questions[currentIndex];
    let correct = false;
    if (q.type === 'multiple' || q.type === 'truefalse') {
        const selected = document.querySelector('input[name="option"]:checked');
        if (!selected) return;
        correct = String(selected.value) === String(q.answer);
    } else if (q.type === 'fillblank' || q.type === 'short') {
        const ans = document.getElementById('answer').value.trim().toLowerCase();
        correct = ans === q.answer.toLowerCase();
    } else if (q.type === 'match') {
        correct = true;
        q.pairs.forEach((p, idx) => {
            const sel = document.querySelector(`select[data-index="${idx}"]`);
            if (Number(sel.value) !== idx) correct = false;
        });
    }

    if (correct) {
        userData.correct++;
        showFeedback(true, q.explanation);
    } else {
        showFeedback(false, q.explanation);
    }
    userData.total++;
    if (userData.correct % 5 === 0 && !userData.badges.includes(userData.correct)) {
        userData.badges.push(userData.correct);
        alert('¡Ganaste una medalla por ' + userData.correct + ' respuestas correctas!');
    }
    saveUser();
    currentIndex++;
    updateProgress();
    setTimeout(showQuestion, 1000);
}

function skipQuestion() {
    userData.doubtful++;
    saveUser();
    currentIndex++;
    updateProgress();
    showQuestion();
}

function showFeedback(isCorrect, explanation) {
    const feedback = document.getElementById('feedback');
    feedback.classList.remove('hidden');
    feedback.className = isCorrect ? 'correct' : 'incorrect';
    const msg = isCorrect ? '¡Muy bien! Mario está orgulloso.' : 'Ups, seguí practicando con Luigi.';
    feedback.innerText = msg + ' ' + explanation;
}

function updateProgress() {
    const prog = document.getElementById('progress');
    const percent = userData.total ? Math.round((userData.correct / userData.total) * 100) : 0;
    prog.innerHTML = `<div id="progress-bar"><div id="progress-fill" style="width:${percent}%"></div></div>` +
        `<p>Correctas: ${userData.correct} / Total: ${userData.total}</p>`;
    if (userData.badges.length) {
        prog.innerHTML += '<div>Medallas: ' + userData.badges.map(b => `<span class="badge">${b}</span>`).join('') + '</div>';
    }
}

document.getElementById('start-btn').addEventListener('click', loadUser);
document.getElementById('submit-btn').addEventListener('click', checkAnswer);
document.getElementById('skip-btn').addEventListener('click', skipQuestion);
document.getElementById('open-ref').addEventListener('click', () => document.getElementById('reference').classList.remove('hidden'));
document.getElementById('close-ref').addEventListener('click', () => document.getElementById('reference').classList.add('hidden'));

loadQuestions();

if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js');
}

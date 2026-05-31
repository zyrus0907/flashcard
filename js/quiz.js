// ---- Quiz tab ----

function renderQuizStart() {
  const el = document.getElementById('quizContent');
  if (history.length < 4) {
    el.innerHTML = `<div class="quiz-start">
      <span style="font-size:3rem">🎯</span>
      <p>請先生成至少 4 個單字才能開始測驗！<br>Generate at least 4 words to start a quiz.</p>
      <p style="color:#ddd">目前 ${history.length}/4 個單字</p>
    </div>`;
    return;
  }
  el.innerHTML = `<div class="quiz-start">
    <span style="font-size:3rem">🎯</span>
    <p>用學過的 <strong style="color:#e07b39">${history.length}</strong> 個單字來測驗！<br>Quiz yourself on your <strong style="color:#e07b39">${history.length}</strong> learned words!</p>
    <button class="big-btn" onclick="startQuiz('zh')">中文選義 Chinese Meaning</button>
    <button class="big-btn outline" onclick="startQuiz('en')">英文演字 Spell the Word</button>
  </div>`;
}

function startQuiz(type) {
  const shuffled = [...history].sort(() => Math.random() - .5);
  const questions = shuffled.slice(0, Math.min(10, shuffled.length)).map(q => {
    const wrong = history.filter(h => h.word !== q.word).sort(() => Math.random() - .5).slice(0, 3);
    const opts = [...wrong, q].sort(() => Math.random() - .5);
    return { q, opts, type };
  });
  quizState = { questions, idx: 0, score: 0 };
  renderQuizQuestion();
}

function renderQuizQuestion() {
  const { questions, idx } = quizState;
  if (idx >= questions.length) { renderQuizResult(); return; }

  const { q, opts, type } = questions[idx];
  const el = document.getElementById('quizContent');

  const prompt = type === 'zh'
    ? `<div class="quiz-q-emoji">${q.emoji}</div><div class="quiz-q-word">${q.word}</div><div class="quiz-q-sub">${q.phonetic || ''}</div>`
    : `<div class="quiz-q-emoji">${q.emoji}</div><div class="quiz-q-word" style="font-size:1.4rem">${q.zh}</div><div class="quiz-q-sub">${q.pos}</div>`;

  const optHTML = opts.map(o => {
    const label = type === 'zh' ? o.zh : o.word;
    const val = type === 'zh' ? o.zh : o.word;
    const correct = type === 'zh' ? q.zh : q.word;
    return `<button class="quiz-opt" onclick="answerQuiz(this,'${esc(val)}','${esc(correct)}')">${label}</button>`;
  }).join('');

  el.innerHTML = `<div class="quiz-box">
    <div class="quiz-progress">${idx + 1} / ${questions.length}</div>
    <div class="quiz-question">
      <div class="quiz-q-label">${type === 'zh' ? '這個單字是什麼意思？What does it mean?' : '哪個是正確的英文單字？Which is the correct word?'}</div>
      ${prompt}
    </div>
    <div class="quiz-options">${optHTML}</div>
  </div>`;
}

function answerQuiz(btn, val, correct) {
  const opts = document.querySelectorAll('.quiz-opt');
  opts.forEach(o => {
    o.disabled = true;
    if (o.textContent.trim() === correct) o.classList.add('correct');
    else if (o === btn && val !== correct) o.classList.add('wrong');
  });
  if (val === correct) quizState.score++;
  setTimeout(() => { quizState.idx++; renderQuizQuestion(); }, 900);
}

function renderQuizResult() {
  const { score, questions } = quizState;
  const pct = Math.round(score / questions.length * 100);
  const msg = pct === 100 ? '🎉 完美！Perfect score!'
    : pct >= 70 ? '👍 很棒！Great job!'
    : pct >= 40 ? '💪 繼續加油！Keep it up!'
    : '📚 多練習！Keep practicing!';

  document.getElementById('quizContent').innerHTML = `<div class="quiz-result">
    <div class="quiz-score">${score}<span> / ${questions.length}</span></div>
    <div style="font-size:1.5rem">${pct === 100 ? '🏆' : pct >= 70 ? '😊' : pct >= 40 ? '😐' : '😅'}</div>
    <div class="quiz-feedback">${msg}</div>
    <button class="big-btn" onclick="startQuiz('zh')">再玩一次 Play Again</button>
    <button class="big-btn outline" onclick="renderQuizStart()">換模式 Change Mode</button>
  </div>`;
}

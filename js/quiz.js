// ---- Quiz tab (spaced repetition + streaks + rewards) ----

// Reusable progress bar (mastered words / total)
function progressBarHTML() {
  const { mastered, total } = getProgress();
  const pct = total ? Math.round(mastered / total * 100) : 0;
  return `<div class="progress-wrap">
    <div class="progress-label">已學會 Learned <strong>${mastered}</strong> / ${total}</div>
    <div class="progress-track"><div class="progress-fill" style="width:${pct}%"></div></div>
  </div>`;
}

function renderQuizStart() {
  const el = document.getElementById('quizContent');
  if (history.length < 4) {
    el.innerHTML = `<div class="quiz-start">
      <span style="font-size:3rem">🎯</span>
      <p>請先生成至少 4 個單字才能開始測驗！<br>Generate at least 4 words to start a quiz.</p>
      <p class="quiz-count">目前 Currently ${history.length}/4 個單字</p>
    </div>`;
    return;
  }
  const best = appStats.bestStreak || 0;
  el.innerHTML = `<div class="quiz-start">
    <span style="font-size:3rem">🎯</span>
    ${progressBarHTML()}
    <p>用學過的 <strong style="color:var(--accent)">${history.length}</strong> 個單字來測驗！<br>Quiz yourself on your <strong style="color:var(--accent)">${history.length}</strong> words!</p>
    ${best ? `<div class="best-streak">🔥 最佳連續答對 Best streak: <strong>${best}</strong></div>` : ''}
    <button class="big-btn" onclick="startQuiz('zh')">中文選義 Chinese Meaning</button>
    <button class="big-btn outline" onclick="startQuiz('en')">英文拼字 Spell the Word</button>
  </div>`;
}

// Pick words that need practice most (unseen + recently-wrong first)
function pickQuizWords(n) {
  return [...history]
    .sort((a, b) => reviewScore(b) - reviewScore(a))
    .slice(0, Math.min(n, history.length));
}

function buildQuestion(q, type) {
  const wrong = history.filter(h => h.word !== q.word).sort(() => Math.random() - .5).slice(0, 3);
  const opts = [...wrong, q].sort(() => Math.random() - .5);
  return { q, opts, type };
}

function startQuiz(type) {
  const questions = pickQuizWords(10).map(q => buildQuestion(q, type));
  quizState = { questions, idx: 0, score: 0, streak: 0 };
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
    <div class="quiz-topbar">
      <div class="streak-chip" id="streakChip">🔥 <span id="streakNum">${quizState.streak}</span></div>
      <div class="quiz-progress">${idx + 1} / ${questions.length}</div>
    </div>
    <div class="quiz-question">
      <div class="quiz-q-label">${type === 'zh' ? '這個單字是什麼意思？What does it mean?' : '哪個是正確的英文單字？Which is the correct word?'}</div>
      ${prompt}
    </div>
    <div class="quiz-options">${optHTML}</div>
  </div>`;
}

// Re-show a missed word later in the same session (spaced repetition within a quiz)
function requeueWord(cur) {
  if (cur._requeued) return;
  cur._requeued = true;
  const copy = { q: cur.q, opts: cur.opts, type: cur.type, _requeued: true };
  const at = Math.min(quizState.questions.length, quizState.idx + 3);
  quizState.questions.splice(at, 0, copy);
}

function floatReward() {
  const box = document.querySelector('.quiz-box');
  if (!box) return;
  const star = document.createElement('div');
  star.className = 'reward-float';
  star.textContent = ['⭐', '🌟', '✨', '🎉'][Math.floor(Math.random() * 4)];
  box.appendChild(star);
  setTimeout(() => star.remove(), 1000);
}

function answerQuiz(btn, val, correct) {
  const cur = quizState.questions[quizState.idx];
  const right = val === correct;

  // 1. Update this word's spaced-repetition stats
  const s = ensureStats(cur.q);
  s.seen++;
  if (right) { s.correct++; s.lastResult = 'correct'; }
  else { s.wrong++; s.lastResult = 'wrong'; }
  saveHistory();

  // 2. Update streak + global stats
  if (right) {
    quizState.score++;
    quizState.streak++;
    if (quizState.streak > (appStats.bestStreak || 0)) appStats.bestStreak = quizState.streak;
  } else {
    quizState.streak = 0;
    requeueWord(cur);
  }
  appStats.totalAnswered = (appStats.totalAnswered || 0) + 1;
  if (right) appStats.totalCorrect = (appStats.totalCorrect || 0) + 1;
  saveStats();

  // 3. Mark the options
  document.querySelectorAll('.quiz-opt').forEach(o => {
    o.disabled = true;
    if (o.textContent.trim() === correct) o.classList.add('correct');
    else if (o === btn && !right) o.classList.add('wrong');
  });

  // 4. Reward feedback
  if (right) {
    const chip = document.getElementById('streakChip');
    const num = document.getElementById('streakNum');
    if (num) num.textContent = quizState.streak;
    if (chip) { chip.classList.remove('pop'); void chip.offsetWidth; chip.classList.add('pop'); }
    if (quizState.streak >= 3) floatReward();
  }

  setTimeout(() => { quizState.idx++; renderQuizQuestion(); }, 950);
}

function renderQuizResult() {
  const { score, questions } = quizState;
  const total = questions.length;
  const pct = Math.round(score / total * 100);
  const msg = pct === 100 ? '🎉 完美！Perfect score!'
    : pct >= 70 ? '👍 很棒！Great job!'
    : pct >= 40 ? '💪 繼續加油！Keep it up!'
    : '📚 多練習！Keep practicing!';
  const best = appStats.bestStreak || 0;

  document.getElementById('quizContent').innerHTML = `<div class="quiz-result">
    ${pct >= 70 ? '<div class="confetti">🎉</div>' : ''}
    <div class="quiz-score">${score}<span> / ${total}</span></div>
    <div style="font-size:1.5rem">${pct === 100 ? '🏆' : pct >= 70 ? '😊' : pct >= 40 ? '😐' : '😅'}</div>
    <div class="quiz-feedback">${msg}</div>
    <div class="best-streak">🔥 最佳連續答對 Best streak: <strong>${best}</strong></div>
    ${progressBarHTML()}
    <button class="big-btn" onclick="startQuiz('zh')">再玩一次 Play Again</button>
    <button class="big-btn outline" onclick="renderQuizStart()">換模式 Change Mode</button>
  </div>`;
}

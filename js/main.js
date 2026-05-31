// Shared state
let history = JSON.parse(localStorage.getItem('fc_history') || '[]');
let flipped = false;
let quizState = null;

// ---- Utilities ----
function speak(text) {
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'en-US';
  u.rate = 0.85;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(u);
}

function esc(s) {
  return (s || '').replace(/'/g, "\\'").replace(/"/g, '&quot;');
}

function saveHistory() {
  localStorage.setItem('fc_history', JSON.stringify(history));
}

// ---- Tab switching ----
function switchTab(name) {
  const tabNames = ['flashcard', 'history', 'quiz'];
  document.querySelectorAll('.tab').forEach((t, i) =>
    t.classList.toggle('active', tabNames[i] === name)
  );
  document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
  document.getElementById('panel-' + name).classList.add('active');
  if (name === 'history') renderHistory();
  if (name === 'quiz') renderQuizStart();
}

// ---- Init ----
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('wordInput').addEventListener('keydown', e => {
    if (e.key === 'Enter') generate();
  });
});

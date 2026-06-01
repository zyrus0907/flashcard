// Shared state
let history = JSON.parse(localStorage.getItem('fc_history') || '[]');
let flipped = false;
let quizState = null;
let currentCard = null; // the card currently shown on the flashcard tab

// Global learning stats (for streak / progress / rewards)
let appStats = JSON.parse(localStorage.getItem('fc_stats') || '{}');
function saveStats() {
  localStorage.setItem('fc_stats', JSON.stringify(appStats));
}

// ---- Spaced repetition + progress helpers ----
// Each word in history gets a stats object: { correct, wrong, seen, lastResult }
function ensureStats(d) {
  if (!d.stats) d.stats = { correct: 0, wrong: 0, seen: 0, lastResult: null };
  return d.stats;
}

// Higher score = needs practice more (unseen and recently-wrong words rank first).
function reviewScore(d) {
  const s = ensureStats(d);
  if (s.seen === 0) return 1000 + Math.random() * 10;     // brand-new words first
  return (s.wrong * 2 - s.correct) * 10                    // weak words first
    + (s.lastResult === 'wrong' ? 15 : 0)                  // missed last time -> sooner
    + Math.random() * 8;                                   // a little variety
}

// A word counts as "mastered" once answered right a couple of times, net positive.
function isMastered(d) {
  const s = ensureStats(d);
  return s.correct >= 2 && s.correct > s.wrong;
}

function getProgress() {
  return { mastered: history.filter(isMastered).length, total: history.length };
}

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

// ---- Theme (dark / light) ----
function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('fc_theme', theme);
  const btn = document.getElementById('themeToggle');
  if (btn) btn.textContent = theme === 'dark' ? '☀️' : '🌙';
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') || 'light';
  applyTheme(current === 'dark' ? 'light' : 'dark');
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
  // Sync the toggle icon with the theme set by the inline head script.
  const theme = document.documentElement.getAttribute('data-theme') || 'light';
  const btn = document.getElementById('themeToggle');
  if (btn) btn.textContent = theme === 'dark' ? '☀️' : '🌙';

  document.getElementById('wordInput').addEventListener('keydown', e => {
    if (e.key === 'Enter') generate();
  });
});

// ---- History tab ----

function renderHistory() {
  const el = document.getElementById('historyContent');
  if (!history.length) {
    el.innerHTML = `<div class="history-empty">📭 這裡沒有單字記錄<br>No words yet — generate some flashcards!</div>`;
    return;
  }
  el.innerHTML = `
    <div class="history-grid">
      ${history.map((d, i) => `
        <div class="hist-card" onclick="loadFromHistory(${i})">
          <div class="hist-emoji">${d.emoji}</div>
          <div class="hist-word">${d.word}</div>
          <div class="hist-zh">${d.zh}</div>
          <div class="hist-pos">${d.pos}</div>
          <button class="hist-del" title="刪除" onclick="event.stopPropagation();deleteHistory(${i})">✕</button>
        </div>`).join('')}
    </div>
    <button class="clear-btn" onclick="clearHistory()">🗑 清除全部 Clear All</button>`;
}

function loadFromHistory(i) {
  switchTab('flashcard');
  renderCard(history[i]);
  document.getElementById('flipHint').style.display = 'block';
  document.getElementById('wordInput').value = history[i].word;
}

function deleteHistory(i) {
  history.splice(i, 1);
  saveHistory();
  renderHistory();
}

function clearHistory() {
  if (confirm('清除所有單字記錄？Clear all history?')) {
    history = [];
    saveHistory();
    renderHistory();
  }
}

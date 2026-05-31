// ---- Flashcard tab ----

// Replace with your Anthropic API key (never commit this to a public repo)
const API_KEY = 'YOUR_API_KEY_HERE';

async function generate() {
  const input = document.getElementById('wordInput');
  const btn = document.getElementById('generateBtn');
  const container = document.getElementById('cardContainer');
  const hint = document.getElementById('flipHint');
  const errMsg = document.getElementById('errorMsg');

  const word = input.value.trim();
  if (!word) return;

  btn.disabled = true;
  errMsg.textContent = '';
  hint.style.display = 'none';
  flipped = false;
  container.innerHTML = `<div class="loading"><div class="spinner"></div><span>生成中 Generating…</span></div>`;

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        system: `You are an English vocabulary assistant for parent-child learning. Given an English word, return ONLY a valid JSON object with no extra text or markdown. Fields:
- word: the word (string, lowercase)
- phonetic: IPA phonetic transcription (string)
- pos: part of speech bilingual e.g. "n. 名詞"
- zh: Chinese translation (繁體中文, 1-4 chars)
- emoji: single relevant emoji
- example_en: simple child-friendly example sentence
- example_zh: Chinese translation of example sentence (繁體中文)`,
        messages: [{ role: 'user', content: `Word: ${word}` }],
      }),
    });

    const data = await res.json();
    if (data.error) throw new Error(data.error.message);

    const text = data.content.map(b => b.text || '').join('');
    const d = JSON.parse(text.replace(/```json|```/g, '').trim());

    if (!history.find(h => h.word.toLowerCase() === d.word.toLowerCase())) {
      history.unshift(d);
      if (history.length > 50) history.pop();
      saveHistory();
    }
    renderCard(d);
  } catch (e) {
    container.innerHTML = `<div class="placeholder"><span>⚠️</span><p>無法生成閃卡<br>Failed. Try again.</p></div>`;
    errMsg.textContent = e.message || 'Error';
  } finally {
    btn.disabled = false;
  }
}

function renderCard(d) {
  const container = document.getElementById('cardContainer');
  const hint = document.getElementById('flipHint');

  container.innerHTML = `
  <div class="card-area">
    <div class="card-inner" id="cardInner" onclick="flipCard()">
      <div class="card-face card-front">
        <div class="card-label">正面 FRONT</div>
        <div class="card-emoji">${d.emoji}</div>
        <div class="card-word">${d.word}</div>
        <div class="card-phonetic">${d.phonetic || ''}</div>
        <button class="speak-btn" title="朗讀" onclick="event.stopPropagation();speak('${esc(d.word)}')">🔊</button>
      </div>
      <div class="card-face card-back">
        <div class="card-label">背面 BACK</div>
        <div class="back-zh">${d.zh}</div>
        <div class="back-pos">${d.pos}</div>
        <div class="back-divider"></div>
        <div class="back-example-label">例句 EXAMPLE</div>
        <div class="back-example-en">${d.example_en}</div>
        <div class="back-example-zh">${d.example_zh}</div>
        <div class="back-speak-row">
          <button class="speak-chip" onclick="event.stopPropagation();speak('${esc(d.word)}')">🔊 ${d.word}</button>
          <button class="speak-chip" onclick="event.stopPropagation();speak('${esc(d.example_en)}')">🔊 例句</button>
        </div>
      </div>
    </div>
  </div>`;

  hint.style.display = 'block';
  flipped = false;
}

function flipCard() {
  const inner = document.getElementById('cardInner');
  if (!inner) return;
  flipped = !flipped;
  inner.classList.toggle('flipped', flipped);
}

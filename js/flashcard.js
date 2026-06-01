// ---- Flashcard tab (free APIs, no API key needed) ----
// Dictionary: https://dictionaryapi.dev  (phonetic, part of speech, example)
// Translation: https://mymemory.translated.net  (English -> Traditional Chinese)

// Part-of-speech -> bilingual label
const POS_MAP = {
  noun: 'n. 名詞', verb: 'v. 動詞', adjective: 'adj. 形容詞', adverb: 'adv. 副詞',
  pronoun: 'pron. 代名詞', preposition: 'prep. 介系詞', conjunction: 'conj. 連接詞',
  interjection: 'interj. 感嘆詞', exclamation: 'interj. 感嘆詞', determiner: 'det. 限定詞',
  article: 'art. 冠詞', numeral: 'num. 數詞',
};

// Word -> emoji (common parent-child vocabulary). Falls back by part of speech.
const EMOJI_MAP = {
  cat:'🐱',dog:'🐶',bird:'🐦',fish:'🐟',lion:'🦁',tiger:'🐯',bear:'🐻',rabbit:'🐰',elephant:'🐘',
  monkey:'🐵',horse:'🐴',cow:'🐮',pig:'🐷',sheep:'🐑',duck:'🦆',chicken:'🐔',frog:'🐸',snake:'🐍',
  turtle:'🐢',panda:'🐼',fox:'🦊',wolf:'🐺',mouse:'🐭',bee:'🐝',butterfly:'🦋',ant:'🐜',spider:'🕷️',
  apple:'🍎',banana:'🍌',orange:'🍊',grape:'🍇',strawberry:'🍓',watermelon:'🍉',bread:'🍞',milk:'🥛',
  egg:'🥚',rice:'🍚',cake:'🍰',cookie:'🍪',candy:'🍬',pizza:'🍕',water:'💧',juice:'🧃',cheese:'🧀',
  carrot:'🥕',tomato:'🍅',corn:'🌽',lemon:'🍋',peach:'🍑',
  sun:'☀️',moon:'🌙',star:'⭐',cloud:'☁️',rain:'🌧️',snow:'❄️',tree:'🌳',flower:'🌸',grass:'🌱',
  mountain:'⛰️',sea:'🌊',river:'🏞️',fire:'🔥',rainbow:'🌈',wind:'💨',
  mom:'👩',mother:'👩',dad:'👨',father:'👨',baby:'👶',family:'👨‍👩‍👧‍👦',brother:'👦',sister:'👧',
  grandma:'👵',grandpa:'👴',boy:'👦',girl:'👧',friend:'🧑‍🤝‍🧑',
  hand:'✋',eye:'👁️',ear:'👂',nose:'👃',mouth:'👄',foot:'🦶',heart:'❤️',hair:'💇',tooth:'🦷',
  book:'📖',pen:'🖊️',pencil:'✏️',school:'🏫',bag:'🎒',ruler:'📏',paper:'📄',
  car:'🚗',bus:'🚌',train:'🚆',plane:'✈️',bike:'🚲',boat:'⛵',ship:'🚢',truck:'🚚',
  house:'🏠',door:'🚪',window:'🪟',bed:'🛏️',chair:'🪑',table:'🍽️',clock:'🕐',phone:'📱',key:'🔑',
  ball:'⚽',toy:'🧸',gift:'🎁',balloon:'🎈',music:'🎵',
  red:'🔴',blue:'🔵',green:'🟢',yellow:'🟡',black:'⚫',white:'⚪',pink:'🩷',purple:'🟣',
  happy:'😊',sad:'😢',love:'❤️',smile:'😄',cry:'😢',sleep:'😴',run:'🏃',jump:'🤸',eat:'🍽️',drink:'🥤',
};

function guessEmoji(word, posEn) {
  const w = word.toLowerCase();
  if (EMOJI_MAP[w]) return EMOJI_MAP[w];
  if (posEn === 'verb') return '🏃';
  if (posEn === 'adjective') return '✨';
  if (posEn === 'adverb') return '💨';
  return '📘';
}

// Translate English -> Traditional Chinese via MyMemory (free, no key)
async function translateToZh(text) {
  if (!text) return '';
  try {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|zh-TW`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.responseStatus === 200 && data.responseData) {
      return data.responseData.translatedText || '';
    }
  } catch (e) { /* fall through */ }
  return '';
}

async function generate() {
  const input = document.getElementById('wordInput');
  const btn = document.getElementById('generateBtn');
  const container = document.getElementById('cardContainer');
  const hint = document.getElementById('flipHint');
  const errMsg = document.getElementById('errorMsg');

  const word = input.value.trim().toLowerCase();
  if (!word) return;

  btn.disabled = true;
  errMsg.textContent = '';
  hint.style.display = 'none';
  flipped = false;
  container.innerHTML = `<div class="loading"><div class="spinner"></div><span>生成中 Generating…</span></div>`;

  try {
    // 1. Look the word up in the free dictionary
    const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`);
    if (!res.ok) throw new Error('找不到這個單字 · Word not found in dictionary');
    const arr = await res.json();
    const entry = arr[0];

    // Phonetic: prefer top-level, else first phonetics entry that has text
    let phonetic = entry.phonetic || '';
    if (!phonetic && Array.isArray(entry.phonetics)) {
      const p = entry.phonetics.find(p => p.text);
      phonetic = p ? p.text : '';
    }

    // Part of speech (first meaning)
    const meaning = entry.meanings[0] || {};
    const posEn = meaning.partOfSpeech || '';
    const pos = POS_MAP[posEn] || posEn;

    // Example sentence: first definition that has one, else fall back to the definition itself
    let example_en = '';
    for (const m of entry.meanings) {
      for (const def of m.definitions) {
        if (def.example) { example_en = def.example; break; }
      }
      if (example_en) break;
    }
    if (!example_en) {
      example_en = (meaning.definitions && meaning.definitions[0] && meaning.definitions[0].definition) || word;
    }

    // 2. Translate the word and the example to Traditional Chinese (in parallel)
    const [zh, example_zh] = await Promise.all([
      translateToZh(word),
      translateToZh(example_en),
    ]);

    const d = {
      word: word,
      phonetic,
      pos,
      zh: zh || '（無翻譯）',
      emoji: guessEmoji(word, posEn),
      example_en,
      example_zh,
    };

    if (!history.find(h => h.word.toLowerCase() === d.word.toLowerCase())) {
      history.unshift(d);
      if (history.length > 50) history.pop();
      saveHistory();
    }
    renderCard(d);
  } catch (e) {
    container.innerHTML = `<div class="placeholder"><span>⚠️</span><p>${e.message || '無法生成閃卡 Failed. Try again.'}</p></div>`;
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

const GAME_STORE_KEY = 'statnice-hra-v1';
const TILE_TYPES = ['door', 'gap', 'bridge', 'gate', 'door', 'gap', 'bridge', 'gate', 'door', 'bridge', 'gap', 'gate'];
const LETTERS = ['A', 'B', 'C', 'D'];

const gameState = {
  topics: [],
  queue: [],
  subject: 'all',
  focus: 'mixed',
  index: 0,
  hearts: 3,
  correct: 0,
  currentChallenge: null
};

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => Array.from(document.querySelectorAll(selector));

bootGame();

async function bootGame() {
  if (location.protocol === 'file:' && !window.__TOPICS__) {
    showFileWarning();
    return;
  }
  gameState.topics = window.__TOPICS__ || await fetch('data/topics.json').then((res) => res.json());
  bindGameEvents();
  startNewGame();
}

function showFileWarning() {
  const shell = document.querySelector('.game-shell');
  if (!shell) return;
  shell.innerHTML = `
    <div class="board-panel">
      <h1>Hra sa nenačítala</h1>
      <p>Ak chceš hrať dvojklikom zo súboru, otvor <strong>hra-offline.html</strong>.</p>
      <p>Ak ideš cez GitHub Pages alebo server, otvor <strong>hra.html</strong>.</p>
    </div>
  `;
}

function bindGameEvents() {
  $('#gameSubject').addEventListener('change', (event) => {
    gameState.subject = event.target.value;
    startNewGame();
  });
  $('#gameFocus').addEventListener('change', (event) => {
    gameState.focus = event.target.value;
    startNewGame();
  });
  $('#restartGame').addEventListener('click', startNewGame);
  $('#continueButton').addEventListener('click', continueAfterAnswer);
}

function startNewGame() {
  gameState.queue = buildQueue();
  gameState.index = 0;
  gameState.hearts = 3;
  gameState.correct = 0;
  gameState.currentChallenge = null;
  writeGameState();
  loadChallenge();
  renderGame();
}

function buildQueue() {
  const progress = readJson('statnice-progress-v2', {});
  let pool = [...gameState.topics];
  if (gameState.subject !== 'all') {
    pool = pool.filter((topic) => topic.subject === gameState.subject);
  }
  if (gameState.focus === 'weak') {
    pool = pool.sort((a, b) => weaknessRank(progress[a.id]?.grade) - weaknessRank(progress[b.id]?.grade) || a.number - b.number);
  } else if (gameState.focus === 'fresh') {
    pool = pool.filter((topic) => !progress[topic.id]?.grade);
    if (!pool.length) {
      pool = [...gameState.topics].filter((topic) => gameState.subject === 'all' || topic.subject === gameState.subject);
    }
  } else {
    pool = shuffle(pool);
  }
  return shuffle(pool).slice(0, Math.max(12, Math.min(pool.length, 24)));
}

function weaknessRank(grade) {
  if (grade === 'C') return 0;
  if (!grade) return 1;
  if (grade === 'B') return 2;
  return 3;
}

function loadChallenge() {
  const topic = gameState.queue[gameState.index];
  if (!topic) {
    gameState.currentChallenge = null;
    return;
  }
  gameState.currentChallenge = buildChallenge(topic);
}

function buildChallenge(topic) {
  const correct = topicKeyPoint(topic);
  const distractors = buildDistractors(topic, correct);
  const options = shuffle([
    { text: correct, correct: true },
    ...distractors.map((text) => ({ text, correct: false }))
  ]).map((option, index) => ({ ...option, letter: LETTERS[index] }));
  return {
    topic,
    encounter: encounterForIndex(gameState.index),
    prompt: encounterPrompt(encounterForIndex(gameState.index), topic),
    options,
    solved: false,
    answered: false
  };
}

function topicKeyPoint(topic) {
  const blocks = topic.blocks || [];
  for (const block of blocks) {
    if ((block.type === 'heading' || block.type === 'li' || block.type === 'p') && String(block.text || '').trim()) {
      const compact = compactText(block.text);
      if (compact.split(' ').length >= 4) return compact;
    }
  }
  return compactText(compactTitle(topic.title));
}

function buildDistractors(topic, correct) {
  const sameSubject = gameState.topics
    .filter((candidate) => candidate.id !== topic.id && candidate.subject === topic.subject)
    .map((candidate) => topicKeyPoint(candidate))
    .filter((text) => text && text !== correct);
  return shuffle(uniqueTexts(sameSubject)).slice(0, 3);
}

function uniqueTexts(items) {
  const seen = new Set();
  return items.filter((item) => {
    const key = item.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function encounterForIndex(index) {
  return TILE_TYPES[index % TILE_TYPES.length];
}

function encounterPrompt(type, topic) {
  const label = shortLabel(topic);
  if (type === 'door') return `Pred tebou sú zavreté dvere. Ktorá možnosť najlepšie patrí k otázke ${label}?`;
  if (type === 'gap') return `Podlaha je rozbitá. Vyber správnu možnosť a položíš dosku cez priepasť pri otázke ${label}.`;
  if (type === 'bridge') return `Most je nestabilný. Spevni ho správnou odpoveďou k otázke ${label}.`;
  return `Brána sa otvorí len po správnej odpovedi. Ktorá možnosť sedí k otázke ${label}?`;
}

function renderGame() {
  renderStats();
  renderBoard();
  renderChallenge();
}

function renderStats() {
  const totalSteps = Math.min(12, gameState.queue.length || 12);
  $('#statPosition').textContent = `${Math.min(gameState.index + 1, totalSteps)} / ${totalSteps}`;
  $('#statHearts').textContent = '❤'.repeat(Math.max(gameState.hearts, 0)) || '0';
  $('#statCorrect').textContent = String(gameState.correct);
  $('#statSubject').textContent = gameState.subject === 'all' ? 'Mix' : (gameState.subject === 'Manažment' ? 'Manažment' : 'Ekonómia');
  $('#encounterText').textContent = boardHint();
}

function boardHint() {
  if (!gameState.currentChallenge) return 'Výprava je hotová. Spusti novú hru.';
  const type = gameState.currentChallenge.encounter;
  if (type === 'door') return 'Pred tebou sú dvere. Správna odpoveď ich odomkne.';
  if (type === 'gap') return 'Rozpadnutú podlahu preklenieš len správnou odpoveďou.';
  if (type === 'bridge') return 'Most treba spevniť. Vyber správny bod.';
  return 'Brána pustí ďalej len po správnej odpovedi.';
}

function renderBoard() {
  const stepCount = Math.min(12, Math.max(gameState.queue.length, 12));
  $('#boardGrid').innerHTML = Array.from({ length: stepCount }, (_, index) => {
    const type = encounterForIndex(index);
    const current = index === gameState.index && gameState.currentChallenge;
    const cleared = index < gameState.index;
    return `
      <div class="board-tile ${current ? 'current' : ''} ${cleared ? 'cleared' : ''}">
        <div class="tile-top">
          <span class="tile-index">${index + 1}</span>
          <span class="tile-type">${tileTypeLabel(type)}</span>
        </div>
        <div class="tile-art ${type}"></div>
        ${current ? '<div class="player"><div class="player-shadow"></div></div>' : ''}
      </div>
    `;
  }).join('');
}

function tileTypeLabel(type) {
  if (type === 'door') return 'Dvere';
  if (type === 'gap') return 'Pád';
  if (type === 'bridge') return 'Most';
  return 'Brána';
}

function renderChallenge() {
  const challenge = gameState.currentChallenge;
  const continueButton = $('#continueButton');
  if (!challenge) {
    $('#questionLabel').textContent = 'FINÁLE';
    $('#questionTitle').textContent = 'Došiel si na koniec výpravy.';
    $('#questionPrompt').textContent = `Správne si zvládol ${gameState.correct} prekážok. Spusti novú výpravu a prejdi ďalšie otázky.`;
    $('#answers').innerHTML = '';
    $('#feedback').textContent = 'Výprava je hotová.';
    $('#feedback').className = 'feedback is-good';
    $('#fullAnswerLink').href = 'index.html';
    continueButton.hidden = true;
    return;
  }

  $('#questionLabel').textContent = shortLabel(challenge.topic);
  $('#questionTitle').textContent = compactTitle(challenge.topic.title);
  $('#questionPrompt').textContent = challenge.prompt;
  $('#fullAnswerLink').href = `index.html?topic=${encodeURIComponent(challenge.topic.id)}`;
  $('#answers').innerHTML = challenge.options.map((option) => `
    <button class="answer-option" data-letter="${option.letter}" type="button">
      <strong>${option.letter}</strong>
      <span>${escapeHtml(option.text)}</span>
    </button>
  `).join('');
  $('#feedback').textContent = 'Vyber správnu možnosť A, B, C alebo D.';
  $('#feedback').className = 'feedback';
  continueButton.hidden = true;

  $$('#answers .answer-option').forEach((button) => {
    button.addEventListener('click', () => answerChallenge(button.dataset.letter));
  });
}

function answerChallenge(letter) {
  const challenge = gameState.currentChallenge;
  if (!challenge || challenge.answered) return;
  challenge.answered = true;

  const picked = challenge.options.find((option) => option.letter === letter);
  const correct = challenge.options.find((option) => option.correct);
  const buttons = $$('#answers .answer-option');
  buttons.forEach((button) => {
    const option = challenge.options.find((item) => item.letter === button.dataset.letter);
    button.disabled = true;
    if (option.correct) button.classList.add('is-correct');
    if (button.dataset.letter === letter && !option.correct) button.classList.add('is-wrong');
  });

  if (picked?.correct) {
    gameState.correct += 1;
    challenge.solved = true;
    $('#feedback').textContent = 'Správne. Prekážka je za tebou, môžeš pokračovať.';
    $('#feedback').className = 'feedback is-good';
    $('#continueButton').hidden = false;
  } else {
    gameState.hearts -= 1;
    $('#feedback').textContent = `Nesprávne. Správna odpoveď bola ${correct.letter}. Na tejto prekážke ešte zostávaš.`;
    $('#feedback').className = 'feedback is-bad';
    $('#continueButton').hidden = false;
  }

  if (gameState.hearts <= 0) {
    $('#feedback').textContent = `Došli ti srdcia. Správna odpoveď bola ${correct.letter}. Spúšťam novú výpravu.`;
    $('#feedback').className = 'feedback is-bad';
    $('#continueButton').textContent = 'Nová výprava';
  } else {
    $('#continueButton').textContent = picked?.correct ? 'Ďalšia prekážka' : 'Skúsiť znovu';
  }

  renderStats();
  writeGameState();
}

function continueAfterAnswer() {
  if (gameState.hearts <= 0) {
    startNewGame();
    return;
  }
  if (gameState.currentChallenge?.solved) {
    gameState.index += 1;
    loadChallenge();
  } else if (gameState.currentChallenge) {
    gameState.currentChallenge = buildChallenge(gameState.currentChallenge.topic);
  }
  renderGame();
  writeGameState();
}

function compactTitle(title) {
  return String(title || '').replace(/^\d+\s*[.\-]\s*/, '');
}

function compactText(text) {
  return String(text || '')
    .replace(/\s+/g, ' ')
    .replace(/^[•\-–]\s+/, '')
    .trim()
    .replace(/(.{110}).+/, '$1…');
}

function shortLabel(topic) {
  return `${topic.subject === 'Manažment' ? 'M' : 'E'}${topic.number}`;
}

function shuffle(items) {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const target = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[target]] = [copy[target], copy[index]];
  }
  return copy;
}

function readJson(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); }
  catch { return fallback; }
}

function writeGameState() {
  try {
    localStorage.setItem(GAME_STORE_KEY, JSON.stringify({
      subject: gameState.subject,
      focus: gameState.focus,
      correct: gameState.correct
    }));
  } catch {}
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

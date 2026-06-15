const GAME_STORE_KEY = 'statnice-house-game-v2';
const HOUSE_THEMES = [
  { key: 'horror', name: 'Domček 1', subtitle: 'Hororová vila', className: 'theme-horror' },
  { key: 'economy', name: 'Domček 2', subtitle: 'Rozpadajúca sa ekonomika', className: 'theme-economy' },
  { key: 'archive', name: 'Domček 3', subtitle: 'Archív manažéra', className: 'theme-archive' },
  { key: 'bank', name: 'Domček 4', subtitle: 'Banka v kríze', className: 'theme-bank' },
  { key: 'final', name: 'Domček 5', subtitle: 'Finálne ministerstvo', className: 'theme-final' }
];
const ROOM_TYPES = ['door', 'gap', 'bridge', 'gate', 'door', 'bridge', 'gap', 'gate', 'door', 'gap', 'bridge', 'gate'];
const LETTERS = ['A', 'B', 'C', 'D'];

const state = {
  topics: [],
  houses: [],
  currentHouse: 0,
  currentRoom: 0,
  question: null,
  progress: readJson(GAME_STORE_KEY, { unlockedHouse: 0, solvedByHouse: {} })
};

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => Array.from(document.querySelectorAll(selector));

boot();

async function boot() {
  if (location.protocol === 'file:' && !window.__TOPICS__) {
    renderFileWarning();
    return;
  }
  state.topics = window.__TOPICS__ || await fetch('data/topics.json').then((res) => res.json());
  state.houses = buildHouses(state.topics);
  state.currentHouse = Math.min(state.progress.unlockedHouse || 0, state.houses.length - 1);
  bindEvents();
  loadCurrentQuestion();
  render();
}

function renderFileWarning() {
  $('.game-shell').innerHTML = `
    <div class="board-panel">
      <h1>Hra sa nenačítala</h1>
      <p>Ak chceš hrať dvojklikom zo súboru, otvor <strong>hra-offline.html</strong>.</p>
    </div>
  `;
}

function buildHouses(topics) {
  const perHouse = 12;
  const houses = [];
  for (let index = 0; index < topics.length; index += perHouse) {
    const theme = HOUSE_THEMES[houses.length] || HOUSE_THEMES[HOUSE_THEMES.length - 1];
    houses.push({
      id: `house-${houses.length + 1}`,
      ...theme,
      topics: topics.slice(index, index + perHouse)
    });
  }
  return houses;
}

function bindEvents() {
  $('#restartGame').addEventListener('click', resetGame);
  $('#continueButton').addEventListener('click', nextStep);
}

function resetGame() {
  if (!confirm('Naozaj chceš vymazať postup v hre a začať od prvého domčeka?')) return;
  state.progress = { unlockedHouse: 0, solvedByHouse: {} };
  state.currentHouse = 0;
  state.currentRoom = 0;
  writeProgress();
  loadCurrentQuestion();
  render();
}

function houseProgress(houseIndex) {
  return state.progress.solvedByHouse[state.houses[houseIndex].id] || [];
}

function isHouseUnlocked(houseIndex) {
  return houseIndex <= (state.progress.unlockedHouse || 0);
}

function isHouseComplete(houseIndex) {
  return houseProgress(houseIndex).length >= state.houses[houseIndex].topics.length;
}

function loadCurrentQuestion() {
  const house = state.houses[state.currentHouse];
  if (!house) {
    state.question = null;
    return;
  }
  if (houseProgress(state.currentHouse).length >= house.topics.length) {
    state.currentRoom = house.topics.length - 1;
    state.question = null;
    return;
  }
  const solvedIds = new Set(houseProgress(state.currentHouse));
  const unsolvedIndex = house.topics.findIndex((topic) => !solvedIds.has(topic.id));
  const fallbackRoom = unsolvedIndex === -1 ? house.topics.length - 1 : unsolvedIndex;
  if (solvedIds.has(house.topics[state.currentRoom]?.id)) {
    state.currentRoom = fallbackRoom;
  }
  const topic = house.topics[state.currentRoom];
  state.question = topic ? buildQuestion(topic) : null;
}

function buildQuestion(topic) {
  const correct = extractCoreText(topic);
  const distractors = pickDistractors(topic, correct);
  const options = shuffle([
    { text: correct, correct: true },
    ...distractors.map((text) => ({ text, correct: false }))
  ]).map((option, index) => ({ ...option, letter: LETTERS[index] }));
  return { topic, options, answered: false, solved: false };
}

function extractCoreText(topic) {
  for (const block of topic.blocks || []) {
    if ((block.type === 'li' || block.type === 'p' || block.type === 'heading') && String(block.text || '').trim()) {
      const text = shorten(String(block.text).replace(/^[•\-–]\s+/, '').trim(), 120);
      if (text.split(' ').length >= 4) return text;
    }
  }
  return shorten(compactTitle(topic.title), 120);
}

function pickDistractors(topic, correct) {
  const candidates = state.topics
    .filter((candidate) => candidate.id !== topic.id)
    .map((candidate) => extractCoreText(candidate))
    .filter((text) => text && text !== correct);
  return uniqueTexts(shuffle(candidates)).slice(0, 3);
}

function render() {
  renderHouseList();
  renderStatus();
  renderHouseScene();
  renderQuestion();
}

function renderHouseList() {
  $('#houseList').innerHTML = state.houses.map((house, index) => {
    const unlocked = isHouseUnlocked(index);
    const complete = isHouseComplete(index);
    const solved = houseProgress(index).length;
    return `
      <button class="house-button ${index === state.currentHouse ? 'is-current' : ''} ${complete ? 'is-complete' : ''} ${!unlocked ? 'is-locked' : ''}" data-house="${index}" type="button" ${unlocked ? '' : 'disabled'}>
        <strong>${house.name}</strong>
        <span>${house.subtitle}</span>
        <span>${solved}/${house.topics.length} otázok</span>
      </button>
    `;
  }).join('');
  $$('#houseList .house-button').forEach((button) => {
    button.addEventListener('click', () => {
      const houseIndex = Number(button.dataset.house);
      if (!isHouseUnlocked(houseIndex)) return;
      state.currentHouse = houseIndex;
      state.currentRoom = firstOpenRoom(houseIndex);
      loadCurrentQuestion();
      render();
    });
  });
}

function firstOpenRoom(houseIndex) {
  const house = state.houses[houseIndex];
  const solved = new Set(houseProgress(houseIndex));
  const index = house.topics.findIndex((topic) => !solved.has(topic.id));
  return index === -1 ? house.topics.length - 1 : index;
}

function renderStatus() {
  const house = state.houses[state.currentHouse];
  $('#gameHouseStatus').textContent = `${house.name} z ${state.houses.length} · ${house.subtitle}`;
  $('#gameHouseHint').textContent = isHouseComplete(state.currentHouse)
    ? 'Tento domček je hotový. Môžeš sa sem kedykoľvek vrátiť.'
    : 'Dokonči všetky izby v tomto domčeku a odomkneš ďalší level.';
  $('#statPosition').textContent = `${state.currentRoom + 1} / ${house.topics.length}`;
  $('#statSolved').textContent = `${houseProgress(state.currentHouse).length} / ${house.topics.length}`;
  $('#statHouse').textContent = `${state.currentHouse + 1} / ${state.houses.length}`;
  $('#statTheme').textContent = house.subtitle;
  $('#encounterText').textContent = encounterText();
}

function encounterText() {
  if (!state.question) return 'Tento domček je hotový.';
  const type = ROOM_TYPES[state.currentRoom % ROOM_TYPES.length];
  if (type === 'door') return 'Pred tebou sú dvere. Správna odpoveď ich odomkne.';
  if (type === 'gap') return 'Podlaha je rozbitá. Správna odpoveď postaví bezpečný prechod.';
  if (type === 'bridge') return 'Most drží len napoly. Správna odpoveď ho spevní.';
  return 'Brána sa otvorí len tomu, kto odpovie správne.';
}

function renderHouseScene() {
  const house = state.houses[state.currentHouse];
  const solvedIds = new Set(houseProgress(state.currentHouse));
  const scene = $('#houseScene');
  scene.className = `board-scene ${house.className}`;
  $('#boardGrid').innerHTML = house.topics.map((topic, index) => {
    const floor = 2 - Math.floor(index / 4);
    const solved = solvedIds.has(topic.id);
    const current = index === state.currentRoom;
    const type = ROOM_TYPES[index % ROOM_TYPES.length];
    return `
      <div class="room-tile floor-${floor} ${solved ? 'solved' : ''} ${current ? 'current' : ''}">
        <div class="room-ceiling"></div>
        <div class="room-meta">
          <span class="room-index">${shortLabel(topic)}</span>
          <span class="room-type">${tileLabel(type)}</span>
        </div>
        <div class="room-art ${type}"></div>
        ${current ? '<div class="player"><div class="player-arms"></div><div class="player-legs"></div></div>' : ''}
      </div>
    `;
  }).join('');
}

function tileLabel(type) {
  if (type === 'door') return 'Dvere';
  if (type === 'gap') return 'Pád';
  if (type === 'bridge') return 'Most';
  return 'Brána';
}

function renderQuestion() {
  const question = state.question;
  const continueButton = $('#continueButton');
  if (!question) {
    const nextUnlocked = isHouseUnlocked(state.currentHouse + 1);
    $('#questionLabel').textContent = 'HOTOVO';
    $('#questionTitle').textContent = 'Tento domček je dokončený.';
    $('#questionPrompt').textContent = nextUnlocked
      ? 'Môžeš sa vrátiť sem alebo pokračovať do ďalšieho odomknutého domčeka.'
      : 'Práve si odomkol ďalší domček. Vyber si ho hore v zozname levelov.';
    $('#answers').innerHTML = '';
    $('#feedback').textContent = 'Výborne. Všetky otázky v tomto domčeku sú zvládnuté.';
    $('#feedback').className = 'feedback is-good';
    $('#fullAnswerLink').href = 'index.html';
    continueButton.hidden = true;
    return;
  }

  $('#questionLabel').textContent = shortLabel(question.topic);
  $('#questionTitle').textContent = compactTitle(question.topic.title);
  $('#questionPrompt').textContent = promptForRoom(question.topic, state.currentRoom);
  $('#fullAnswerLink').href = `index.html?topic=${encodeURIComponent(question.topic.id)}`;
  $('#answers').innerHTML = question.options.map((option) => `
    <button class="answer-option" data-letter="${option.letter}" type="button">
      <strong>${option.letter}</strong>
      <span>${escapeHtml(option.text)}</span>
    </button>
  `).join('');
  $('#feedback').textContent = 'Vyber správnu možnosť A, B, C alebo D.';
  $('#feedback').className = 'feedback';
  continueButton.hidden = true;

  $$('#answers .answer-option').forEach((button) => {
    button.addEventListener('click', () => answerQuestion(button.dataset.letter));
  });
}

function promptForRoom(topic, roomIndex) {
  const type = ROOM_TYPES[roomIndex % ROOM_TYPES.length];
  const label = shortLabel(topic);
  if (type === 'door') return `Odomkni dvere pri otázke ${label}. Ktorá možnosť patrí k tejto téme?`;
  if (type === 'gap') return `Rozpadnutú podlahu prejdeš len správnou odpoveďou pri otázke ${label}.`;
  if (type === 'bridge') return `Postav most cez medzeru pri otázke ${label}. Vyber správny bod.`;
  return `Otvor bránu na ďalšie poschodie. Ktorá možnosť sedí k otázke ${label}?`;
}

function answerQuestion(letter) {
  if (!state.question || state.question.answered) return;
  state.question.answered = true;
  const picked = state.question.options.find((option) => option.letter === letter);
  const correct = state.question.options.find((option) => option.correct);

  $$('#answers .answer-option').forEach((button) => {
    const option = state.question.options.find((item) => item.letter === button.dataset.letter);
    button.disabled = true;
    if (option.correct) button.classList.add('is-correct');
    if (button.dataset.letter === letter && !option.correct) button.classList.add('is-wrong');
  });

  if (picked?.correct) {
    state.question.solved = true;
    markSolved(state.currentHouse, state.question.topic.id);
    $('#feedback').textContent = 'Správne. Izba je vyčistená a môžeš ísť vyššie.';
    $('#feedback').className = 'feedback is-good';
    $('#continueButton').textContent = nextButtonText();
  } else {
    $('#feedback').textContent = `Nesprávne. Správna odpoveď bola ${correct.letter}. Na tej istej izbe zostávaš a skúsiš ju znovu.`;
    $('#feedback').className = 'feedback is-bad';
    $('#continueButton').textContent = 'Skúsiť znovu';
  }
  $('#continueButton').hidden = false;
  renderStatus();
  renderHouseList();
}

function nextButtonText() {
  const house = state.houses[state.currentHouse];
  const solved = houseProgress(state.currentHouse).length;
  if (solved >= house.topics.length) return isHouseUnlocked(state.currentHouse + 1) ? 'Ďalší domček' : 'Odomknúť ďalší domček';
  return 'Ďalšia izba';
}

function nextStep() {
  if (!state.question) return;
  if (!state.question.solved) {
    state.question = buildQuestion(state.question.topic);
    render();
    return;
  }

  const house = state.houses[state.currentHouse];
  const solved = new Set(houseProgress(state.currentHouse));
  const nextRoom = house.topics.findIndex((topic, index) => index > state.currentRoom && !solved.has(topic.id));

  if (nextRoom !== -1) {
    state.currentRoom = nextRoom;
    loadCurrentQuestion();
    render();
    return;
  }

  if (houseProgress(state.currentHouse).length >= house.topics.length) {
    state.progress.unlockedHouse = Math.max(state.progress.unlockedHouse || 0, Math.min(state.currentHouse + 1, state.houses.length - 1));
    writeProgress();
    if (state.currentHouse < state.houses.length - 1 && isHouseUnlocked(state.currentHouse + 1)) {
      state.currentHouse += 1;
      state.currentRoom = firstOpenRoom(state.currentHouse);
      loadCurrentQuestion();
    } else {
      state.question = null;
    }
    render();
  }
}

function markSolved(houseIndex, topicId) {
  const houseId = state.houses[houseIndex].id;
  const existing = new Set(state.progress.solvedByHouse[houseId] || []);
  existing.add(topicId);
  state.progress.solvedByHouse[houseId] = [...existing];
  writeProgress();
}

function writeProgress() {
  try { localStorage.setItem(GAME_STORE_KEY, JSON.stringify(state.progress)); } catch {}
}

function compactTitle(title) {
  return String(title || '').replace(/^\d+\s*[.\-]\s*/, '');
}

function shortLabel(topic) {
  return `${topic.subject === 'Manažment' ? 'M' : 'E'}${topic.number}`;
}

function shorten(text, max) {
  const value = String(text || '').replace(/\s+/g, ' ').trim();
  return value.length > max ? `${value.slice(0, max - 1)}…` : value;
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

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

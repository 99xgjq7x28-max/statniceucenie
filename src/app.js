
const EXAM_DATE = new Date('2026-06-12T09:00:00');
const STORE_KEY = 'statnice-progress-v2';
const TODAY_KEY = 'statnice-today-v1';

const state = {
  topics: [],
  currentId: null,
  subject: 'all',
  grade: 'all',
  mode: 'weak',
  query: '',
  answerOpen: false,
  studyMode: 'answer',
  cardIndex: 0,
  cardFlipped: false,
  quizIndex: 0,
  quizOpen: false,
  readerIndex: 0,
  readerPlaying: false,
  readerWpm: 300,
  readerId: null,
  timer: 300,
  timerId: null,
  progress: readJson(STORE_KEY, {}),
  today: readJson(TODAY_KEY, [])
};

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => Array.from(document.querySelectorAll(selector));

boot();

async function boot() {
  if (location.protocol === 'file:' && !window.__TOPICS__) {
    showFileModeMessage();
    return;
  }
  if (new URLSearchParams(location.search).has('reset')) {
    try { localStorage.removeItem(STORE_KEY); localStorage.removeItem(TODAY_KEY); } catch {}
    history.replaceState(null, '', location.pathname);
    state.progress = {};
    state.today = [];
  }
  state.topics = await fetch('data/topics.json').then((res) => res.json());
  const requestedTopic = new URLSearchParams(location.search).get('topic');
  state.currentId = state.topics.find((topic) => topic.id === requestedTopic)?.id || state.topics[0]?.id;
  hydrateFilters();
  bindEvents();
  if (!state.today.length) buildToday(false);
  renderAll();
}

function showFileModeMessage() {
  const message = `
    <div class="file-warning">
      <h2>Učivo sa nenačítalo</h2>
      <p>Táto verzia appky potrebuje lokálny server alebo GitHub Pages, lebo načítava dáta zo súboru <code>data/topics.json</code>.</p>
      <p>Ak chceš appku otvoriť dvojklikom zo súboru, použi <strong>offline.html</strong>.</p>
      <p>Ak ju spúšťaš cez server, otvor napríklad <code>http://localhost:8766/index.html?v=16</code>.</p>
    </div>
  `;
  const topicList = $('#topicList');
  if (topicList) topicList.innerHTML = message;
  const answer = $('#answer');
  if (answer) {
    answer.className = 'answer is-visible';
    answer.innerHTML = message;
  }
}

function bindEvents() {
  $('#subjectFilter').addEventListener('change', (event) => {
    state.subject = event.target.value;
    chooseFirstFiltered();
  });
  $('#gradeFilter').addEventListener('change', (event) => {
    state.grade = event.target.value;
    renderTopicList();
  });
  $('#searchInput').addEventListener('input', (event) => {
    state.query = event.target.value.trim();
    renderTopicList();
  });
  $('#modeWeak').addEventListener('click', () => setMode('weak'));
  $('#modeOrder').addEventListener('click', () => setMode('order'));
  $('#buildToday').addEventListener('click', () => buildToday(true));
  $('#toggleAnswer').addEventListener('click', () => {
    state.answerOpen = !state.answerOpen;
    renderQuestion();
  });
  $('#randomQuestion').addEventListener('click', pickRandomWeak);
  $('#nextQuestion').addEventListener('click', pickNext);
  $('#timerToggle').addEventListener('click', toggleTimer);
  $('#timerReset').addEventListener('click', resetTimer);
  $('#resetProgress').addEventListener('click', resetProgress);
  $$('.grade-buttons button').forEach((button) => {
    button.addEventListener('click', () => gradeCurrent(button.dataset.grade));
  });
  $$('.study-mode button').forEach((button) => {
    button.addEventListener('click', () => setStudyMode(button.dataset.studyMode));
  });
  document.addEventListener('keydown', handleKeys);
}

function hydrateFilters() {
  const subjects = [...new Set(state.topics.map((topic) => topic.subject))];
  $('#subjectFilter').innerHTML = '<option value="all">Všetko</option>' + subjects.map((subject) => `<option value="${escapeAttr(subject)}">${escapeHtml(subject)}</option>`).join('');
}

function renderAll() {
  renderMetrics();
  renderToday();
  renderQuestion();
  renderTopicList();
  renderTimer();
}

function currentTopic() {
  return state.topics.find((topic) => topic.id === state.currentId) || state.topics[0];
}

function gradeOf(topic) {
  return state.progress[topic.id]?.grade || '';
}

function weight(topic) {
  const grade = gradeOf(topic);
  if (grade === 'C') return 0;
  if (grade === '') return 1;
  if (grade === 'B') return 2;
  return 3;
}

function filteredTopics() {
  const query = state.query.toLowerCase();
  let list = state.topics.filter((topic) => {
    const grade = gradeOf(topic);
    const gradeOk = state.grade === 'all' || grade === state.grade || (state.grade === 'none' && !grade);
    const subjectOk = state.subject === 'all' || topic.subject === state.subject;
    const queryOk = !query || searchableText(topic).toLowerCase().includes(query);
    return gradeOk && subjectOk && queryOk;
  });
  if (state.mode === 'weak') {
    list = list.sort((a, b) => weight(a) - weight(b) || a.subject.localeCompare(b.subject) || a.number - b.number);
  } else {
    list = list.sort((a, b) => a.subject.localeCompare(b.subject) || a.number - b.number);
  }
  return list;
}

function searchableText(topic) {
  return `${titleWithNumber(topic)} ${topic.blocks.map((block) => block.text || '').join(' ')}`;
}

function chooseFirstFiltered() {
  const first = filteredTopics()[0];
  if (first) setCurrent(first.id);
  renderTopicList();
}

function setCurrent(id, shouldFocusStudy = false) {
  state.currentId = id;
  state.answerOpen = false;
  state.cardIndex = 0;
  state.cardFlipped = false;
  state.quizIndex = 0;
  state.quizOpen = false;
  resetReader();
  resetTimer(false);
  renderQuestion();
  renderTopicList();
  if (shouldFocusStudy && window.matchMedia('(max-width: 900px)').matches) {
    document.querySelector('.study-card')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

function renderMetrics() {
  const done = state.topics.filter((topic) => gradeOf(topic)).length;
  const mastered = state.topics.filter((topic) => gradeOf(topic) === 'A').length;
  const weak = state.topics.length - mastered;
  const days = Math.max(1, Math.ceil((EXAM_DATE - new Date()) / 86400000));
  $('#metricDone').textContent = `${done}/${state.topics.length}`;
  $('#metricWeak').textContent = String(weak);
  $('#metricDays').textContent = String(days);
  $('#metricDaily').textContent = String(Math.ceil(weak / days));
}

function renderToday() {
  const list = state.today.map((id) => state.topics.find((topic) => topic.id === id)).filter(Boolean);
  $('#todayList').innerHTML = list.map((topic) => `
    <button class="today-item" data-id="${escapeAttr(topic.id)}" type="button">
      <strong>${escapeHtml(topic.number + '. ' + compactTitle(topic.title))}</strong>
      <span>${escapeHtml(topic.subject)} • ${gradeOf(topic) || 'neoznačené'}</span>
    </button>
  `).join('');
  $$('#todayList .today-item').forEach((button) => {
    button.addEventListener('click', () => setCurrent(button.dataset.id, true));
  });
}

function buildToday(shouldRender) {
  const c = state.topics.filter((topic) => gradeOf(topic) === 'C');
  const b = state.topics.filter((topic) => gradeOf(topic) === 'B');
  const none = state.topics.filter((topic) => !gradeOf(topic));
  const eko = state.topics.filter((topic) => topic.subject === 'Ekonómia a financie' && gradeOf(topic) !== 'A');
  const man = state.topics.filter((topic) => topic.subject === 'Manažment' && gradeOf(topic) !== 'A');
  const picked = uniqueTopics([...c, ...b, sample(man), sample(eko), ...none]).slice(0, 6);
  state.today = picked.map((topic) => topic.id);
  writeJson(TODAY_KEY, state.today);
  if (shouldRender) renderToday();
}

function uniqueTopics(items) {
  const seen = new Set();
  return items.filter(Boolean).filter((topic) => {
    if (seen.has(topic.id)) return false;
    seen.add(topic.id);
    return true;
  });
}

function sample(items) {
  if (!items.length) return null;
  return items[Math.floor(Math.random() * items.length)];
}

function renderQuestion() {
  const topic = currentTopic();
  if (!topic) return;
  const media = [];
  if (topic.tableCount) media.push(`${topic.tableCount} tab.`);
  if (topic.imageCount) media.push(`${topic.imageCount} obr.`);
  $('#subjectLine').textContent = `${topic.subject} • otázka ${topic.number} • ${topic.wordCount} slov`;
  $('#currentMedia').textContent = media.join(' • ');
  $('#currentMedia').style.display = media.length ? 'inline-flex' : 'none';
  $('#questionTitle').textContent = titleWithNumber(topic);
  $('#questionCue').textContent = topic.cue || 'Skús najprv povedať kostru odpovede bez pozerania.';
  renderEmergencyStart(topic);
  renderStudyModeButtons();
  renderStudyBody(topic);
  renderGradeButtons(topic);
}

function renderEmergencyStart(topic) {
  const lines = topic.emergencyStart || [];
  const box = $('#emergencyStart');
  const body = $('#emergencyStartBody');
  if (!box || !body) return;
  if (!lines.length) {
    box.style.display = 'none';
    return;
  }
  box.style.display = '';
  box.open = false;
  body.innerHTML = lines.slice(0, 3).map((line) => `<p>${escapeHtml(line)}</p>`).join('');
}

function renderStudyBody(topic) {
  if (state.studyMode === 'answer') {
    $('#answer').className = `answer${state.answerOpen ? ' is-visible' : ''}`;
    $('#answer').innerHTML = `<div class="answer-inner">${topic.blocks.map(renderBlock).join('')}</div>`;
    $('#toggleAnswer').style.display = '';
    $('#toggleAnswer').textContent = state.answerOpen ? 'Skryť odpoveď' : 'Ukázať odpoveď';
    return;
  }
  $('#answer').className = 'answer is-visible';
  $('#toggleAnswer').style.display = 'none';
  if (state.studyMode === 'cards') {
    $('#answer').innerHTML = renderCards(topic);
    bindCardEvents(topic);
    return;
  }
  if (state.studyMode === 'reader') {
    $('#answer').innerHTML = renderReader(topic);
    bindReaderEvents(topic);
    return;
  }
  $('#answer').innerHTML = renderQuiz(topic);
  bindQuizEvents(topic);
}

function setStudyMode(mode) {
  state.studyMode = mode;
  state.answerOpen = false;
  state.cardIndex = 0;
  state.cardFlipped = false;
  state.quizIndex = 0;
  state.quizOpen = false;
  resetReader();
  renderQuestion();
}

function renderStudyModeButtons() {
  $$('.study-mode button').forEach((button) => {
    button.classList.toggle('is-active', button.dataset.studyMode === state.studyMode);
  });
}

function buildRecallItems(topic) {
  const items = [];
  let current = null;
  for (const block of topic.blocks) {
    if (block.type === 'heading') {
      if (current && current.answer.length) items.push(current);
      current = { prompt: block.text, answer: [] };
      continue;
    }
    if (!current) continue;
    if (block.type === 'p' || block.type === 'li') current.answer.push(block.text);
    if (block.type === 'table') current.answer.push('Tabuľka v odpovedi: pozri úplnú odpoveď.');
    if (block.type === 'image') current.answer.push('Obrázok v odpovedi: pozri úplnú odpoveď.');
    if (current.answer.length >= 7) {
      items.push(current);
      current = null;
    }
  }
  if (current && current.answer.length) items.push(current);
  if (!items.length) {
    items.push({ prompt: titleWithNumber(topic), answer: topic.blocks.filter((block) => block.text).slice(0, 8).map((block) => block.text) });
  }
  return items.slice(0, 40);
}

function renderCards(topic) {
  const cards = buildRecallItems(topic);
  const index = Math.min(state.cardIndex, cards.length - 1);
  const card = cards[index];
  const answer = card.answer.map((line) => `<li>${formatLearningText(line)}</li>`).join('');
  return `<div class="practice-panel">
    <div class="practice-head"><strong>Kartičky</strong><span>${index + 1} / ${cards.length}</span></div>
    <button id="flashcard" class="flashcard ${state.cardFlipped ? 'is-flipped' : ''}" type="button">
      <span class="flash-label">${state.cardFlipped ? 'Odpoveď' : 'Predná strana'}</span>
      <span class="flash-text">${state.cardFlipped ? `<ul>${answer}</ul>` : escapeHtml(card.prompt)}</span>
    </button>
    <div class="practice-actions">
      <button id="cardPrev" type="button">Predošlá</button>
      <button id="cardFlip" type="button">Otočiť</button>
      <button id="cardNext" type="button">Ďalšia</button>
    </div>
  </div>`;
}

function bindCardEvents(topic) {
  const cards = buildRecallItems(topic);
  $('#flashcard')?.addEventListener('click', () => { state.cardFlipped = !state.cardFlipped; renderQuestion(); });
  $('#cardFlip')?.addEventListener('click', () => { state.cardFlipped = !state.cardFlipped; renderQuestion(); });
  $('#cardPrev')?.addEventListener('click', () => { state.cardIndex = (state.cardIndex - 1 + cards.length) % cards.length; state.cardFlipped = false; renderQuestion(); });
  $('#cardNext')?.addEventListener('click', () => { state.cardIndex = (state.cardIndex + 1) % cards.length; state.cardFlipped = false; renderQuestion(); });
}

function renderQuiz(topic) {
  const items = buildRecallItems(topic);
  const index = Math.min(state.quizIndex, items.length - 1);
  const item = items[index];
  const answer = item.answer.map((line) => `<li>${formatLearningText(line)}</li>`).join('');
  return `<div class="practice-panel">
    <div class="practice-head"><strong>Kvíz</strong><span>${index + 1} / ${items.length}</span></div>
    <div class="quiz-card">
      <span class="flash-label">Povedz nahlas</span>
      <h3>${escapeHtml(item.prompt)}</h3>
      ${state.quizOpen ? `<div class="quiz-answer"><ul>${answer}</ul></div>` : '<p class="quiz-hint">Najprv odpovedz spamäti, potom odkry kontrolu.</p>'}
    </div>
    <div class="practice-actions">
      <button id="quizReveal" type="button">${state.quizOpen ? 'Skryť' : 'Ukázať'}</button>
      <button id="quizNo" type="button">Nevedel</button>
      <button id="quizPart" type="button">Čiastočne</button>
      <button id="quizYes" type="button">Vedel</button>
    </div>
  </div>`;
}

function bindQuizEvents(topic) {
  const items = buildRecallItems(topic);
  const next = () => { state.quizIndex = (state.quizIndex + 1) % items.length; state.quizOpen = false; renderQuestion(); };
  $('#quizReveal')?.addEventListener('click', () => { state.quizOpen = !state.quizOpen; renderQuestion(); });
  $('#quizNo')?.addEventListener('click', next);
  $('#quizPart')?.addEventListener('click', next);
  $('#quizYes')?.addEventListener('click', next);
}

function buildReaderWords(topic) {
  const parts = [titleWithNumber(topic)];
  for (const block of topic.blocks) {
    if (block.type === 'heading' || block.type === 'p' || block.type === 'li') {
      parts.push(block.text);
    }
  }
  return parts
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .filter(Boolean);
}

function currentReaderContext(topic, wordIndex) {
  let count = titleWithNumber(topic).split(/\s+/).filter(Boolean).length;
  let context = 'Otázka';
  for (const block of topic.blocks) {
    if (block.type === 'heading') context = block.text;
    if (block.type === 'heading' || block.type === 'p' || block.type === 'li') {
      count += String(block.text || '').split(/\s+/).filter(Boolean).length;
      if (count >= wordIndex) return context;
    }
  }
  return context;
}

function renderReader(topic) {
  const words = buildReaderWords(topic);
  const index = Math.min(state.readerIndex, Math.max(words.length - 1, 0));
  const progress = words.length ? Math.round(((index + 1) / words.length) * 100) : 0;
  const word = words[index] || 'Hotovo';
  return `<div class="reader-panel">
    <div class="practice-head"><strong>Rýchle opakovanie</strong><span>${index + 1} / ${words.length || 1}</span></div>
    <div class="reader-context">${escapeHtml(currentReaderContext(topic, index + 1))}</div>
    <div class="reader-word">${escapeHtml(word)}</div>
    <div class="reader-progress" aria-label="Postup"><span style="width:${progress}%"></span></div>
    <div class="reader-controls">
      <label>Rýchlosť
        <select id="readerSpeed">
          ${[180, 240, 300, 360, 420, 500].map((wpm) => `<option value="${wpm}" ${wpm === state.readerWpm ? 'selected' : ''}>${wpm} slov/min</option>`).join('')}
        </select>
      </label>
      <button id="readerPrev" type="button">Späť</button>
      <button id="readerPlay" type="button">${state.readerPlaying ? 'Pauza' : 'Spustiť'}</button>
      <button id="readerNext" type="button">Ďalej</button>
      <button id="readerStart" type="button">Od začiatku</button>
    </div>
    <p class="reader-note">Používaj to na rýchle opakovanie už známej témy. Na nové veci je lepšia Odpoveď alebo Kvíz.</p>
  </div>`;
}

function bindReaderEvents(topic) {
  const words = buildReaderWords(topic);
  $('#readerSpeed')?.addEventListener('change', (event) => {
    state.readerWpm = Number(event.target.value);
    if (state.readerPlaying) startReader(topic);
  });
  $('#readerPrev')?.addEventListener('click', () => {
    state.readerIndex = Math.max(0, state.readerIndex - 1);
    renderQuestion();
  });
  $('#readerNext')?.addEventListener('click', () => {
    state.readerIndex = Math.min(Math.max(words.length - 1, 0), state.readerIndex + 1);
    renderQuestion();
  });
  $('#readerStart')?.addEventListener('click', () => {
    state.readerIndex = 0;
    renderQuestion();
  });
  $('#readerPlay')?.addEventListener('click', () => {
    if (state.readerPlaying) {
      stopReader();
      renderQuestion();
    } else {
      startReader(topic);
    }
  });
}

function startReader(topic) {
  stopReader(false);
  state.readerPlaying = true;
  const words = buildReaderWords(topic);
  const delay = Math.max(80, Math.round(60000 / state.readerWpm));
  state.readerId = setInterval(() => {
    if (state.readerIndex >= words.length - 1) {
      stopReader();
    } else {
      state.readerIndex += 1;
    }
    renderQuestion();
  }, delay);
  renderQuestion();
}

function stopReader(shouldKeepPlaying = false) {
  if (state.readerId) clearInterval(state.readerId);
  state.readerId = null;
  state.readerPlaying = shouldKeepPlaying;
}

function resetReader() {
  stopReader();
  state.readerIndex = 0;
}

function renderBlock(block) {
  if (block.type === 'table') return renderTable(block.rows || []);
  if (block.type === 'image') {
    return `<figure class="figure"><img src="${escapeAttr(block.src)}" alt="${escapeAttr(block.alt || 'Obrázok')}"><figcaption class="figcap">${escapeHtml(block.alt || 'Obrázok')}</figcaption></figure>`;
  }
  if (block.type === 'heading') return `<h3 class="answer-heading">${escapeHtml(block.text)}</h3>`;
  if (block.type === 'li') return `<p class="listitem">${formatLearningText(cleanBullet(block.text))}</p>`;
  return `<p class="para">${formatLearningText(block.text)}</p>`;
}

function renderTable(rows) {
  if (!rows.length) return '';
  return `<div class="table-wrap"><table>${rows.map((row, index) => `<tr>${row.map((cell) => index === 0 ? `<th>${escapeHtml(cell)}</th>` : `<td>${escapeHtml(cell)}</td>`).join('')}</tr>`).join('')}</table></div>`;
}

function formatLearningText(text) {
  const value = String(text || '');
  let match = value.match(/^([^=]{2,90})=\s*(.+)$/);
  if (match) return `<strong>${escapeHtml(match[1].trim())}</strong> ${escapeHtml(match[2].trim())}`;
  match = value.match(/^(\d+\.\s+.{3,90}?)(\s+(je|predstavuje|vyjadruje|znamená|obsahuje|zahŕňa|môže|má)\s+.+)$/i);
  if (match) return `<strong>${escapeHtml(match[1].trim())}</strong>${escapeHtml(match[2])}`;
  return escapeHtml(value);
}

function cleanBullet(text) {
  return String(text || '').replace(/^[•\-–]\s+/, '');
}

function renderGradeButtons(topic) {
  const grade = gradeOf(topic);
  $$('.grade-buttons button').forEach((button) => {
    button.classList.toggle('is-active', button.dataset.grade === grade);
  });
}

function renderTopicList() {
  const topics = filteredTopics();
  $('#resultCount').textContent = `${topics.length} tém`;
  const topCount = $('#currentTopicCount');
  if (topCount) topCount.textContent = `${topics.length} tém`;
  $('#topicList').innerHTML = topics.map((topic) => `
    <button class="topic-item ${topic.id === state.currentId ? 'is-active' : ''}" data-id="${escapeAttr(topic.id)}" type="button">
      <strong>${escapeHtml(topic.number + '. ' + compactTitle(topic.title))}</strong>
      <span>${escapeHtml(topic.subject)} • ${gradeOf(topic) || 'neoznačené'} • ${topic.wordCount} slov${topic.tableCount ? ' • ' + topic.tableCount + ' tab.' : ''}${topic.imageCount ? ' • ' + topic.imageCount + ' obr.' : ''}</span>
    </button>
  `).join('');
  $$('#topicList .topic-item').forEach((button) => {
    button.addEventListener('click', () => setCurrent(button.dataset.id, true));
  });
}

function compactTitle(title) {
  return String(title || '').replace(/^\d+\s*[.\-]\s*/, '');
}

function titleWithNumber(topic) {
  return `${topic.number}. ${compactTitle(topic.title)}`;
}

function setMode(mode) {
  state.mode = mode;
  $('#modeWeak').classList.toggle('is-active', mode === 'weak');
  $('#modeOrder').classList.toggle('is-active', mode === 'order');
  renderTopicList();
}

function pickRandomWeak() {
  const candidates = filteredTopics();
  const weak = candidates.filter((topic) => gradeOf(topic) !== 'A');
  const pool = weak.length ? weak : candidates;
  const topic = sample(pool);
  if (topic) setCurrent(topic.id);
}

function pickNext() {
  const topics = filteredTopics();
  const index = topics.findIndex((topic) => topic.id === state.currentId);
  const next = topics[(index + 1 + topics.length) % topics.length] || topics[0];
  if (next) setCurrent(next.id);
}

function gradeCurrent(grade) {
  const topic = currentTopic();
  if (!topic) return;
  state.progress[topic.id] = { ...(state.progress[topic.id] || {}), grade, seenAt: Date.now(), seenCount: (state.progress[topic.id]?.seenCount || 0) + 1 };
  writeJson(STORE_KEY, state.progress);
  renderMetrics();
  renderGradeButtons(topic);
  renderTopicList();
  renderToday();
}

function toggleTimer() {
  if (state.timerId) {
    clearInterval(state.timerId);
    state.timerId = null;
    $('#timerToggle').textContent = 'Štart';
    return;
  }
  state.timerId = setInterval(() => {
    state.timer -= 1;
    if (state.timer <= 0) {
      state.timer = 0;
      clearInterval(state.timerId);
      state.timerId = null;
      $('#timerToggle').textContent = 'Štart';
    }
    renderTimer();
  }, 1000);
  $('#timerToggle').textContent = 'Pauza';
}

function resetTimer(render = true) {
  if (state.timerId) clearInterval(state.timerId);
  state.timerId = null;
  state.timer = 300;
  $('#timerToggle').textContent = 'Štart';
  if (render) renderTimer();
}

function renderTimer() {
  const minutes = String(Math.floor(state.timer / 60)).padStart(2, '0');
  const seconds = String(state.timer % 60).padStart(2, '0');
  $('#timer').textContent = `${minutes}:${seconds}`;
}

function resetProgress() {
  if (!confirm('Vymazať všetky A/B/C označenia v tejto appke?')) return;
  state.progress = {};
  state.today = [];
  writeJson(STORE_KEY, state.progress);
  writeJson(TODAY_KEY, state.today);
  buildToday(false);
  renderAll();
}

function handleKeys(event) {
  if (event.target.matches('input, select, textarea')) return;
  if (event.key === ' ') {
    event.preventDefault();
    if (state.studyMode === 'answer') state.answerOpen = !state.answerOpen;
    if (state.studyMode === 'cards') state.cardFlipped = !state.cardFlipped;
    if (state.studyMode === 'quiz') state.quizOpen = !state.quizOpen;
    if (state.studyMode === 'reader') {
      const topic = currentTopic();
      state.readerPlaying ? stopReader() : startReader(topic);
      return;
    }
    renderQuestion();
  }
  if (event.key.toLowerCase() === 'n') pickNext();
  if (event.key.toLowerCase() === 'r') pickRandomWeak();
}

function readJson(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); }
  catch { return fallback; }
}

function writeJson(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
}

function escapeAttr(value) {
  return escapeHtml(value).replace(/`/g, '&#96;');
}

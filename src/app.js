
const EXAM_DATE = new Date('2026-06-08T09:00:00');
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
  timer: 300,
  timerId: null,
  progress: readJson(STORE_KEY, {}),
  today: readJson(TODAY_KEY, [])
};

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => Array.from(document.querySelectorAll(selector));

boot();

async function boot() {
  if (new URLSearchParams(location.search).has('reset')) {
    try { localStorage.removeItem(STORE_KEY); localStorage.removeItem(TODAY_KEY); } catch {}
    history.replaceState(null, '', location.pathname);
    state.progress = {};
    state.today = [];
  }
  state.topics = await fetch('data/topics.json').then((res) => res.json());
  state.currentId = state.topics[0]?.id;
  hydrateFilters();
  bindEvents();
  if (!state.today.length) buildToday(false);
  renderAll();
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
  return `${topic.title} ${topic.blocks.map((block) => block.text || '').join(' ')}`;
}

function chooseFirstFiltered() {
  const first = filteredTopics()[0];
  if (first) setCurrent(first.id);
  renderTopicList();
}

function setCurrent(id) {
  state.currentId = id;
  state.answerOpen = false;
  resetTimer(false);
  renderQuestion();
  renderTopicList();
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
    button.addEventListener('click', () => setCurrent(button.dataset.id));
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
  $('#questionTitle').textContent = topic.title;
  $('#questionCue').textContent = topic.cue || 'Skús najprv povedať kostru odpovede bez pozerania.';
  $('#answer').className = `answer${state.answerOpen ? ' is-visible' : ''}`;
  $('#answer').innerHTML = `<div class="answer-inner">${topic.blocks.map(renderBlock).join('')}</div>`;
  $('#toggleAnswer').textContent = state.answerOpen ? 'Skryť odpoveď' : 'Ukázať odpoveď';
  renderGradeButtons(topic);
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
    button.addEventListener('click', () => setCurrent(button.dataset.id));
  });
}

function compactTitle(title) {
  return String(title || '').replace(/^\d+\s*[.\-]\s*/, '');
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
    state.answerOpen = !state.answerOpen;
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

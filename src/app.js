
const EXAM_DATE = new Date('2026-08-17T09:00:00');
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
      <p>Ak ju spúšťaš cez server, otvor napríklad <code>http://localhost:8766/index.html?v=20</code>.</p>
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
  renderStudyModeButtons();
  renderStudyBody(topic);
  renderGradeButtons(topic);
}

function renderStudyBody(topic) {
  if (state.studyMode === 'answer') {
    $('#answer').className = `answer${state.answerOpen ? ' is-visible' : ''}`;
    $('#answer').innerHTML = `<div class="answer-inner">${topic.blocks.map(renderBlock).join('')}${renderRelatedSection(topic)}</div>`;
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
    <p class="reader-note">Používaj to na rýchle opakovanie už známej témy. Na nové veci je lepšia Odpoveď alebo stránka Kostry.</p>
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

function renderRelatedSection(topic) {
  const related = buildRelatedResources(topic);
  if (!related.links.length && !related.fact) return '';
  return `<section class="related-panel">
    <div class="related-head">
      <h3>Súvisiace zdroje a zaujímavosti</h3>
      <p>${escapeHtml(related.intro)}</p>
    </div>
    ${related.fact ? `<p class="related-fact"><strong>Vedeli ste, že...</strong> ${escapeHtml(related.fact)}</p>` : ''}
    <div class="related-links">
      ${related.links.map((link) => `
        <a class="related-link" href="${escapeAttr(link.url)}" target="_blank" rel="noopener">
          <strong>${escapeHtml(link.label)}</strong>
          <span>${escapeHtml(link.note)}</span>
        </a>
      `).join('')}
    </div>
  </section>`;
}

function buildRelatedResources(topic) {
  const rawTitle = compactTitle(topic.title);
  const title = normalizeTopicText(rawTitle);
  const isEconomics = topic.subject === 'Ekonómia a financie';
  const generalQuery = `${rawTitle} ${topic.subject}`;
  const officialDomains = isEconomics
    ? 'site:nbs.sk OR site:ecb.europa.eu OR site:ec.europa.eu OR site:oecd.org'
    : 'site:pmi.org OR site:scrumguides.org OR site:atlassian.com OR site:hbr.org';

  let fact = isEconomics
    ? 'Pri ekonomických témach sa v praxi skoro nikdy nesleduje iba jeden ukazovateľ. Zmysel dáva až kombinácia trendu, príčiny a dopadu na firmu alebo domácnosti.'
    : 'Pri manažérskych témach zvyčajne neexistuje len jedno správne riešenie. Dôležité je vedieť pomenovať situáciu, zvoliť prístup a obhájiť dôsledky pre ľudí aj výsledok.';

  let focusedLinks = isEconomics
    ? [
        { label: 'Oficiálne zdroje k téme', url: googleSearchUrl(`${rawTitle} ${officialDomains}`), note: 'NBS, ECB, Eurostat alebo OECD podľa konkrétnej otázky.' },
        { label: 'Rýchly prehľad pojmov', url: googleSearchUrl(`${rawTitle} site:investopedia.com OR site:wikipedia.org`), note: 'Na rýchle dovysvetlenie definícií, vzťahov a príkladov.' }
      ]
    : [
        { label: 'Odborné zdroje k téme', url: googleSearchUrl(`${rawTitle} ${officialDomains}`), note: 'PMI, Scrum Guide, Atlassian Agile Coach alebo Harvard Business Review.' },
        { label: 'Rýchly prehľad pojmov', url: googleSearchUrl(`${rawTitle} site:wikipedia.org OR site:mindtools.com`), note: 'Na rýchle dovysvetlenie modelov, pojmov a praktických príkladov.' }
      ];

  if (title.includes('hdp') || title.includes('hnp') || title.includes('inflac') || title.includes('nezamest') || title.includes('platobn') || title.includes('is lm') || title.includes('fiskal') || title.includes('menov')) {
    fact = 'HDP môže rásť aj v období, keď ľudia necítia zlepšenie životnej úrovne. Preto sa spolu s rastom sledujú aj inflácia, mzdy, produktivita a nezamestnanosť.';
    focusedLinks = [
      { label: 'Makro dáta v Eurostate', url: 'https://ec.europa.eu/eurostat', note: 'HDP, inflácia, nezamestnanosť a porovnania medzi krajinami EÚ.' },
      { label: 'Makro prehľady NBS', url: googleSearchUrl(`${rawTitle} site:nbs.sk`), note: 'Komentáre a analýzy k slovenskému hospodárstvu.' },
      { label: 'OECD Data', url: 'https://data.oecd.org/', note: 'Dlhšie časové rady a medzinárodné porovnania.' }
    ];
  } else if (title.includes('dopyt') || title.includes('ponuk') || title.includes('elastic') || title.includes('trhov') || title.includes('monopol') || title.includes('oligopol') || title.includes('cena')) {
    fact = 'Malá zmena ceny môže mať na rôznych trhoch úplne iný efekt. Presne preto manažér potrebuje rozumieť elasticite a typu trhu, na ktorom firma predáva.';
    focusedLinks = [
      { label: 'Vysvetlenia k trhu a elasticite', url: googleSearchUrl(`${rawTitle} site:investopedia.com OR site:wikipedia.org`), note: 'Krátke vysvetlenia pojmov a jednoduché príklady.' },
      { label: 'OECD a konkurencia', url: googleSearchUrl(`${rawTitle} site:oecd.org competition`), note: 'Širší pohľad na fungovanie trhov a konkurencie.' },
      { label: 'Praktické príklady', url: googleSearchUrl(`${rawTitle} priklad`), note: 'Hľadaj konkrétne príklady z firiem alebo odvetví.' }
    ];
  } else if (title.includes('eu') || title.includes('europsk') || title.includes('integrac') || title.includes('medzinar') || title.includes('global') || title.includes('obchod')) {
    fact = 'Medzinárodná ekonomika nie je len o obchode. Menové kurzy, clá, logistika, regulácia a geopolitika menia rozhodnutia firiem rýchlejšie než samotná teória.';
    focusedLinks = [
      { label: 'Európska únia - oficiálny portál', url: 'https://european-union.europa.eu/index_sk', note: 'Základy fungovania EÚ, politiky a inštitúcie.' },
      { label: 'Eurostat - EÚ v číslach', url: googleSearchUrl(`${rawTitle} site:ec.europa.eu/eurostat`), note: 'Dáta o obchode, raste, obyvateľstve a integrácii.' },
      { label: 'World Bank Data', url: 'https://data.worldbank.org/', note: 'Medzinárodné porovnania a globálny kontext.' }
    ];
  } else if (title.includes('ecb') || title.includes('nbs') || title.includes('banka') || title.includes('peniaz') || title.includes('uver') || title.includes('urok')) {
    fact = 'Centrálne banky priamo neurčujú všetky ceny v ekonomike, ale cez úrokové sadzby a očakávania vedia silno ovplyvniť správanie bánk, firiem aj domácností.';
    focusedLinks = [
      { label: 'Národná banka Slovenska', url: 'https://nbs.sk/', note: 'Domáce vysvetlenia, štatistiky a dohľad nad finančným trhom.' },
      { label: 'ECB explainers', url: 'https://www.ecb.europa.eu/ecb/educational/explainers/html/index.en.html', note: 'Krátke vysvetlenia menovej politiky a úlohy ECB.' },
      { label: 'Hľadať v ECB', url: googleSearchUrl(`${rawTitle} site:ecb.europa.eu`), note: 'Doplnenie konkrétnej témy, napríklad sadzieb, inflácie alebo eura.' }
    ];
  } else if (title.includes('uctov') || title.includes('majetok') || title.includes('pasiv') || title.includes('aktiv') || title.includes('naklad') || title.includes('vynos') || title.includes('odpis')) {
    fact = 'Podnik môže vykázať účtovný zisk a zároveň mať problém s peniazmi na účte. Preto sa účtovníctvo vždy oplatí prepájať s cash flow a likviditou.';
    focusedLinks = [
      { label: 'IFRS Foundation', url: 'https://www.ifrs.org/', note: 'Štandardy a širší rámec finančného výkazníctva.' },
      { label: 'Vysvetlenia k účtovným pojmom', url: googleSearchUrl(`${rawTitle} site:investopedia.com OR site:accountingcoach.com`), note: 'Jednoduché vysvetlenia pojmov a účtovných súvislostí.' },
      { label: 'Slovenský kontext', url: googleSearchUrl(`${rawTitle} site:financnasprava.sk OR site:slov-lex.sk`), note: 'Legislatívny alebo praktický domáci rámec.' }
    ];
  } else if (title.includes('financn') || title.includes('likvid') || title.includes('rentabil') || title.includes('roe') || title.includes('roa') || title.includes('ros') || title.includes('eva') || title.includes('mva') || title.includes('dupont') || title.includes('investic') || title.includes('rizik')) {
    fact = 'Veľa firiem nepadá preto, že by dlhodobo nezarábali, ale preto, že nezvládnu likviditu, riziko alebo zlé investičné rozhodnutie v zlom čase.';
    focusedLinks = [
      { label: 'Prehľad finančných ukazovateľov', url: googleSearchUrl(`${rawTitle} site:investopedia.com OR site:corporatefinanceinstitute.com`), note: 'Rýchle definície a interpretačné rámce.' },
      { label: 'Damodaran on valuation', url: 'https://pages.stern.nyu.edu/~adamodar/', note: 'Silný zdroj k oceňovaniu, riziku a finančnému rozhodovaniu.' },
      { label: 'Praktické porovnania', url: googleSearchUrl(`${rawTitle} benchmarking priklad`), note: 'Hľadaj jednoduchý príklad výpočtu alebo benchmarkingu.' }
    ];
  } else if (title.includes('kultur') || title.includes('hofstede')) {
    fact = 'Firemná kultúra nie je len atmosféra. Ovplyvňuje ochotu ľudí niesť riziko, hovoriť o chybách a navrhovať nové riešenia.';
    focusedLinks = [
      { label: 'Hofstede Insights', url: 'https://www.hofstede-insights.com/', note: 'Prehľad kultúrnych dimenzií a ich porovnanie.' },
      { label: 'Kultúra a inovácie', url: googleSearchUrl(`${rawTitle} site:oecd.org OR site:hbr.org`), note: 'Ako kultúra súvisí s podnikavosťou a inovatívnosťou.' },
      { label: 'Praktické príklady', url: googleSearchUrl(`${rawTitle} priklad firmy`), note: 'Konkrétne prípady firemnej kultúry v praxi.' }
    ];
  } else if (title.includes('projekt') || title.includes('scrum') || title.includes('agile') || title.includes('product owner')) {
    fact = 'V agilnom riadení často nerozhoduje ten, kto najviac kontroluje, ale ten, kto najlepšie udrží prioritu, spätnú väzbu a tok práce.';
    focusedLinks = [
      { label: 'Scrum Guides', url: 'https://scrumguides.org/', note: 'Základný text k Scrum rolám, udalostiam a artefaktom.' },
      { label: 'PMI - project management', url: 'https://www.pmi.org/', note: 'Klasickejší projektový manažment a jeho rámce.' },
      { label: 'Agile Coach', url: googleSearchUrl(`${rawTitle} site:atlassian.com/agile`), note: 'Praktické vysvetlenia agilných pojmov a situácií.' }
    ];
  } else if (title.includes('motivac') || title.includes('vedeni') || title.includes('lider') || title.includes('tim') || title.includes('konflikt') || title.includes('komunik')) {
    fact = 'Silný líder nemusí hovoriť najviac. Často je výkon tímu vyšší tam, kde ľudia rozumejú cieľu, dostávajú spätnú väzbu a cítia bezpečie hovoriť otvorene.';
    focusedLinks = [
      { label: 'CIPD - people management', url: 'https://www.cipd.org/', note: 'Ľudia, vedenie, motivácia a pracovné vzťahy.' },
      { label: 'MindTools', url: googleSearchUrl(`${rawTitle} site:mindtools.com`), note: 'Stručné manažérske modely a praktické tipy.' },
      { label: 'Praktické príklady tímov', url: googleSearchUrl(`${rawTitle} priklad tim`), note: 'Konflikty, motivácia a komunikácia v konkrétnych situáciách.' }
    ];
  } else if (title.includes('strateg') || title.includes('inov') || title.includes('podnikav') || title.includes('marketing') || title.includes('podnik')) {
    fact = 'Dobrá stratégia nie je dlhý dokument. Je to hlavne séria rozhodnutí, čo firma bude robiť, čo nebude robiť a prečo má zákazník veriť práve jej.';
    focusedLinks = [
      { label: 'OECD a podnikanie', url: googleSearchUrl(`${rawTitle} site:oecd.org OR site:europa.eu`), note: 'Podnikavosť, inovácie a širší ekonomický kontext.' },
      { label: 'HBR k stratégii', url: googleSearchUrl(`${rawTitle} site:hbr.org`), note: 'Eseje a príklady zo strategického riadenia.' },
      { label: 'Príklady z firiem', url: googleSearchUrl(`${rawTitle} case study`), note: 'Skús si pozrieť reálnu firmu alebo konkrétnu situáciu.' }
    ];
  }

  const links = dedupeLinks([
    ...focusedLinks,
    { label: 'Google Scholar k téme', url: `https://scholar.google.com/scholar?q=${encodeURIComponent(generalQuery)}`, note: 'Keď chceš odbornejší článok, PDF alebo definíciu z akademického zdroja.' }
  ]).slice(0, 4);

  return {
    intro: 'Na konci učenia si otvor aspoň jeden zdroj alebo jednu zaujímavosť. Pomôže ti to prepojiť pojem s praxou, príkladom alebo širším kontextom.',
    fact,
    links
  };
}

function dedupeLinks(links) {
  const seen = new Set();
  return links.filter((link) => {
    if (!link?.url || seen.has(link.url)) return false;
    seen.add(link.url);
    return true;
  });
}

function googleSearchUrl(query) {
  return `https://www.google.com/search?q=${encodeURIComponent(query)}`;
}

function normalizeTopicText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, ' ')
    .toLowerCase()
    .trim();
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

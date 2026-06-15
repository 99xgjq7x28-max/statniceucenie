const items = window.__SKELETONS__ || [];
const state = {
  subject: 'all',
  query: '',
  currentId: normalizeTopicId(new URLSearchParams(location.search).get('topic')) || items[0]?.id,
};
const transitions = ['Najprv', 'Ďalej', 'Potom', 'Následne', 'Dôležité', 'V praxi', 'Pre manažéra'];

const $ = (selector) => document.querySelector(selector);

$('#subject').addEventListener('change', (event) => {
  state.subject = event.target.value;
  ensureCurrent();
  render();
});

$('#search').addEventListener('input', (event) => {
  state.query = event.target.value.trim().toLowerCase();
  ensureCurrent();
  render();
});

$('#random').addEventListener('click', () => {
  const visible = filtered();
  if (!visible.length) return;
  state.currentId = visible[Math.floor(Math.random() * visible.length)].id;
  render();
});

function filtered() {
  return items.filter((item) => {
    if (state.subject !== 'all' && item.subject !== state.subject) return false;
    if (!state.query) return true;
    const number = item.subject === 'Manažment' ? `m${item.number}` : `e${item.number}`;
    const haystack = [number, item.title, item.start, ...item.points].join(' ').toLowerCase();
    return haystack.includes(state.query);
  });
}

function ensureCurrent() {
  const visible = filtered();
  if (!visible.some((item) => item.id === state.currentId)) {
    state.currentId = visible[0]?.id;
  }
}

function normalizeTopicId(topicId) {
  if (!topicId) return '';
  return String(topicId)
    .replace(/^ekono[míi]a a financie-/i, 'ekonomia-')
    .replace(/^ekono[míi]a-/i, 'ekonomia-')
    .replace(/^manažment-/i, 'manazment-');
}

function label(item) {
  return `${item.subject === 'Manažment' ? 'M' : 'E'}${item.number}`;
}

function render() {
  const visible = filtered();
  $('#count').textContent = visible.length;
  $('#list').innerHTML = visible.map((item) => `
    <button class="question-item ${item.id === state.currentId ? 'is-active' : ''}" data-id="${item.id}" type="button">
      <span>${label(item)}</span>
      <strong>${escapeHtml(item.title)}</strong>
    </button>
  `).join('') || '<p class="empty">Nenašla sa žiadna kostra.</p>';

  document.querySelectorAll('.question-item').forEach((button) => {
    button.addEventListener('click', () => {
      state.currentId = button.dataset.id;
      render();
      if (matchMedia('(max-width: 760px)').matches) {
        $('#detail').scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  const item = items.find((candidate) => candidate.id === state.currentId);
  if (!item) {
    $('#detail').innerHTML = '<p class="empty">Vyber otázku zo zoznamu.</p>';
    return;
  }

  $('#detail').classList.remove('is-hidden');
  $('#detail').innerHTML = `
    <header>
      <div class="detail-meta">
        <span class="subject-line">${escapeHtml(item.subject)}</span>
        <span class="number-pill">${label(item)}</span>
      </div>
      <h2>${escapeHtml(item.title)}</h2>
    </header>
    <div class="skeleton-note">
      Kostra pokrýva jednotlivé časti zadania. Ku každému bodu pridaj jednu vlastnú vetu alebo príklad.
    </div>
    <section class="start">
      <span><b>1</b> Začni touto vetou</span>
      <p>${escapeHtml(item.start)}</p>
    </section>
    <section class="points">
      <div class="section-title">
        <span><b>2</b> Rozviň odpoveď</span>
        <small>${item.points.length} bodov · drž sa tohto poradia</small>
      </div>
      <ol>${item.points.map((point, index) => `
        <li>
          <span class="transition">${transitionLabel(index, item.points.length)}</span>
          <p>${formatPoint(point)}</p>
        </li>
      `).join('')}</ol>
    </section>
    <div class="actions">
      <a class="primary-link" href="../index.html?topic=${encodeURIComponent(item.id)}">Otvoriť úplnú odpoveď</a>
      <button id="speak" type="button">Precvičiť bez pomoci</button>
    </div>
    <div class="practice-cover" aria-hidden="true">
      <strong>${label(item)}</strong>
      <p>Povedz úvodnú vetu a všetkých ${item.points.length} bodov vlastnými slovami.</p>
    </div>
  `;

  $('#speak').addEventListener('click', () => {
    $('#detail').classList.toggle('is-hidden');
    $('#speak').textContent = $('#detail').classList.contains('is-hidden')
      ? 'Ukázať kostru'
      : 'Precvičiť bez pomoci';
  });
}

function transitionLabel(index, total) {
  if (index === total - 1) return 'Na záver';
  return transitions[index] || `Bod ${index + 1}`;
}

function formatPoint(value) {
  const safe = escapeHtml(value);
  const separator = safe.indexOf(':');
  if (separator > 0 && separator < 42) {
    return `<strong>${safe.slice(0, separator + 1)}</strong>${safe.slice(separator + 1)}`;
  }
  return safe;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

ensureCurrent();
render();

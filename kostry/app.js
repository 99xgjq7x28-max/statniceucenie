const items = window.__SKELETONS__ || [];
const state = {
  subject: 'all',
  query: '',
  currentId: new URLSearchParams(location.search).get('topic') || items[0]?.id,
};

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
      <div class="subject-line">${escapeHtml(item.subject)} · ${label(item)}</div>
      <h2>${escapeHtml(item.title)}</h2>
    </header>
    <section class="start">
      <span>Začni vetou</span>
      <p>${escapeHtml(item.start)}</p>
    </section>
    <section class="points">
      <h3>Päť bodov</h3>
      <ol>${item.points.map((point) => `<li>${escapeHtml(point)}</li>`).join('')}</ol>
    </section>
    <div class="actions">
      <a class="primary-link" href="../index.html?topic=${encodeURIComponent(item.id)}">Otvoriť úplnú odpoveď</a>
      <button id="speak" type="button">Skryť kostru a povedať</button>
    </div>
  `;

  $('#speak').addEventListener('click', () => {
    $('#detail').classList.toggle('is-hidden');
    $('#speak').textContent = $('#detail').classList.contains('is-hidden')
      ? 'Ukázať kostru'
      : 'Skryť kostru a povedať';
  });
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

const EXAM_DATE = new Date('2026-06-12T09:00:00');
const STORE_KEY = 'statnice-progress-v2';
const PLAN_KEY = 'statnice-plan-v1';

const planState = {
  topics: [],
  progress: readJson(STORE_KEY, {}),
  plan: readJson(PLAN_KEY, { completedDays: {}, notes: '' })
};

const planDays = [
  { date: '2026-05-31', label: '31.5.', goal: 'Štart bez nuly', ranges: [['Ekonómia a financie', 1, 3], ['Manažment', 1, 3]] },
  { date: '2026-06-01', label: '1.6.', goal: 'Prvé kolo', ranges: [['Ekonómia a financie', 4, 6], ['Manažment', 4, 6]] },
  { date: '2026-06-02', label: '2.6.', goal: 'Prvé kolo', ranges: [['Ekonómia a financie', 7, 9], ['Manažment', 7, 9]] },
  { date: '2026-06-03', label: '3.6.', goal: 'Prvé kolo', ranges: [['Ekonómia a financie', 10, 12], ['Manažment', 10, 12]] },
  { date: '2026-06-04', label: '4.6.', goal: 'Prvé kolo', ranges: [['Ekonómia a financie', 13, 15], ['Manažment', 13, 15]] },
  { date: '2026-06-05', label: '5.6.', goal: 'Prvé kolo', ranges: [['Ekonómia a financie', 16, 18], ['Manažment', 16, 18]] },
  { date: '2026-06-06', label: '6.6.', goal: 'Silný víkend', ranges: [['Ekonómia a financie', 19, 23], ['Manažment', 19, 23]] },
  { date: '2026-06-07', label: '7.6.', goal: 'Dokonči prvé kolo', ranges: [['Ekonómia a financie', 24, 30], ['Manažment', 24, 30]] },
  { date: '2026-06-08', label: '8.6.', goal: 'C otázky', mode: 'C' },
  { date: '2026-06-09', label: '9.6.', goal: 'B otázky', mode: 'B' },
  { date: '2026-06-10', label: '10.6.', goal: 'Simulácia', mode: 'simulation' },
  { date: '2026-06-11', label: '11.6.', goal: 'Najhorších 10', mode: 'worst' },
  { date: '2026-06-12', label: '12.6.', goal: 'Skúška', mode: 'warmup' }
];

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => Array.from(document.querySelectorAll(selector));

bootPlan();

async function bootPlan() {
  if (location.protocol === 'file:' && !window.__TOPICS__) {
    $('#todayTopics').innerHTML = '<p class="file-warning">Plán sa nenačítal. Otvor <strong>plan-offline.html</strong>.</p>';
    return;
  }
  planState.topics = window.__TOPICS__ || await fetch('data/topics.json').then((res) => res.json());
  bindPlanEvents();
  renderPlan();
}

function bindPlanEvents() {
  $('#markTodayDone')?.addEventListener('click', () => {
    const today = currentPlanDay();
    planState.plan.completedDays[today.date] = !planState.plan.completedDays[today.date];
    writeJson(PLAN_KEY, planState.plan);
    renderPlan();
  });
  $('#resetPlan')?.addEventListener('click', () => {
    if (!confirm('Naozaj vymazať iba plánové poznámky a hotové dni? A/B/C progres ostane.')) return;
    planState.plan = { completedDays: {}, notes: '' };
    writeJson(PLAN_KEY, planState.plan);
    renderPlan();
  });
  $('#planNotes')?.addEventListener('input', (event) => {
    planState.plan.notes = event.target.value;
    writeJson(PLAN_KEY, planState.plan);
  });
}

function renderPlan() {
  planState.progress = readJson(STORE_KEY, {});
  renderPlanMetrics();
  renderTodayPlan();
  renderGradeSummary();
  renderCalendar();
  $('#planNotes').value = planState.plan.notes || '';
  $('#nextMilestone').textContent = nextMilestoneText();
}

function renderPlanMetrics() {
  const grades = gradeCounts();
  const days = Math.max(0, Math.ceil((EXAM_DATE - new Date()) / 86400000));
  $('#planDays').textContent = String(days);
  $('#planDone').textContent = `${grades.done}/${planState.topics.length}`;
  $('#planA').textContent = String(grades.A);
  $('#planWeak').textContent = String(grades.B + grades.C + grades.none);
}

function renderTodayPlan() {
  const day = currentPlanDay();
  const topics = topicsForDay(day);
  $('#todayPlanLabel').textContent = `${day.label} - ${day.goal} (${topics.length || 'podľa progresu'} otázok)`;
  $('#markTodayDone').textContent = planState.plan.completedDays[day.date] ? 'Deň hotový' : 'Označiť deň hotový';
  $('#markTodayDone').classList.toggle('is-done', Boolean(planState.plan.completedDays[day.date]));
  $('#todayTopics').innerHTML = topics.length
    ? topics.map(renderTopicTask).join('')
    : `<p class="compact-copy">${fallbackForMode(day.mode)}</p>`;
  bindGradeButtons();
}

function renderTopicTask(topic) {
  const grade = gradeOf(topic);
  return `
    <article class="plan-topic">
      <div>
        <strong>${escapeHtml(topic.number + '. ' + topic.title)}</strong>
        <span>${escapeHtml(topic.subject)} • ${grade || 'neoznačené'} • ${topic.wordCount} slov</span>
      </div>
      <div class="plan-topic-actions">
        <a class="button-link" href="${studyHref(topic)}">Otvoriť</a>
        <button data-grade-topic="${escapeAttr(topic.id)}" data-grade="C" class="${grade === 'C' ? 'is-active danger' : ''}" type="button">C</button>
        <button data-grade-topic="${escapeAttr(topic.id)}" data-grade="B" class="${grade === 'B' ? 'is-active warning' : ''}" type="button">B</button>
        <button data-grade-topic="${escapeAttr(topic.id)}" data-grade="A" class="${grade === 'A' ? 'is-active success' : ''}" type="button">A</button>
      </div>
    </article>
  `;
}

function renderGradeSummary() {
  const grades = gradeCounts();
  $('#gradeSummary').innerHTML = `
    <div><span>A viem</span><strong>${grades.A}</strong></div>
    <div><span>B slabé</span><strong>${grades.B}</strong></div>
    <div><span>C neviem</span><strong>${grades.C}</strong></div>
    <div><span>Nové</span><strong>${grades.none}</strong></div>
  `;
}

function renderCalendar() {
  $('#planDaysList').innerHTML = planDays.map((day) => {
    const topics = topicsForDay(day);
    const done = Boolean(planState.plan.completedDays[day.date]);
    const today = day.date === todayKey();
    const counts = countGrades(topics);
    return `
      <article class="plan-day ${today ? 'is-today' : ''} ${done ? 'is-complete' : ''}">
        <div class="plan-day-head">
          <strong>${day.label}</strong>
          <span>${escapeHtml(day.goal)}</span>
        </div>
        <p>${dayDescription(day, topics)}</p>
        <small>${topics.length ? `A ${counts.A} • B ${counts.B} • C ${counts.C} • nové ${counts.none}` : fallbackForMode(day.mode)}</small>
      </article>
    `;
  }).join('');
}

function topicsForDay(day) {
  if (day.ranges) {
    return day.ranges.flatMap(([subject, from, to]) =>
      planState.topics.filter((topic) => topic.subject === subject && topic.number >= from && topic.number <= to)
    );
  }
  if (day.mode === 'C') return byWeakness(['C']).slice(0, 14);
  if (day.mode === 'B') return byWeakness(['B']).slice(0, 14);
  if (day.mode === 'simulation') return byWeakness(['C', '', 'B']).slice(0, 12);
  if (day.mode === 'worst') return byWeakness(['C', 'B', '']).slice(0, 10);
  if (day.mode === 'warmup') return byWeakness(['C', 'B']).slice(0, 8);
  return [];
}

function byWeakness(order) {
  const rank = new Map(order.map((grade, index) => [grade, index]));
  return [...planState.topics]
    .filter((topic) => rank.has(gradeOf(topic)))
    .sort((a, b) => rank.get(gradeOf(a)) - rank.get(gradeOf(b)) || a.subject.localeCompare(b.subject) || a.number - b.number);
}

function dayDescription(day, topics) {
  if (day.ranges) {
    return day.ranges.map(([subject, from, to]) => `${shortSubject(subject)} ${from}-${to}`).join(' + ');
  }
  if (topics.length) return topics.map((topic) => `${shortSubject(topic.subject)} ${topic.number}`).join(', ');
  return fallbackForMode(day.mode);
}

function fallbackForMode(mode) {
  if (mode === 'C') return 'Prejdi všetky C otázky: núdzový štart, 5 slov, 1 príklad.';
  if (mode === 'B') return 'Prejdi B otázky a doplň príklady.';
  if (mode === 'simulation') return 'Náhodne 12 otázok, každú povedz 2-3 minúty.';
  if (mode === 'worst') return 'Najhorších 10 otázok, bez nového prepisovania.';
  if (mode === 'warmup') return 'Ráno iba ľahké zahriatie a núdzové štarty.';
  return 'Oddych alebo dobiehanie.';
}

function nextMilestoneText() {
  const firstUnfinished = planDays.find((day) => !planState.plan.completedDays[day.date]);
  if (!firstUnfinished) return 'Plán je odškrtnutý. Teraz už len opakovanie a pokoj.';
  return `${firstUnfinished.label}: ${firstUnfinished.goal}. ${dayDescription(firstUnfinished, topicsForDay(firstUnfinished))}`;
}

function currentPlanDay() {
  const key = todayKey();
  return planDays.find((day) => day.date === key) || planDays.find((day) => day.date > key) || planDays[planDays.length - 1];
}

function bindGradeButtons() {
  $$('[data-grade-topic]').forEach((button) => {
    button.addEventListener('click', () => {
      const id = button.dataset.gradeTopic;
      const grade = button.dataset.grade;
      planState.progress[id] = { ...(planState.progress[id] || {}), grade, updatedAt: new Date().toISOString() };
      writeJson(STORE_KEY, planState.progress);
      renderPlan();
    });
  });
}

function gradeCounts() {
  return countGrades(planState.topics);
}

function countGrades(topics) {
  const counts = { A: 0, B: 0, C: 0, none: 0, done: 0 };
  topics.forEach((topic) => {
    const grade = gradeOf(topic);
    if (grade) counts.done += 1;
    if (grade === 'A') counts.A += 1;
    else if (grade === 'B') counts.B += 1;
    else if (grade === 'C') counts.C += 1;
    else counts.none += 1;
  });
  return counts;
}

function gradeOf(topic) {
  return planState.progress[topic.id]?.grade || '';
}

function studyHref(topic) {
  const page = location.protocol === 'file:' ? 'offline.html' : 'index.html';
  return `${page}?topic=${encodeURIComponent(topic.id)}`;
}

function shortSubject(subject) {
  return subject === 'Manažment' ? 'M' : 'E';
}

function todayKey() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
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

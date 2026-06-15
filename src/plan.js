const EXAM_DATE = new Date('2026-08-17T09:00:00');
const STORE_KEY = 'statnice-progress-v2';
const PLAN_KEY = 'statnice-plan-v1';

const planState = {
  topics: [],
  progress: readJson(STORE_KEY, {}),
  plan: readJson(PLAN_KEY, { completedDays: {}, notes: '' })
};

const planDays = [
  { date: '2026-06-15', label: '15.6.', goal: 'Prvý prejazd: E 1-3', ranges: [['Ekonómia a financie', 1, 3]] },
  { date: '2026-06-16', label: '16.6.', goal: 'Prvý prejazd: M 1-3', ranges: [['Manažment', 1, 3]] },
  { date: '2026-06-17', label: '17.6.', goal: 'Prvý prejazd: E 4-6', ranges: [['Ekonómia a financie', 4, 6]] },
  { date: '2026-06-18', label: '18.6.', goal: 'Prvý prejazd: M 4-6', ranges: [['Manažment', 4, 6]] },
  { date: '2026-06-19', label: '19.6.', goal: 'Prvý prejazd: E 7-9', ranges: [['Ekonómia a financie', 7, 9]] },
  { date: '2026-06-20', label: '20.6.', goal: 'Prvý prejazd: M 7-9', ranges: [['Manažment', 7, 9]] },
  { date: '2026-06-21', label: '21.6.', goal: 'Týždenné opakovanie', mode: 'weekly-review', count: 8 },
  { date: '2026-06-22', label: '22.6.', goal: 'Prvý prejazd: E 10-12', ranges: [['Ekonómia a financie', 10, 12]] },
  { date: '2026-06-23', label: '23.6.', goal: 'Prvý prejazd: M 10-12', ranges: [['Manažment', 10, 12]] },
  { date: '2026-06-24', label: '24.6.', goal: 'Prvý prejazd: E 13-15', ranges: [['Ekonómia a financie', 13, 15]] },
  { date: '2026-06-25', label: '25.6.', goal: 'Prvý prejazd: M 13-15', ranges: [['Manažment', 13, 15]] },
  { date: '2026-06-26', label: '26.6.', goal: 'Prvý prejazd: E 16-18', ranges: [['Ekonómia a financie', 16, 18]] },
  { date: '2026-06-27', label: '27.6.', goal: 'Prvý prejazd: M 16-18', ranges: [['Manažment', 16, 18]] },
  { date: '2026-06-28', label: '28.6.', goal: 'Týždenné opakovanie', mode: 'weekly-review', count: 10 },
  { date: '2026-06-29', label: '29.6.', goal: 'Prvý prejazd: E 19-21', ranges: [['Ekonómia a financie', 19, 21]] },
  { date: '2026-06-30', label: '30.6.', goal: 'Prvý prejazd: M 19-21', ranges: [['Manažment', 19, 21]] },
  { date: '2026-07-01', label: '1.7.', goal: 'Prvý prejazd: E 22-24', ranges: [['Ekonómia a financie', 22, 24]] },
  { date: '2026-07-02', label: '2.7.', goal: 'Prvý prejazd: M 22-24', ranges: [['Manažment', 22, 24]] },
  { date: '2026-07-03', label: '3.7.', goal: 'Prvý prejazd: E 25-27', ranges: [['Ekonómia a financie', 25, 27]] },
  { date: '2026-07-04', label: '4.7.', goal: 'Prvý prejazd: M 25-27', ranges: [['Manažment', 25, 27]] },
  { date: '2026-07-05', label: '5.7.', goal: 'Týždenné opakovanie', mode: 'weekly-review', count: 12 },
  { date: '2026-07-06', label: '6.7.', goal: 'Prvý prejazd: E 28-30', ranges: [['Ekonómia a financie', 28, 30]] },
  { date: '2026-07-07', label: '7.7.', goal: 'Prvý prejazd: M 28-30', ranges: [['Manažment', 28, 30]] },
  { date: '2026-07-08', label: '8.7.', goal: 'Druhý prejazd: E 1-5', ranges: [['Ekonómia a financie', 1, 5]] },
  { date: '2026-07-09', label: '9.7.', goal: 'Druhý prejazd: E 6-10', ranges: [['Ekonómia a financie', 6, 10]] },
  { date: '2026-07-10', label: '10.7.', goal: 'Druhý prejazd: E 11-15', ranges: [['Ekonómia a financie', 11, 15]] },
  { date: '2026-07-11', label: '11.7.', goal: 'Druhý prejazd: E 16-20', ranges: [['Ekonómia a financie', 16, 20]] },
  { date: '2026-07-12', label: '12.7.', goal: 'Slabé Eko + krátke hovorenie', mode: 'subject-review', subject: 'Ekonómia a financie', count: 8 },
  { date: '2026-07-13', label: '13.7.', goal: 'Druhý prejazd: E 21-25', ranges: [['Ekonómia a financie', 21, 25]] },
  { date: '2026-07-14', label: '14.7.', goal: 'Druhý prejazd: E 26-30', ranges: [['Ekonómia a financie', 26, 30]] },
  { date: '2026-07-15', label: '15.7.', goal: 'Druhý prejazd: M 1-5', ranges: [['Manažment', 1, 5]] },
  { date: '2026-07-16', label: '16.7.', goal: 'Druhý prejazd: M 6-10', ranges: [['Manažment', 6, 10]] },
  { date: '2026-07-17', label: '17.7.', goal: 'Druhý prejazd: M 11-15', ranges: [['Manažment', 11, 15]] },
  { date: '2026-07-18', label: '18.7.', goal: 'Druhý prejazd: M 16-20', ranges: [['Manažment', 16, 20]] },
  { date: '2026-07-19', label: '19.7.', goal: 'Slabý Manažment + hovorenie', mode: 'subject-review', subject: 'Manažment', count: 8 },
  { date: '2026-07-20', label: '20.7.', goal: 'Druhý prejazd: M 21-25', ranges: [['Manažment', 21, 25]] },
  { date: '2026-07-21', label: '21.7.', goal: 'Druhý prejazd: M 26-30', ranges: [['Manažment', 26, 30]] },
  { date: '2026-07-22', label: '22.7.', goal: 'Mix slabých otázok', mode: 'mixed-review', count: 10 },
  { date: '2026-07-23', label: '23.7.', goal: 'Mix nových príkladov a prepájania', mode: 'mixed-review', count: 10 },
  { date: '2026-07-24', label: '24.7.', goal: 'Hovorenie nahlas: E 1-10 + M 1-10', ranges: [['Ekonómia a financie', 1, 10], ['Manažment', 1, 10]] },
  { date: '2026-07-25', label: '25.7.', goal: 'Hovorenie nahlas: E 11-20 + M 11-20', ranges: [['Ekonómia a financie', 11, 20], ['Manažment', 11, 20]] },
  { date: '2026-07-26', label: '26.7.', goal: 'Hovorenie nahlas: E 21-30 + M 21-30', ranges: [['Ekonómia a financie', 21, 30], ['Manažment', 21, 30]] },
  { date: '2026-07-27', label: '27.7.', goal: 'Slabé otázky: blok 1', mode: 'mixed-review', count: 12 },
  { date: '2026-07-28', label: '28.7.', goal: 'Slabé otázky: blok 2', mode: 'mixed-review', count: 12 },
  { date: '2026-07-29', label: '29.7.', goal: 'Slabé otázky: blok 3', mode: 'mixed-review', count: 12 },
  { date: '2026-07-30', label: '30.7.', goal: 'Párovanie tém a príkladov', mode: 'mixed-review', count: 10 },
  { date: '2026-07-31', label: '31.7.', goal: 'Skúšobné odpovede: náhodný mix', mode: 'mixed-review', count: 10 },
  { date: '2026-08-01', label: '1.8.', goal: 'Voľnejší deň alebo dobiehanie', mode: 'light-review', count: 6 },
  { date: '2026-08-02', label: '2.8.', goal: 'Tichý reset a krátke opakovanie', mode: 'light-review', count: 6 },
  { date: '2026-08-03', label: '3.8.', goal: 'Simulácia: E 1-15', ranges: [['Ekonómia a financie', 1, 15]] },
  { date: '2026-08-04', label: '4.8.', goal: 'Simulácia: E 16-30', ranges: [['Ekonómia a financie', 16, 30]] },
  { date: '2026-08-05', label: '5.8.', goal: 'Simulácia: M 1-15', ranges: [['Manažment', 1, 15]] },
  { date: '2026-08-06', label: '6.8.', goal: 'Simulácia: M 16-30', ranges: [['Manažment', 16, 30]] },
  { date: '2026-08-07', label: '7.8.', goal: 'Skúška na čas: 6 náhodných otázok', mode: 'mixed-review', count: 6 },
  { date: '2026-08-08', label: '8.8.', goal: 'Skúška na čas: 6 slabých otázok', mode: 'mixed-review', count: 6 },
  { date: '2026-08-09', label: '9.8.', goal: 'Voľnejší deň alebo dobiehanie', mode: 'light-review', count: 6 },
  { date: '2026-08-10', label: '10.8.', goal: 'Finále: 12 najslabších', mode: 'mixed-review', count: 12 },
  { date: '2026-08-11', label: '11.8.', goal: 'Finále: 12 ďalších slabých', mode: 'mixed-review', count: 12 },
  { date: '2026-08-12', label: '12.8.', goal: 'Finále: ekonomické jadro', mode: 'subject-review', subject: 'Ekonómia a financie', count: 8 },
  { date: '2026-08-13', label: '13.8.', goal: 'Finále: manažérske jadro', mode: 'subject-review', subject: 'Manažment', count: 8 },
  { date: '2026-08-14', label: '14.8.', goal: 'Krátke odpovede nahlas', mode: 'mixed-review', count: 8 },
  { date: '2026-08-15', label: '15.8.', goal: 'Len zopakovať kostry a kľúčové vzťahy', mode: 'light-review', count: 6 },
  { date: '2026-08-16', label: '16.8.', goal: 'Pokojný deň, minimum učenia', mode: 'light-review', count: 4 },
  { date: '2026-08-17', label: '17.8.', goal: 'Štátnice - bez učenia', mode: 'exam' }
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
  const isExamDay = day.mode === 'exam';
  $('#todayPlanLabel').textContent = isExamDay
    ? `${day.label} - ${day.goal}`
    : `${day.label} - ${day.goal} (${topics.length || 'podľa progresu'} otázok)`;
  $('#markTodayDone').style.display = isExamDay ? 'none' : '';
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
  if (day.mode === 'weekly-review') return byWeakness(['C', 'B', '']).slice(0, day.count || 8);
  if (day.mode === 'mixed-review') return byWeakness(['C', 'B', '']).slice(0, day.count || 10);
  if (day.mode === 'subject-review') {
    return byWeakness(['C', 'B', '']).filter((topic) => topic.subject === day.subject).slice(0, day.count || 8);
  }
  if (day.mode === 'light-review') return byWeakness(['C', 'B', '']).slice(0, day.count || 6);
  if (day.mode === 'exam') return [];
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
  if (mode === 'weekly-review') return 'Prejdi najslabšie alebo nové otázky z posledných dní a skús ich aspoň stručne povedať nahlas.';
  if (mode === 'mixed-review') return 'Vyber najmä C a B otázky, prepoj ich s príkladom a povedz ich bez čítania.';
  if (mode === 'subject-review') return 'Zameraj sa len na jeden predmet a upevni tie otázky, kde sa ešte zasekávaš.';
  if (mode === 'light-review') return 'Stačí krátke opakovanie kostier, kľúčových vzťahov a 3 až 6 otázok bez veľkého tlaku.';
  if (mode === 'exam') return 'Dnes sa už neuč. Jedlo, voda, doklady, presun a pokoj pred štátnicami.';
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

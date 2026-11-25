const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const state = { events: [], simulated: 0, activePage: 'overview', toastTimer: null };

const incidents = [
  { title: 'Password spraying detected', detail: '198.51.100.50  ·  5 accounts targeted', severity: 'high', status: 'investigating', time: '2m ago', icon: '⌁' },
  { title: 'Brute force against admin', detail: '203.0.113.100  ·  10 failed attempts', severity: 'critical', status: 'open', time: '8m ago', icon: '⌁' },
  { title: 'Unusual authentication pattern', detail: 'Multiple users  ·  Authentication', severity: 'medium', status: 'open', time: '16m ago', icon: '◉' }
];

function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
}
function showToast(message) {
  const toast = $('#toast'); toast.textContent = message; toast.classList.add('visible');
  clearTimeout(state.toastTimer); state.toastTimer = setTimeout(() => toast.classList.remove('visible'), 2800);
}
function eventUser(event) { return event.user?.name || event.user || 'unknown'; }
function eventIp(event) { return event.source?.ip || event.source_ip || '—'; }
function eventAction(event) { return event.event?.action || event.action || 'security_event'; }
function eventOutcome(event) { return event.event?.outcome || event.outcome || 'unknown'; }
function isThreat(event) { return eventOutcome(event) === 'failure' || /attack|suspicious|failed/i.test(event.message || ''); }
function formatTime(value) {
  const date = new Date(value); if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
function relativeTime(value, fallback) {
  const date = new Date(value); if (Number.isNaN(date.getTime())) return fallback;
  const mins = Math.max(0, Math.floor((Date.now() - date.getTime()) / 60000));
  return mins < 1 ? 'just now' : mins < 60 ? `${mins}m ago` : `${Math.floor(mins / 60)}h ago`;
}
function seedIncidents() {
  const threatEvents = state.events.filter(isThreat);
  if (threatEvents.length) {
    const byIp = new Map();
    threatEvents.forEach(event => { const ip = eventIp(event); byIp.set(ip, [...(byIp.get(ip) || []), event]); });
    const groups = [...byIp.entries()].sort((a, b) => b[1].length - a[1].length).slice(0, 3);
    groups.forEach(([, rows], index) => {
      if (index > 1) return;
      incidents[index].detail = `${eventIp(rows[0])}  ·  ${rows.length} failed event${rows.length === 1 ? '' : 's'}`;
      incidents[index].time = relativeTime(rows[rows.length - 1]['@timestamp'], incidents[index].time);
    });
  }
}
function renderIncidents() {
  const list = $('#incident-list'); if (!list) return;
  list.innerHTML = incidents.map(item => `<div class="incident-row"><div class="incident-severity ${item.severity}">${item.icon}</div><div class="incident-main"><b>${esc(item.title)}</b><span>${esc(item.detail)}</span></div><span class="incident-status ${item.status}">${item.status.toUpperCase()}</span><span class="incident-time">${esc(item.time)}</span><span class="row-arrow">›</span></div>`).join('');
}
function renderIncidentQueue(filter = 'all') {
  const rows = incidents.filter(item => filter === 'all' || item.status === filter);
  return `<div class="panel" style="padding:0;overflow:hidden"><div class="queue-header"><div><h3>Incident queue</h3><span>${incidents.length} simulated detections · triage state is saved in this session</span></div><select class="incident-filter" id="incident-filter" aria-label="Filter incidents"><option value="all" ${filter === 'all' ? 'selected' : ''}>All states</option><option value="open" ${filter === 'open' ? 'selected' : ''}>Open</option><option value="investigating" ${filter === 'investigating' ? 'selected' : ''}>Investigating</option><option value="resolved" ${filter === 'resolved' ? 'selected' : ''}>Resolved</option></select></div>${rows.length ? rows.map((item, i) => `<article class="queue-row"><div class="incident-severity ${item.severity}">${item.icon}</div><div class="incident-main"><b>${esc(item.title)}</b><span>${esc(item.detail)}</span></div><span class="incident-status ${item.status}">${item.status.toUpperCase()}</span><span class="incident-time">${esc(item.time)}</span><div class="incident-actions">${item.status === 'open' ? `<button data-incident="${incidents.indexOf(item)}" data-triage="investigating">Investigate</button>` : ''}${item.status !== 'resolved' ? `<button class="resolve" data-incident="${incidents.indexOf(item)}" data-triage="resolved">Resolve</button>` : '<span class="incident-status resolved">✓ RESOLVED</span>'}</div><div class="incident-detail">Review source activity and affected accounts. This simulated incident is based on the local authentication event dataset.</div></article>`).join('') : '<div class="empty-state">No incidents in this state.</div>'}</div>`;
}
function renderChart() {
  const total = state.events.length;
  if (!$('#chart-total')) return;
  $('#chart-total').textContent = total.toLocaleString();
  const svg = $('#activity-chart');
  const count = 25; const base = Array.from({ length: count }, (_, i) => 34 + 16 * Math.sin(i * .68) + 11 * Math.cos(i * .23) + (i > 15 && i < 20 ? 48 : 0) + (i > 20 ? 18 : 0));
  const threat = base.map((v, i) => Math.max(9, v * .16 + (i > 17 && i < 20 ? 31 : 0) + 7 * Math.cos(i * 1.1)));
  const x = i => i / (count - 1) * 760, y = v => 184 - Math.min(v, 115) / 115 * 172;
  const pathFor = arr => arr.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
  const line = pathFor(base), threatLine = pathFor(threat);
  svg.innerHTML = `<defs><linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4da9ff" stop-opacity=".27"/><stop offset="1" stop-color="#4da9ff" stop-opacity="0"/></linearGradient><linearGradient id="threatFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f39a59" stop-opacity=".13"/><stop offset="1" stop-color="#f39a59" stop-opacity="0"/></linearGradient></defs><path class="area" d="${line} L760,194 L0,194 Z"/><path class="threat-area" d="${threatLine} L760,194 L0,194 Z"/><path class="line" pathLength="1" d="${line}"/><path class="threat-line" pathLength="1" d="${threatLine}"/><circle cx="${x(18)}" cy="${y(base[18])}" r="4"/>`;
  const labels = $('#chart-labels');
  const current = new Date();
  const range = $('#range-select')?.value || '24h';
  const span = range === '7d' ? 6 * 24 : range === '30d' ? 29 * 24 : 24;
  labels.innerHTML = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(current.getTime() - (6 - i) * span / 6 * 60 * 60 * 1000);
    return `<span>${range === '24h' ? `${d.toLocaleTimeString([], { hour: '2-digit', hour12: false })}:00` : d.toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>`;
  }).join('');
}
function updateMetrics() {
  const n = state.events.length;
  if ($('#metric-events')) $('#metric-events').textContent = n.toLocaleString();
  if ($('#sidebar-events')) $('#sidebar-events').textContent = n.toLocaleString();
  if ($('#metric-blocked')) $('#metric-blocked').textContent = String(state.events.filter(event => eventOutcome(event) === 'failure').length);
  if ($('#severity-total')) $('#severity-total').textContent = String(state.events.filter(isThreat).length);
  if ($('#incident-nav-count')) $('#incident-nav-count').textContent = String(incidents.filter(i => i.status !== 'resolved').length).padStart(2, '0');
  if ($('#metric-incidents')) $('#metric-incidents').textContent = String(incidents.filter(i => i.status !== 'resolved').length).padStart(2, '0');
  if ($('#incident-summary')) $('#incident-summary').textContent = `${incidents.filter(i => i.status !== 'resolved' && ['critical', 'high'].includes(i.severity)).length} high priority`;
  if ($('.incidents-panel .title-count')) $('.incidents-panel .title-count').textContent = String(incidents.filter(i => i.status !== 'resolved').length).padStart(2, '0');
  if ($('.incidents-panel .muted-note')) $('.incidents-panel .muted-note').innerHTML = `<span class="status-dot amber-dot"></span> ${incidents.filter(i => i.status !== 'resolved').length} incidents need your attention`;
  renderChart(); renderIncidents();
}
function renderEventPage() {
  const rows = [...state.events].reverse();
  return `<div class="panel event-panel"><div class="panel-header event-panel-header"><div><div class="panel-title">Event stream <span class="title-count">${rows.length}</span></div><div class="panel-description">Normalized authentication events from simulated_events.json</div></div><div class="event-tools"><select id="event-outcome" aria-label="Filter by outcome"><option value="all">All outcomes</option><option value="failure">Failed</option><option value="success">Successful</option></select><input id="event-search" placeholder="Search users, IPs, outcomes…" aria-label="Search events"></div></div><div class="event-table-wrap"><table class="event-table"><thead><tr><th>TIME</th><th>USER</th><th>SOURCE IP</th><th>ACTION</th><th>OUTCOME</th><th>DETAIL</th></tr></thead><tbody id="event-rows">${eventRows(rows)}</tbody></table></div></div>`;
}
function eventRows(rows) {
  if (!rows.length) return '<tr><td colspan="6" class="empty-state">No events match your search.</td></tr>';
  return rows.map(event => `<tr><td>${esc(formatTime(event['@timestamp']))}</td><td>${esc(eventUser(event))}</td><td class="mono-cell">${esc(eventIp(event))}</td><td>${esc(eventAction(event))}</td><td><span class="outcome ${eventOutcome(event) === 'success' ? 'success' : 'failure'}">${esc(eventOutcome(event))}</span></td><td class="detail-cell">${esc(event.message || '—')}</td></tr>`).join('');
}
const pageContent = {
  incidents: ['Incident queue', 'Investigate, prioritize, and resolve security alerts from across your environment.', [['Open incidents', `${incidents.length} requiring triage`], ['High priority', 'Credential access activity'], ['Resolved today', 'Response workflow ready']]],
  'attack-map': ['MITRE ATT&CK map', 'Observed techniques mapped from authentication activity in this simulation.', [['T1110.003', 'Password spraying · Credential Access'], ['T1110.001', 'Brute force · Credential Access'], ['T1078', 'Valid accounts · Initial Access']]],
  detections: ['Detection rules', 'Manage the rules watching your authentication and access events.', [['Password spraying', 'Enabled · T1110.003'], ['Brute force', 'Enabled · T1110.001'], ['Privilege escalation', 'Ready to configure']]],
  integrations: ['Integrations', 'Connect your telemetry sources and keep your event pipeline flowing.', [['Event simulator', 'Connected · Local JSON'], ['Elasticsearch', 'Configure connection'], ['Detection engine', 'Operational · 3 rules']]]
};
function renderGenericPage(key) {
  const [title, description, tiles] = pageContent[key];
  return `<div class="generic-page"><div class="eyebrow"><span class="eyebrow-line"></span> CLOUDSTRIKE / ${key.replace('-', ' ').toUpperCase()}</div><h2>${esc(title)}<span class="heading-period">.</span></h2><p>${esc(description)}</p><div class="generic-grid">${tiles.map(([head, copy], i) => `<div class="generic-tile"><span class="technique-code">${i === 0 ? '01' : i === 1 ? '02' : '03'}</span><b>${esc(head)}</b><span>${esc(copy)}</span></div>`).join('')}</div></div>`;
}
function setPage(page) {
  state.activePage = page;
  $$('.nav-item').forEach(link => link.classList.toggle('active', link.dataset.page === page));
  $('#breadcrumb-current').textContent = page === 'attack-map' ? 'Attack map' : page === 'events' ? 'Event stream' : page.charAt(0).toUpperCase() + page.slice(1);
  $('#page-content').innerHTML = page === 'overview' ? originalDashboard : page === 'events' ? `<div class="eyebrow" style="margin-bottom:18px"><span class="eyebrow-line"></span> SIMULATED TELEMETRY</div><h1 style="margin-top:0">Event stream<span class="heading-period">.</span></h1><p class="page-subtitle" style="margin-bottom:22px">Inspect the normalized events powering your detections.</p>${renderEventPage()}<footer class="page-footer"><span>Showing ${state.events.length} events</span><span>LOCAL EVENT DATA</span><span>Updated <b>just now</b></span></footer>` : page === 'incidents' ? `<div class="eyebrow" style="margin-bottom:18px"><span class="eyebrow-line"></span> DETECTION &amp; RESPONSE</div><h1 style="margin-top:0">Incident queue<span class="heading-period">.</span></h1><p class="page-subtitle" style="margin-bottom:22px">Triage the signals surfaced by your simulated authentication activity.</p>${renderIncidentQueue()}<footer class="page-footer"><span>Local triage workspace</span><span>SESSION ONLY</span><span>${incidents.filter(i => i.status !== 'resolved').length} open</span></footer>` : renderGenericPage(page);
  if (page === 'overview') updateMetrics();
  if (page === 'events') {
    const input = $('#event-search'), outcome = $('#event-outcome');
    const applyFilters = () => {
      const q = input.value.toLowerCase(); const filtered = [...state.events].reverse().filter(e => (outcome.value === 'all' || eventOutcome(e) === outcome.value) && [eventUser(e), eventIp(e), eventAction(e), eventOutcome(e), e.message].join(' ').toLowerCase().includes(q));
      $('#event-rows').innerHTML = eventRows(filtered);
      $('.event-panel .title-count').textContent = `${filtered.length} / ${state.events.length}`;
    };
    input.addEventListener('input', applyFilters); outcome.addEventListener('change', applyFilters);
  }
}
let originalDashboard;
function runSimulation() {
  const now = new Date().toISOString(); const ip = `203.0.113.${Math.floor(Math.random() * 220) + 10}`;
  const type = $('#attack-type').value, target = $('#target-user').value, volume = Number($('#attack-volume').value);
  const users = type === 'spray' ? [target, 'sarah', 'alex', 'mohammed', 'john'].filter((user, i, all) => all.indexOf(user) === i) : [target];
  for (let i = 0; i < volume; i++) state.events.push({ event_id: `demo-${Date.now()}-${i}`, '@timestamp': now, user: { name: users[i % users.length] }, source: { ip }, event: { action: 'user_login', outcome: 'failure' }, message: `Simulated ${type === 'spray' ? 'password spray' : 'brute force'} attempt ${i + 1}` });
  state.simulated++; incidents.unshift({ title: type === 'spray' ? 'Password spraying detected' : 'Brute force activity detected', detail: `${ip}  ·  ${users.length} account${users.length === 1 ? '' : 's'} targeted`, severity: 'high', status: 'open', time: 'just now', icon: '⌁' });
  incidents.splice(5); closeModal(); updateMetrics(); setPage(state.activePage); showToast(`${type === 'spray' ? 'Password spray' : 'Brute force'} simulation · ${volume} events generated`);
}
function openModal() { const modal = $('#simulation-modal'); modal.classList.add('open'); modal.setAttribute('aria-hidden', 'false'); setTimeout(() => $('#attack-type').focus(), 80); }
function closeModal() { const modal = $('#simulation-modal'); modal.classList.remove('open'); modal.setAttribute('aria-hidden', 'true'); }
function exportReport() {
  const header = ['timestamp', 'user', 'source_ip', 'action', 'outcome', 'message'];
  const lines = [header, ...state.events.map(e => [e['@timestamp'], eventUser(e), eventIp(e), eventAction(e), eventOutcome(e), e.message || ''])].map(row => row.map(v => `"${String(v ?? '').replaceAll('"', '""')}"`).join(',')).join('\n');
  const link = document.createElement('a'); link.href = URL.createObjectURL(new Blob([lines], { type: 'text/csv' })); link.download = 'cloudstrike-security-events.csv'; link.click(); window.setTimeout(() => URL.revokeObjectURL(link.href), 1000); showToast('Security event report exported as CSV');
}
function bind() {
  document.addEventListener('click', event => {
    const nav = event.target.closest('[data-page]');
    if (nav) { event.preventDefault(); setPage(nav.dataset.page); window.location.hash = nav.dataset.page; }
    if (event.target.closest('#simulate-button')) openModal();
    if (event.target.closest('#export-button')) exportReport();
    if (event.target.closest('#open-incidents')) { setPage('incidents'); window.location.hash = 'incidents'; }
    if (event.target.closest('#notifications')) {
      const openCount = incidents.filter(item => item.status !== 'resolved').length;
      if (openCount) { setPage('incidents'); window.location.hash = 'incidents'; showToast(`${openCount} incident${openCount === 1 ? '' : 's'} need triage`); }
      else showToast('No open incidents. You’re all caught up.');
    }
    if (event.target.closest('#help-button')) showToast('Shortcuts: / or Ctrl+K searches events · Esc closes dialogs');
    if (event.target.closest('#profile-options')) showToast('Mohammed Z. · Security analyst · Local demo workspace');
    if (event.target.closest('#severity-info')) showToast('The severity colors are illustrative; failed-event totals come from your loaded data.');
    if (event.target.closest('#intro-skip')) dismissIntro();
    if (event.target.closest('[data-close-modal]') || event.target.id === 'simulation-modal') closeModal();
    const technique = event.target.closest('[data-technique]');
    if (technique) { setPage('attack-map'); window.location.hash = 'attack-map'; showToast(`${technique.dataset.technique} · mapped to the local attack simulation`); }
    if (event.target.closest('#incident-list .incident-row')) { setPage('incidents'); window.location.hash = 'incidents'; }
    const triage = event.target.closest('[data-triage]');
    if (triage) {
      const item = incidents[Number(triage.dataset.incident)];
      if (item) { item.status = triage.dataset.triage; updateMetrics(); setPage('incidents'); showToast(`Incident marked ${item.status}`); }
    }
  });
  document.addEventListener('submit', event => { if (event.target.id === 'simulation-form') { event.preventDefault(); runSimulation(); } });
  document.addEventListener('change', event => {
    if (event.target.id === 'range-select') { renderChart(); showToast(`Activity view set to ${event.target.selectedOptions[0].text.toLowerCase()}`); }
    if (event.target.id === 'incident-filter') setPageWithIncidentFilter(event.target.value);
  });
  $('#attack-volume').addEventListener('input', event => { $('#volume-label').textContent = `${event.target.value} events`; });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') closeModal();
    if ((event.key === 'Enter' || event.key === ' ') && event.target.matches('[data-technique]')) { event.preventDefault(); setPage('attack-map'); window.location.hash = 'attack-map'; showToast(`${event.target.dataset.technique} · mapped to the local attack simulation`); }
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); setPage('events'); setTimeout(() => $('#event-search')?.focus(), 0); }
    if (event.key === '/' && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) { event.preventDefault(); setPage('events'); setTimeout(() => $('#event-search')?.focus(), 0); }
  });
  const page = window.location.hash.slice(1); if (['overview', 'incidents', 'events', 'attack-map', 'detections', 'integrations'].includes(page)) setPage(page);
}
function setPageWithIncidentFilter(filter) {
  state.activePage = 'incidents';
  const oldFooter = $('.page-footer', $('#page-content'))?.outerHTML || '';
  const pageHeading = $('#page-content').innerHTML.split('<div class="panel"')[0];
  $('#page-content').innerHTML = `${pageHeading}${renderIncidentQueue(filter)}${oldFooter}`;
}
function dismissIntro() { const intro = $('#intro-screen'); if (!intro || intro.classList.contains('leaving')) return; intro.classList.add('leaving'); setTimeout(() => intro.remove(), 750); }
async function init() {
  originalDashboard = $('#page-content').innerHTML;
  $('#today-label').textContent = new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }).toUpperCase();
  try {
    const response = await fetch('../simulated_events.json', { cache: 'no-store' });
    if (!response.ok) throw new Error('Event data unavailable');
    state.events = await response.json();
  } catch {
    state.events = [
      { '@timestamp': new Date().toISOString(), user: { name: 'admin' }, source: { ip: '203.0.113.100' }, event: { action: 'user_login', outcome: 'failure' }, message: 'Failed login attempt 1' },
      { '@timestamp': new Date().toISOString(), user: { name: 'mohammed' }, source: { ip: '192.168.1.10' }, event: { action: 'user_login', outcome: 'success' }, message: 'Normal user authentication' }
    ];
    showToast('Showing preview data · start the local server to load simulated events');
  }
  seedIncidents(); updateMetrics(); bind();
  window.setTimeout(dismissIntro, 3300);
}
init();

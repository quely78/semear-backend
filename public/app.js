const state = { token: localStorage.getItem('semear_token'), usuario: JSON.parse(localStorage.getItem('semear_usuario') || 'null') };
const $ = (selector) => document.querySelector(selector);
const authView = $('#auth-view');
const dashboardView = $('#dashboard-view');
const message = $('#message');

function showMessage(text = '') { message.textContent = text; }
function setLoggedIn(usuario, token) {
  state.usuario = usuario; state.token = token;
  localStorage.setItem('semear_token', token); localStorage.setItem('semear_usuario', JSON.stringify(usuario));
  authView.classList.add('hidden'); dashboardView.classList.remove('hidden'); $('#logout-button').classList.remove('hidden');
  $('#greeting').textContent = `Olá, ${usuario.nome.split(' ')[0]}`;
  carregarPlantios();
}
function logout() {
  localStorage.removeItem('semear_token'); localStorage.removeItem('semear_usuario');
  state.token = null; state.usuario = null; dashboardView.classList.add('hidden'); authView.classList.remove('hidden'); $('#logout-button').classList.add('hidden');
}
async function request(url, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  if (state.token) headers.Authorization = `Bearer ${state.token}`;
  const response = await fetch(url, { ...options, headers });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || 'Não foi possível concluir a operação.');
  return data;
}

async function submitAuth(event, endpoint) {
  event.preventDefault(); showMessage('');
  const form = event.currentTarget;
  const dados = Object.fromEntries(new FormData(form));
  if (!dados.comunidadeId) delete dados.comunidadeId;
  try {
    const result = await request(`/auth/${endpoint}`, { method: 'POST', body: JSON.stringify(dados) });
    if (endpoint === 'login') setLoggedIn(result.usuario, result.token);
    else { switchAuth('login'); form.reset(); showMessage('Conta criada. Entre para começar a registrar.'); }
  } catch (error) { showMessage(error.message); }
}
async function carregarPlantios() {
  const list = $('#plantings-list'); list.innerHTML = '<div class="empty-state">Carregando seus plantios...</div>';
  try {
    const plantios = await request('/plantios');
    if (!plantios.length) { list.innerHTML = '<div class="empty-state">Nenhum plantio registrado ainda. Comece pelo primeiro ciclo.</div>'; return; }
    list.innerHTML = plantios.map((plantio) => `<article class="planting"><strong>${plantio.especie}</strong><span>${new Date(plantio.dataPlantio).toLocaleDateString('pt-BR')}</span><span>${plantio.tipoCultivo} · ${plantio.area} ha</span></article>`).join('');
  } catch (error) { list.innerHTML = `<div class="empty-state">${error.message}</div>`; }
}

$('[data-auth-tab="login"]').addEventListener('click', () => switchAuth('login'));
$('[data-auth-tab="register"]').addEventListener('click', () => switchAuth('register'));
function switchAuth(tab) {
  document.querySelectorAll('.tab').forEach((button) => button.classList.toggle('active', button.dataset.authTab === tab));
  $('#login-form').classList.toggle('hidden', tab !== 'login'); $('#register-form').classList.toggle('hidden', tab !== 'register'); showMessage('');
}
$('#login-form').addEventListener('submit', (event) => submitAuth(event, 'login'));
$('#register-form').addEventListener('submit', (event) => submitAuth(event, 'cadastro'));
$('#logout-button').addEventListener('click', logout);
$('#new-planting-button').addEventListener('click', () => $('#planting-dialog').showModal());
$('#close-dialog').addEventListener('click', () => $('#planting-dialog').close());
$('#planting-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  try { await request('/plantios', { method: 'POST', body: JSON.stringify(Object.fromEntries(new FormData(form))) }); form.reset(); $('#planting-dialog').close(); showMessage('Plantio salvo com sucesso.'); carregarPlantios(); }
  catch (error) { showMessage(error.message); }
});
$('#calendar-form').addEventListener('submit', async (event) => {
  event.preventDefault(); const especie = new FormData(event.currentTarget).get('especie'); const result = $('#calendar-result');
  try { const calendario = await request(`/calendario/${encodeURIComponent(especie)}`); result.textContent = `Plantio: ${calendario.epocaPlantio} · Colheita: ${calendario.epocaColheita}`; result.classList.remove('hidden'); }
  catch (error) { result.textContent = error.message; result.classList.remove('hidden'); }
});

if (state.token && state.usuario) setLoggedIn(state.usuario, state.token);

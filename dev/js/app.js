const { ipcRenderer } = require('electron');

let allServers = [];
let quietMode = false;

const listEl = document.getElementById('server-list');
const template = document.getElementById('server-template');
const addBtn = document.getElementById('add-server');
const quietBtn = document.getElementById('quiet-mode');

function reportHeight() {
  ipcRenderer.send('doc-height', document.body.offsetHeight);
}

function findServer(id) {
  return allServers.find((s) => String(s.id) === String(id));
}

function render() {
  listEl.innerHTML = '';

  for (const server of allServers) {
    const node = template.content.firstElementChild.cloneNode(true);
    node.dataset.id = server.id;

    node.querySelector('[data-field="name"]').textContent = server.name;
    node.querySelector('[data-field="port"]').textContent = server.port;

    const compileBtn = node.querySelector('[data-action="compile"]');
    if (!server.compileDir) compileBtn.classList.add('hidden');

    const statusBtn = node.querySelector('[data-action="toggle-status"]');
    statusBtn.classList.remove('fa-circle', 'fa-times-circle', 'on', 'off');
    statusBtn.classList.add(quietMode ? 'fa-times-circle' : 'fa-circle');
    statusBtn.classList.add(server.status === 'on' ? 'on' : 'off');

    const settingsEl = node.querySelector('.settings');
    if (!server.settings) settingsEl.classList.add('hidden');

    for (const input of node.querySelectorAll('[data-input]')) {
      const field = input.dataset.input;
      input.value = server[field] ?? '';
      input.addEventListener('input', () => {
        const s = findServer(node.dataset.id);
        if (!s) return;
        s[field] = input.type === 'number' ? Number(input.value) : input.value;
      });
      input.addEventListener('change', () => {
        const s = findServer(node.dataset.id);
        if (s) ipcRenderer.send('update-server', s);
      });
    }

    listEl.appendChild(node);
  }

  reportHeight();
}

function toggleSettings(server) {
  const model = JSON.parse(JSON.stringify(server));
  model.settings = !model.settings;
  ipcRenderer.send('update-server', model);
}

function toggleStatus(server) {
  if (quietMode) return;
  ipcRenderer.send('toggle-request', server);
}

listEl.addEventListener('click', (e) => {
  const actionEl = e.target.closest('[data-action]');
  if (!actionEl) return;
  const section = actionEl.closest('section');
  const id = section?.dataset.id;
  const server = findServer(id);
  if (!server) return;

  switch (actionEl.dataset.action) {
    case 'launch':
      ipcRenderer.send('open-url', server.port);
      break;
    case 'toggle-settings':
      toggleSettings(server);
      break;
    case 'compile':
      ipcRenderer.send('compile-site', server.id);
      break;
    case 'toggle-status':
      toggleStatus(server);
      break;
    case 'delete':
      ipcRenderer.send('delete-server', server.id);
      break;
  }
});

addBtn.addEventListener('click', () => {
  ipcRenderer.send('new-server', 'addServer Clicked');
});

quietBtn.addEventListener('click', () => {
  if (!quietMode) {
    for (const s of allServers) {
      if (s.status === 'on') toggleStatus(s);
    }
  }
  quietMode = !quietMode;
  quietBtn.classList.toggle('fa-check-circle', !quietMode);
  quietBtn.classList.toggle('fa-times', quietMode);
  render();
});

ipcRenderer.on('force-update', (_event, servers) => {
  allServers = servers;
  render();
});

ipcRenderer.send('update-request', 'Go!');

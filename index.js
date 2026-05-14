const { app, ipcMain, shell } = require('electron');
const { menubar } = require('menubar');
const { fork } = require('child_process');
const path = require('path');
const fs = require('fs');

let mb;
app.whenReady().then(() => {
  setupIpc();
  mb = menubar({
    index: `file://${path.join(__dirname, 'app', 'index.html')}`,
    icon: path.join(__dirname, 'dark.png'),
    preloadWindow: true,
    browserWindow: {
      width: 250,
      height: 400,
      resizable: true,
      minHeight: 100,
      fullscreenable: false,
      useContentSize: true,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false,
      },
    },
  });
  mb.on('ready', () => console.log('app is ready'));
});

function HarpServer(serverObject) {
  this.port = serverObject.port;
  this.status = serverObject.status;
  this.dir = serverObject.dir;
  this.compileDir = serverObject.compileDir;
  this.name = serverObject.name;
  this.settings = serverObject.settings;
  this.id = serverObject.id;
}

HarpServer.prototype.serve = function (callback) {
  const _this = this;
  const workerPath = path.join(__dirname, 'harp-worker.js');

  this.server = fork(workerPath, [], { silent: false });
  this.server.send({ type: 'start', dir: this.dir, port: this.port });

  this.server.on('message', (m) => {
    if (m === 'running') {
      _this.status = 'on';
      if (callback) callback();
    } else {
      console.log(m);
    }
  });
};

HarpServer.prototype.stop = function (callback) {
  const _this = this;
  if (this.server && this.server.connected) {
    this.server.send('stop');
    this.server.on('exit', (code, signal) => {
      _this.status = 'off';
      if (callback) callback();
      console.log('Child exited:', code, signal);
    });
  } else {
    this.status = 'off';
    if (callback) callback();
  }
};

HarpServer.prototype.compile = function (callback) {
  const harp = require('harp');
  if (this.compileDir) {
    harp.compile(this.dir, this.compileDir, (errors, output) => {
      console.log(output, errors);
      if (callback) callback();
    });
  } else {
    console.log('error, no compileDir');
  }
};

HarpServer.prototype.serverObject = function () {
  return {
    port: this.port,
    status: this.status,
    dir: this.dir,
    settings: this.settings,
    compileDir: this.compileDir,
    name: this.name,
    id: this.id,
  };
};

HarpServer.prototype.update = function (newServerObject, callback) {
  const _this = this;
  const apply = () => {
    _this.port = newServerObject.port;
    _this.dir = newServerObject.dir;
    _this.compileDir = newServerObject.compileDir;
    _this.settings = newServerObject.settings;
    _this.name = newServerObject.name;
  };

  if (this.status === 'on') {
    this.stop(() => {
      apply();
      _this.serve(() => callback());
    });
  } else {
    apply();
    callback();
  }
};

function setupIpc() {
  const storagePath = path.join(app.getPath('userData'), 'servers.json');
  const legacyPath = path.join(__dirname, 'servers.json');
  const isEmpty = (p) => {
    try {
      const data = JSON.parse(fs.readFileSync(p));
      return Array.isArray(data) && data.length === 0;
    } catch {
      return true;
    }
  };
  if ((!fs.existsSync(storagePath) || isEmpty(storagePath)) && fs.existsSync(legacyPath)) {
    fs.mkdirSync(path.dirname(storagePath), { recursive: true });
    fs.copyFileSync(legacyPath, storagePath);
    console.log('Migrated servers.json into', storagePath);
  }

  function HarpServers(storagePath) {
    const _this = this;
    const servers = {};

    if (fs.existsSync(storagePath)) {
      const saveData = JSON.parse(fs.readFileSync(storagePath));
      for (const s of saveData) servers[s.id] = new HarpServer(s);
    } else {
      fs.writeFileSync(storagePath, JSON.stringify([], null, 4));
    }

    for (const key in servers) {
      if (servers[key].status === 'on') {
        servers[key].serve();
      }
    }

    this.new = function (serverObject) {
      servers[serverObject.id] = new HarpServer(serverObject);
      this.save();
    };

    this.update = function (serverObject, callback) {
      servers[serverObject.id].update(serverObject, () => {
        _this.save();
        callback();
      });
    };

    this.delete = function (id) {
      servers[id].stop();
      delete servers[id];
      this.save();
    };

    this.toggle = function (id, callback) {
      if (servers[id].status === 'on') {
        servers[id].stop(() => {
          _this.save();
          callback();
        });
      } else {
        servers[id].serve(() => {
          _this.save();
          callback();
        });
      }
    };

    this.compile = function (id, callback) {
      servers[id].compile(() => {
        if (callback) callback();
      });
    };

    this.findSO = function (id) {
      return servers[id].serverObject();
    };

    this.findAllSO = function () {
      return Object.values(servers).map((s) => s.serverObject());
    };

    this.save = function () {
      fs.writeFileSync(storagePath, JSON.stringify(this.findAllSO(), null, 4));
    };
  }

  const serverData = new HarpServers(storagePath);

  ipcMain.on('update-request', (event) => {
    event.sender.send('force-update', serverData.findAllSO());
  });

  ipcMain.on('new-server', (event) => {
    const server = {
      id: +new Date(),
      name: 'New Server',
      port: 9000,
      dir: path.join(__dirname, 'app', 'lib', 'starter'),
      status: 'off',
      settings: true,
      compileDir: '',
    };
    serverData.new(server);
    event.sender.send('force-update', serverData.findAllSO());
  });

  ipcMain.on('delete-server', (event, id) => {
    serverData.delete(id);
    event.sender.send('force-update', serverData.findAllSO());
  });

  ipcMain.on('update-server', (event, server) => {
    serverData.update(server, () => {
      event.sender.send('force-update', serverData.findAllSO());
    });
  });

  ipcMain.on('toggle-request', (event, server) => {
    if (server.settings) {
      server.settings = !server.settings;
      serverData.update(server, () => {
        serverData.toggle(server.id, () => {
          event.sender.send('force-update', serverData.findAllSO());
        });
      });
    } else {
      serverData.toggle(server.id, () => {
        event.sender.send('force-update', serverData.findAllSO());
      });
    }
  });

  ipcMain.on('compile-site', (event, id) => {
    serverData.compile(id, () => console.log('Compiled!'));
  });

  ipcMain.on('open-url', (event, port) => {
    shell.openExternal(`http://localhost:${port}`);
  });

  ipcMain.on('doc-height', (event, height) => {
    if (!mb || !mb.window) return;
    const newHeight = Math.max(100, Math.round(height));
    mb.window.setSize(250, newHeight);

    if (process.platform === 'win32') {
      mb.positioner.move('bottomRight');
    } else {
      mb.positioner.move('trayCenter', mb.tray.getBounds());
    }
  });
}

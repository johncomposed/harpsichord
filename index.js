/* global require, __dirname */

var menubar = require('menubar');
var forkme = require('forkme');
var path = require('path');


// note: grunt copied image is broken - why?
var mb = menubar({ dir: path.join(__dirname,'app'), icon: path.join(__dirname,'dark.png'), preloadWindow: true, width: 250, resizable: false, fullscreen: false });


// Create harpServer object
var harpServer = function(serverObject) {
  console.log("New hs made");
  
  this.port = serverObject.port;
  this.status = serverObject.status;
  this.dir = serverObject.dir;
  this.compileDir = serverObject.compileDir;
  this.name = serverObject.name;
  this.settings = serverObject.settings;
  this.id = serverObject.id; 
  
};

harpServer.prototype.serve = function(callback){
  var _this = this;
  
  this.server = forkme([this], function(parent) { 
    // NOTE: Now running in a forked child process
    var harp = require("harp");
    
    harp.server(parent.dir, { port: parent.port }, function (errors){
      if (errors) {
        console.log(JSON.stringify(errors, null, 2));
        process.exit(1);
      }
      console.log('Running harp at '+ parent.dir +' on ' + parent.port);
      process.send("running");
    });
    
    process.on('message', function(m) {
      var options = {
        'stop': function() { process.exit(1); },
        'sayhi': function() { process.send("hi"); }
      };
      
      if (options[m]) {
        options[m]();
      } else {
        console.log(m);
      }      
    });
    
    // Make sure it exits if not connected
    process.on('disconnect',function() {
      process.exit();
    });
    
  });
  
  // Listen for messages, will later use for logs
  this.server.on('message', function(m) {
    var options = {
      'running': function() { _this.status = "on"; if (callback) { callback(); } }
    };

    if (options[m]) {
      options[m]();
    } else {
      console.log(m);
    }
  });
  
};

harpServer.prototype.stop = function(callback){
  var _this = this;
  if (this.server && this.server.connected) {
    this.server.send('stop');
    
    this.server.on('exit', function (code, signal) {
      _this.status = "off";
      if (callback) { callback(); }
      console.log('Child exited:', code, signal);

    });
  } else {
    console.log("tried to stop "+ this.id + " when no harp server running");
    this.status = "off";
    if (callback) { callback(); }
  }
  
};

harpServer.prototype.compile = function(callback){
  var _this = this;
  var harp = require("harp");

  if (this.compileDir) {
    harp.compile(this.dir, this.compileDir, function(errors, output){
      console.log(output, errors);

      if (callback) { callback(); }
    });
  } else {
    console.log("error, no compiledir");
  }
  

  
  
};

harpServer.prototype.serverObject = function() {
  var serverObj = {};
  serverObj.port = this.port;
  serverObj.status = this.status;
  serverObj.dir = this.dir;
  serverObj.settings = this.settings;
  serverObj.compileDir = this.compileDir;
  serverObj.name = this.name;
  serverObj.id = this.id; 

  return serverObj;
};

harpServer.prototype.update = function(newServerObject, callback) {
  var _this = this;
  if (this.status === 'on') {
    this.stop(function(){
      _this.port = newServerObject.port;
      _this.dir = newServerObject.dir;
      _this.compileDir = newServerObject.compileDir;
      _this.settings = newServerObject.settings;
      _this.name = newServerObject.name;

      _this.serve(function(){ callback(); });
    });
    
    
  } else {
    this.port = newServerObject.port;
    this.dir = newServerObject.dir;
    this.compileDir = newServerObject.compileDir;
    this.settings = newServerObject.settings;
    this.name = newServerObject.name;
    callback();
  }
};



mb.on('ready', function ready () {
  console.log('app is ready');

  var fs = require("fs");
  var ipc = require('ipc');
  var shell = require('shell');
  var BrowserWindow = require('browser-window');
  var storagePath = path.join(__dirname, "servers.json");
  

  
  /////////////////////////
  // harpServers object functions
  var harpServers = function(storagePath) { 
    var _this = this;

    // Object containing all harp server instances
    // Private so nothing interacts with it directly
    var harpServers = {};
    
    // Load up saved data or create storage file if it doesn't exist
    if (fs.existsSync(storagePath)) {
      var saveData = JSON.parse(fs.readFileSync(storagePath));
      // Load up harp servers
      for (var i = 0; i < saveData.length; i++) {
        harpServers[saveData[i].id] = new harpServer(saveData[i]);
      }
      console.log("Harp servers found and loaded up");
    } else {
      fs.writeFileSync(storagePath, JSON.stringify([], null, 4));
    }
    
    // Start up any harp servers with status on 
    for (var key in harpServers) {
      if (harpServers[key].status === "on") {
        harpServers[key].serve();
        console.log("Started up " + harpServers[key].name);
      }
    } 
    
    
    // Public Functions
    // New Server
    this.new = function(serverObject){
      harpServers[serverObject.id] = new harpServer(serverObject);
      this.save();
    };
    
    // Update Server
    this.update = function(serverObject,callback) {
      harpServers[serverObject.id].update(serverObject, function(){
        _this.save();
        callback();
      });
    };

    // Delete Server
    this.delete = function(id) {
      harpServers[id].stop();
      delete harpServers[id];
      this.save();
    };
    
    // Start or stop a server
    this.toggle = function(id, callback) {
      if (harpServers[id].status === "on") {
        harpServers[id].stop(function () {
          console.log(harpServers[id].name + " stopped");
          _this.save();
          callback();
        });
      } else {
        harpServers[id].serve(function () {
          _this.save();
          callback();
        });
      }
    };
    
    // Compile a site
    this.compile = function(id, callback) {
      harpServers[id].compile(function(){
        if (callback) { callback(); }
      });
    };
    
    // Find and return serverObject
    this.findSO = function(id) {
      return harpServers[id].serverObject();
    };
    
    // Find and return all server objects
    this.findAllSO = function() {
      var allSO = [];
      for (var key in harpServers) {      
        allSO.push(harpServers[key].serverObject());
      } 
      return allSO;
    };
    
    // Save all server objects.
    this.save = function() {
      fs.writeFileSync(storagePath, JSON.stringify(this.findAllSO(), null, 4));  
    }; 
    
  };
  
  
  /////////////////////////
  // Startup function  
  var serverData = new harpServers(storagePath);
  

  
  /////////////////////////
  // Listen from frontend
   
  // Update window scope
  ipc.on('update-request', function(event,message) {
    console.log(message);
    event.sender.send('force-update', serverData.findAllSO());
  });  
  
  // Listen for a new server
  ipc.on('new-server', function(event, message) {
    console.log(message);
    
    var server = {
      id: +new Date(),
      name: "New Server",
      port: 9000,
      dir: path.join(__dirname,"app","lib","starter"),
      status: "off",
      settings: true,
      compileDir: ""
    }
    
    serverData.new(server);
    event.sender.send('force-update', serverData.findAllSO());
  });

  // Delete server
  ipc.on('delete-server', function(event, id) {
    serverData.delete(id);
    event.sender.send('force-update', serverData.findAllSO());
  });
  
  // Listen for an updated server
  ipc.on('update-server', function(event, server) {
    serverData.update(server, function() {
      console.log("Updated server "+server.name);
      event.sender.send('force-update', serverData.findAllSO());
    });
  }); 
  
  // Listen for toggle harp server request
  ipc.on('toggle-request', function(event, server) {
    
    // TODO: a better solution for this, but at least the UX is better this way
    if (server.settings) {
      server.settings = !server.settings; 
      
      serverData.update(server, function() { 
        serverData.toggle(server.id, function () {
          console.log("Updated and toggled" + server.id);
          event.sender.send('force-update', serverData.findAllSO());
        }); 
      });
    } else {
      serverData.toggle(server.id, function () {
        console.log("Toggled" + server.id);
        event.sender.send('force-update', serverData.findAllSO());
      });
    }
    
  });
  
  // Compile a server
  ipc.on('compile-site', function(event, id) {
    serverData.compile(id, function() {
      console.log("Compiled!");
    });
  });
  
  // Open a requested localhost:port in external browser 
  ipc.on('open-url', function(event, port) {
    //event.sender.toggleDevTools();
    shell.openExternal("http://localhost:" + port);
  });
  
  // Resize window to requested height
  ipc.on('doc-height', function(event,height) {
    mb.window.setSize(250, height);
  });  
  

    
});

/* global require, __dirname */

var menubar = require('menubar');
var forkme = require('forkme');
var path = require('path');


// note: grunt copied image is broken - why?
var mb = menubar({ dir: __dirname + '/app', icon:__dirname + '/dark.png', preloadWindow: true, transparent: true, fullscreen: false });




var harpServer = function(serverObject) {
  console.log("New hs made");
  
  this.port = serverObject.port;
  this.status = serverObject.status;
  this.dir = serverObject.dir;
  this.compileDir = serverObject.compileDir;
  this.name = serverObject.name;
  this.id = serverObject.id; 
  
  //this.logfile = logfilePath;  // TODO
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
  } else {
    console.log("tried to stop "+ this.id + " when no harp server running");
    this.status = "off";
    if (callback) { callback(); }
  }
  
  this.server.on('exit', function (code, signal) {
    _this.status = "off";
    if (callback) { callback(); }
    console.log('Child exited:', code, signal);

  });
};

harpServer.prototype.serverObject = function() {
    var serverObj = {};
    serverObj.port = this.port;
    serverObj.status = this.status;
    serverObj.dir = this.dir;
    serverObj.compileDir = this.compileDir;
    serverObj.name = this.name;
    serverObj.id = this.id; 
  
    return serverObj;
};

harpServer.prototype.compile = function(){};
harpServer.prototype.isRunning = function(){};

harpServer.prototype.update = function(newServerObject) {
  var _this = this;
  if (this.status === 'on') {
    this.stop();
    this.server.on('exit', function (code, signal) {
      _this.port = newServerObject.port;
      _this.dir = newServerObject.dir;
      _this.compileDir = newServerObject.compileDir;
      _this.name = newServerObject.name;
      _this.serve();
    });
    
    
  } else {
    this.port = newServerObject.port;
    this.dir = newServerObject.dir;
    this.compileDir = newServerObject.compileDir;
    this.name = newServerObject.name;
  }
};



mb.on('ready', function ready () {
  console.log('app is ready');

  var fs = require("fs");
  var path = require('path');
  var ipc = require('ipc');
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
    this.update = function(serverObject) {
      harpServers[serverObject.id].update(serverObject);
      this.save();
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
  
  // Send list of servers to mb
  ipc.on('request-servers', function(event, arg) {
    console.log(arg);
    event.returnValue = serverData.findAllSO();
  });
  
  // Listen for a new server
  ipc.on('new-server', function(event, server) {
    serverData.new(server);
  });
  
  // Listen for server setting changes  
  ipc.on('edit-server', function(event, id) {
    var win = new BrowserWindow({
       "width": 400,
       "height": 600
    });
    win.loadUrl('file://' + __dirname + '/app/settings.html');
    console.log("Sending:");  
    win.show();
    //win.openDevTools();
    
    ipc.on('gimme-settings', function(event, arg) {
      win.webContents.send('load-settings', serverData.findSO(id));
    });
  });
  
  // Listen for an updated server
  ipc.on('update-server', function(event, server) {
    console.log("update server received");
    serverData.update(server);
    mb.window.webContents.send('force-update', 'ping');
    
  });  
  
  // Toggle harp server
  ipc.on('toggle-request', function(event, id) {
    serverData.toggle(id, function () {
      console.log(serverData.findAllSO());
      event.sender.send('toggle-response', id);
    });
    
  });
  
  
  
  
  
});



// Listen for window creating functions






// Listen for window creating functions
  // server settings
    // make window
    // pass settings if exists
  // show logs 
    // make window 
    // pass logs

// listen for saving/updating a server
  // if it doesn't exist, add a new record with uuid
  // send updated status to menubar


// Start/stop a harp server
  // pretty much just run it from the settings file passed in
  // if no uuid log file exists start that up then send it the logs



//var dir = __dirname + "/starter";
//var port = 9000;
//
//harp.server(dir, { port: port }, function (errors){
//  if (errors) {
//    console.log(JSON.stringify(errors, null, 2));
//    process.exit(1);
//  }
//
//  console.log('Running harp at '+ dir +' on ' + port)
//});



//var express = require("express");
//var harp = require("harp");
//var app = express();
//
//app.use(express.static(__dirname + "/public"));
//app.use(harp.mount(__dirname + "/public"));
//
//app.listen(9000);


//app.close()





//event.sender.toggleDevTools();

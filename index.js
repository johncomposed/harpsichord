/* global require, __dirname */

var menubar = require('menubar');
var forkme = require('forkme');

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

harpServer.prototype.serve = function(){
  this.server = forkme([this], function(parent) { 
    // NOTE: Now running in a forked child process
    var harp = require("harp");
    
    harp.server(parent.dir, { port: parent.port }, function (errors){
      if (errors) {
        console.log(JSON.stringify(errors, null, 2));
        process.exit(1);
      }
      console.log('Running harp at '+ parent.dir +' on ' + parent.port);
    });
    
    process.on('message', function(m) {
      var options = {
        'stop': function() { process.exit(1); },
        'sayhi': function() { process.send("hi"); }
      };
      
      options[m]();
      
    });
    
    // Make sure it exits if not connected
    process.on('disconnect',function() {
      process.exit();
    });
    
  });
  
  // Listen for messages, will later use for logs
  this.server.on('message', function(m) {
    // Receive results from child process
    console.log('received: ' + m);
  });
  
};



harpServer.prototype.stop = function(){
  if (this.server.connected) {
    this.server.send('stop');
  }
  
  this.server.on('exit', function (code, signal) {
    console.log('Child exited:', code, signal);
  });
  
  
};




harpServer.prototype.compile = function(){};
harpServer.prototype.isRunning = function(){};
harpServer.prototype.update = function(newServerObject){};



mb.on('ready', function ready () {
  console.log('app is ready');

  var fs = require("fs");
  var path = require('path');
  var ipc = require('ipc');
  
  var storagePath = path.join(__dirname, "servers.json");
  var saveServers = function(theData) {
    fs.writeFileSync(storagePath, JSON.stringify(theData, null, 4));
  };
  var updateServer = function(updated) {
    for (var i = 0; i < data.length; i++) {
      if (data[i].id === updated.id) {
          data[i] = updated;
      }
    }
    saveServers(data);
  };
  var findServer = function(id) {
    for (var i = 0; i < data.length; i++) {
      if (data[i].id === id) {
          return data[i];
      }
    }
  };
  
  
  /////////////////////////
  // Startup functions
  var data;
  var hServers = {};
  
  // Set data to storage file contents 
  // or create storage file if it doesn't exist
  if (fs.existsSync(storagePath)) {
    data = JSON.parse(fs.readFileSync(storagePath));
  } else {
    data = [];
    saveServers(data);
  }
 
  // Load up hserver instances
  for (var i = 0; i < data.length; i++) {
    hServers[data[i].id] = new harpServer(data[i]);
  }
  
  
  
  
  
  
  
  /////////////////////////
  // Listen from frontend
  
  // Send list of servers to mb
  ipc.on('request-servers', function(event, arg) {
    console.log(arg);
    event.returnValue =  data;
  });
  
  
  // Listen for a new server
  ipc.on('new-server', function(event, server) {
    hServers[server.id] = new harpServer(server);
    
    data.push(server);
    saveServers(data);
  });
  
  // Listen for server setting changes  
  ipc.on('edit-server', function(event, server) {
    updateServer(server);
  });
  
  
  // Toggle harp server
  ipc.on('toggle-request', function(event, id) {
    console.log(id);  // prints "ping"
    var requested = findServer(id);

    if (requested.status === "on") {
      requested.status = "off";
      hServers[id].stop();

    } else {
      requested.status = "on";
      hServers[id].serve();
    }
    updateServer(requested);

    event.sender.send('toggle-response', id);
    
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

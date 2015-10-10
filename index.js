/* global require, __dirname */

var menubar = require('menubar');

// note: grunt copied image is broken - why?
var mb = menubar({ dir: __dirname + '/app', icon:__dirname + '/dark.png', preloadWindow: true, transparent: true, fullscreen: false });




mb.on('ready', function ready () {
  console.log('app is ready');

  var fs = require("fs");
  var path = require('path');
  var ipc = require('ipc');
  var data;
  
  var storagePath = path.join(__dirname, "servers.json");
  var storageFile = fs.readFileSync(storagePath);

  var helloWorldServer = {
    id: Date.now(),
    name: "Hello World Server",
    port: 9000,
    status: "off",
    dir: path.join(__dirname, "/app/lib/starter/"),
    compileDir: ""
    
  };
  

  
  // Set data to storage file contents 
  // or create storage file if it doesn't exist
  if (storageFile) {
    data = JSON.parse(storageFile);
  } else {
    data = [helloWorldServer];
    fs.writeFileSync(storagePath, JSON.stringify(data));
  }
 
  
  
  
  
});



// Listen for window creating functions

//ipc.on('blah', somefunc);




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



//var harp = require("harp");
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


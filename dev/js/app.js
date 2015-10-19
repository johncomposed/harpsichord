// Meanwhile, in root scope: ipc! 
// Man, electron is weird.
var ipc = require('ipc');

// Starting angular app
var app = angular.module('harpsichord', []);

// Menubar controller
app.controller('serverListController', function($scope) {

  var _this = $scope;

  _this.quietMode = false;
  
  var helloWorldServer = {
    id: +new Date(),
    name: "New Server",
    port: 9000,
    dir: "/Users/john/Github/autoHarp/harpsichord/app/lib/starter/",
    status: "off",
    settings: true,
    compileDir: ""
  };
  

  ipc.on('force-update', function(servers) {
    console.log('force updated'); 
    $scope.$apply(function(){
      _this.allServers = servers;
    });
    $scope.$apply(function(){
      ipc.send('doc-height', document.body.offsetHeight);
    });
  });
   
  
  _this.init = function () {
    ipc.send('update-request', "Go!");
  };
  
  _this.allServers = {};
    
  _this.addServer = function() {
    console.log("addServer clicked");
    ipc.send('new-server', helloWorldServer);
  };
  
  _this.deleteServer = function(id) {
    ipc.send('delete-server', id);
  };
  
  _this.toggleStatus = function(id) {
    if (!_this.quietMode) {
      ipc.send('toggle-request', id);
      
      ipc.on('toggle-response', function() {
        ipc.send('update-request', "Go!");
      });
    }    
  };
  
  _this.toggleQuietMode = function() {
    if (!_this.quietMode) {
      for (var i = 0; i < _this.allServers.length; i++) {
        if (_this.allServers[i].status === "on") {
          _this.toggleStatus(_this.allServers[i].id);
        }    
      }
      _this.quietMode = true;
    } else {
      _this.quietMode = false;
    }
  };
  
  _this.launchSite = function(port) {
    ipc.send('open-url', port);
  };
  
  _this.toggleSettings = function(server) { 
    if (!server.settings) {
      server.settings = true;
    } else {
      server.settings = false;
    }
    ipc.send('update-server', server);    
  };

  _this.compileSite = function(id) {
    ipc.send('compile-site', id);
  };
  
  
  
  _this.init();
});


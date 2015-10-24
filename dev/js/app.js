// Meanwhile, in root scope: ipc! 
// Man, electron is weird.
var ipc = require('ipc');

// Starting angular app
var app = angular.module('harpsichord', []);

// Menubar controller
app.controller('serverListController', function($scope) {

  var _this = $scope;

  _this.quietMode = false;

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
    ipc.send('new-server', "addServer Clicked");
  };
  
  _this.deleteServer = function(id) {
    ipc.send('delete-server', id);
  };
  
  _this.toggleStatus = function(server) {
    if (!_this.quietMode) {      
      ipc.send('toggle-request', server);
    }
  };
  
  _this.toggleQuietMode = function() {
    if (!_this.quietMode) {
      for (var i = 0; i < _this.allServers.length; i++) {
        if (_this.allServers[i].status === "on") {
          _this.toggleStatus(_this.allServers[i].id);
        }    
      }
    } 
    
    _this.quietMode = !_this.quietMode;
  };
  
  _this.launchSite = function(port) {
    ipc.send('open-url', port);
  };
  
  _this.toggleSettings = function(server) { 
    // Copying server object so scope is updated after ipc.send
    var model = JSON.parse(JSON.stringify(server));
    model.settings = !model.settings; 
    
    ipc.send('update-server', model);    
  };

  _this.compileSite = function(id) {
    ipc.send('compile-site', id);
  };
  
  
  _this.init();
});

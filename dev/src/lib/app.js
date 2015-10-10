// Meanwhile, in root scope: ipc! 
// Man, electron is weird.
var ipc = require('ipc');

// Starting angular app
var app = angular.module('harpsichord', []);

// Menubar controller
app.controller('serverListController', function( $rootScope, $scope) {

  var _this = $scope;
  var helloWorldServer = {
    id: Date.now(),
    name: "Hello World Server",
    port: 9000,
    dir: "/app/lib/starter/",
    status: "on",
    compileDir: ""
  };
  
  _this.allServers = [helloWorldServer];
  _this.addServer = function() {
    console.log(this);
  };
  
  _this.toggleStatus = function(id) {
    if (!id) {
      var as = _this.allServers;
      for (var i; as.length > i; i++) {
        _this.toggleStatus(as[i].id);
      }
    } else {
      console.log(id, "toggleStatus");  
    }
  };
  _this.launchSite = function(port) {
    console.log(port);
  };
  _this.launchSettings = function(id) {
    console.log(id);
  };
  _this.launchLogs = function(id) {
    console.log(id);
  };
  
  
});
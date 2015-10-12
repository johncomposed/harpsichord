// Meanwhile, in root scope: ipc! 
// Man, electron is weird.
var ipc = require('ipc');

// Starting angular app
var app = angular.module('harpsichord', []);

// Menubar controller
app.controller('serverListController', function($scope) {

  var _this = $scope;
  
  // Shitty hack for now
  $scope.$watch(function(){
      return window.innerHeight;
    }, function(value) { 
      _this.innerHeight = value - 50; 
  });

  _this.showSettings = {};
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
  
  var updateServerList = function() {
    console.log('updated');
    _this.allServers = ipc.sendSync('request-servers', 'update pls');
  };
  
  var toggleServing = function(id, callback) {
    ipc.send('toggle-request', id);

    ipc.on('toggle-response', function() {
      if (callback) { callback(); }
    });
    
  };
  
  
  
  ipc.on('force-update', function(message) {
    console.log(message); 
    $scope.$apply(updateServerList());
  });
  
  
  _this.allServers = ipc.sendSync('request-servers', 'first run');
    
  _this.addServer = function() {
    console.log("addServer clicked");
    ipc.send('new-server', helloWorldServer);
    updateServerList();
  };
  
  _this.toggleStatus = function(id) {
    // startSpinning(id); // TODO
    if (!_this.quietMode) {
      toggleServing(id, function(){
        // stopSpinning(id); //TODO
        $scope.$apply(updateServerList());    
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
      ipc.send('update-server', server);
    }

    
    // launch new settings page with settingsController
  };
  
  _this.launchLogs = function(id) {
    ipc.send('launch-logs', id);
  };
  
  
});



// Settings controller
app.controller('logsController', function( $scope) {
  var _this = $scope;
  
  ipc.send('gimme-logs', 'ping');

  
  _this.logFile = {
    id: 0,
    logs: ""
  };
  

  
  ipc.on('load-logs', function(logFile) {
    console.log("Got load settings message");
    $scope.$apply(_this.logFile = logFile);

  });
  
  
  
  _this.deleteLogs = function() {
    ipc.send('delete-logs', _this.logFile.id);    
    
  };
  



  
  
});

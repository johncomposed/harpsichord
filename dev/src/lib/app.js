// Meanwhile, in root scope: ipc! 
// Man, electron is weird.
var ipc = require('ipc');


// Starting angular app
var app = angular.module('harpsichord', []);

// Menubar controller
app.controller('serverListController', function($scope) {

  var _this = $scope;
  var helloWorldServer = {
    id: +new Date(),
    name: "Hello World Server",
    port: 9000,
    dir: "/Users/john/Github/autoHarp/harpsichord/app/lib/starter/",
    status: "off",
    compileDir: ""
  };

  var updateServerList = function() {
    console.log('updated');
    $scope.$apply(
      _this.allServers = ipc.sendSync('request-servers', 'update pls')
    );
  };
  
  ipc.on('force-update', function(arg) {
    console.log(arg); 
    updateServerList();
  });
  
  ipc.on('toggle-response', function(id) {
    // stopSpinning(id); //TODO
    updateServerList();
  });
  
  _this.allServers = ipc.sendSync('request-servers', 'first run');
    
  _this.addServer = function() {
    console.log("addServer clicked");
    ipc.send('new-server', helloWorldServer);
    updateServerList();
  };
  
  _this.toggleStatus = function(id) {
    ipc.send('toggle-request', id);
    // startSpinning(id); // TODO
  };
  
  _this.toggleAll = function() {
    console.log("toggleall");
    for (var i = 0; i < _this.allServers.length; i++) {
      _this.toggleStatus(_this.allServers[i].id);
    }
  };
  
  _this.launchSite = function(port) {
    console.log(port);
  };
  
  _this.launchSettings = function(id) {
    console.log(id);
    // launch new settings page with settingsController
  };
  
  _this.launchLogs = function(id) {
    console.log(id);
  };
  
  
});



// Settings controller
app.controller('settingsController', function( $scope) {
  
    var hws2 = helloWorldServer;
    hws2.id = 1444443802984;
    hws2.status = "off";
    ipc.send('edit-server', helloWorldServer);
    updateServerList();
  
  
  
});

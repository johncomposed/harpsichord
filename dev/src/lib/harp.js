var harp = require("harp");
var dir = __dirname + "/starter";
var port = 9000;

harp.server(dir, { port: port }, function (errors){
  if (errors) {
    console.log(JSON.stringify(errors, null, 2));
    process.exit(1);
  }

  console.log('Running harp at '+ dir +' on ' + port)
});



//var express = require("express");
//var harp = require("harp");
//var app = express();
//
//app.use(express.static(__dirname + "/public"));
//app.use(harp.mount(__dirname + "/public"));
//
//app.listen(9000);




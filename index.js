var menubar = require('menubar')

// note: grunt copied image is broken - why?
var mb = menubar({ dir: __dirname + '/app', icon:__dirname + '/dark.png', preloadWindow: true, transparent: true, fullscreen: false })


mb.on('ready', function ready () {
  console.log('app is ready')
})

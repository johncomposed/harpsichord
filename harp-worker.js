const harp = require('harp');

let config = null;

process.on('message', (m) => {
  if (m && m.type === 'start') {
    config = m;
    harp.server(config.dir, { port: config.port }, (errors) => {
      if (errors) {
        console.log(JSON.stringify(errors, null, 2));
        process.exit(1);
      }
      console.log(`Running harp at ${config.dir} on ${config.port}`);
      process.send('running');
    });
    return;
  }

  if (m === 'stop') {
    process.exit(0);
  } else {
    console.log(m);
  }
});

process.on('disconnect', () => process.exit());

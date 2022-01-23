const nats = require('nats');
const debug = require('debug')('feathers-sync:nats');
const core = require('../core');

module.exports = config => {
  debug(`Setting up NATS connection ${config.uri}`);

  return app => {
<<<<<<< HEAD
    const key = config.key || 'feathers-sync';
=======
    const { key, serialize, deserialize } = config;
>>>>>>> d303798d46845c43ca61dded8fa386e1aa5d35f4
    const natsClient = nats.connect({ json: true, url: config.uri, ...config.natsConnectionOptions });

    app.configure(core);
    app.sync = {
      type: 'nats',
<<<<<<< HEAD
=======
      serialize,
      deserialize,
>>>>>>> d303798d46845c43ca61dded8fa386e1aa5d35f4
      ready: new Promise((resolve, reject) => {
        natsClient.once('connect', resolve);
        natsClient.once('error', reject);
      })
    };
    app.on('sync-out', data => {
      debug(`Publishing key ${key} to Nats`);
      natsClient.publish(key, data);
    });

    natsClient.subscribe(key, (msg) => {
      if (msg) {
        debug(`Got ${key} message from Nats`);
        app.emit('sync-in', msg);
      }
    });
  };
};

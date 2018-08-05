const mubsub = require('mubsub');
const debug = require('debug')('feathers-sync:mongodb');
const core = require('../core');

module.exports = config => {
  const collection = config.collection || 'sync';
  const eventName = config.event || 'feathers-sync';
  const db = config.uri || config.db;
  const client = mubsub(db, config.mubsub);
  const channel = client.channel(collection, config.channel);

  debug(`Setting up MongoDB connection ${config.db} on collection ${collection}`);

  return app => {
    app.configure(core);
    app.sync = {
      client,
      channel,
      type: 'mongodb',
      ready: new Promise((resolve, reject) => {
        channel.once('ready', resolve);
        channel.once('error', reject);
      })
    };

    app.on('sync-out', data => {
      debug(`Publishing ${eventName} event to mubsub channel`);

      channel.publish(eventName, JSON.stringify(data));
    });

    channel.subscribe(eventName, data => {
      app.emit('sync-in', JSON.parse(data));
    });
  };
};

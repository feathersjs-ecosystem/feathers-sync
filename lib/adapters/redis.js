const redis = require('redis');
const debug = require('debug')('feathers-sync:redis');
const core = require('../core');

module.exports = config => {
  return app => {
    const db = config.uri || config.db;
    const pub = redis.createClient(db);
    const sub = redis.createClient(db);
    const key = config.key || 'feathers-sync';

    debug(`Setting up Redis client for ${db}`);

    app.configure(core);
    app.sync = {
      pub,
      sub,
      type: 'redis',
      ready: new Promise((resolve, reject) => {
        sub.once('ready', resolve);
        sub.once('error', reject);
      })
    };

    app.on('sync-out', data => {
      debug(`Publishing key ${key} to Redis`);
      pub.publish(key, JSON.stringify(data));
    });

    sub.subscribe(key);
    sub.on('message', function (e, data) {
      if (e === key) {
        debug(`Got ${key} message from Redis`);
        app.emit('sync-in', JSON.parse(data));
      }
    });
  };
};

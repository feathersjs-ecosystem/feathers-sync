const redis = require('redis');
const debug = require('debug')('feathers-sync:redis');
const core = require('../core');

module.exports = config => {
  return app => {
    const key = config.key || 'feathers-sync';
    const db = config.uri || config.db;
    const { redisClient } = config;

    if (!redisClient && typeof db !== 'undefined') { debug(`Setting up Redis client for db: ${db}`); }

    const pub = redisClient || redis.createClient(db, config.redisOptions);
    const sub = redisClient || redis.createClient(db, config.redisOptions);

    const { deserialize, serialize } = config;

    app.configure(core);
    app.sync = {
      deserialize,
      serialize,
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
      pub.publish(key, data);
    });

    sub.subscribe(key);
    sub.on('message', function (e, data) {
      if (e.toString() === key) {
        debug(`Got ${key} message from Redis`);
        app.emit('sync-in', data);
      }
    });
  };
};

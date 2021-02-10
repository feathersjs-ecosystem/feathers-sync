const redis = require('redis');
const debug = require('debug')('feathers-sync:redis');
const core = require('../core');

module.exports = config => {
  return app => {
    const { key, serialize, deserialize } = config;
    const db = config.uri || config.db;
    const { redisClient } = config;
    // NOTE: message_buffer (redis) and messageBuffer (ioredis) return buffers
    const subscriberEvent = config.subscriberEvent || 'message';

    if (!redisClient && typeof db !== 'undefined') {
      debug(`Setting up Redis client for db: ${db}`);
    }
    
    const pub = redisClient || redis.createClient(db, config.redisOptions);
    const sub = pub.duplicate();

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
    sub.on(subscriberEvent, function (e, data) {
      if (e.toString() === key) {
        debug(`Got ${key} message from Redis`);
        app.emit('sync-in', data);
      }
    });
  };
};

const Redis = require('ioredis');
const debug = require('debug')('feathers-sync:redis');
const core = require('../core');

module.exports = config => {
  return app => {
    const { key, serialize, deserialize, redisClient, uri } = config;

    if (!redisClient) {
      debug(`Setting up new Redis client for ${uri}`);
    }

    const pub = redisClient || new Redis(uri);
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
      }).then(() => {
        sub.subscribe(key);
        sub.on(serialize && deserialize ? 'messageBuffer' : 'message', function (channel, data) {
          if (channel.toString() === key) {
            debug(`Got ${key} message from Redis`);
            app.emit('sync-in', data);
          }
        });
      })
    };

    app.on('sync-out', data => {
      debug(`Publishing key ${key} to Redis`);
      pub.publish(key, data);
    });
  };
};

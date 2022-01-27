const redis = require('redis');
const debug = require('debug')('feathers-sync:redis');
const core = require('../core');

module.exports = config => {
  return app => {
    const { key, serialize, deserialize, redisClient, uri } = config;
    // NOTE: message_buffer (redis) and messageBuffer (ioredis) return buffers
    const subscriberEvent = config.subscriberEvent || 'message';
    const options = {
      url: uri,
      ...config.redisOptions
    };

    if (!redisClient) {
      debug(`Setting up Redis client for ${options.uri}`);
    }

    const pub = redisClient || redis.createClient(options);
    const sub = pub.duplicate();

    app.configure(core);
    app.sync = {
      deserialize,
      serialize,
      pub,
      sub,
      type: 'redis',
      ready: new Promise((resolve, reject) => {
        pub.connect();
        sub.connect();
        sub.once('ready', resolve);
        sub.once('error', reject);
      })
    };

    app.on('sync-out', data => {
      debug(`Publishing key ${key} to Redis`);
      pub.publish(key, data);
    });

    sub.subscribe(key, data => {
      debug(`Got ${key} message from Redis`);
      app.emit('sync-in', data);
    });
  };
};

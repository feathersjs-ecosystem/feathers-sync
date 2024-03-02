const { URL } = require('url');
const core = require('./core');
const redis = require('./adapters/redis');
const amqp = require('./adapters/amqp');
const nats = require('./adapters/nats');
const adaptors = {
  core,
  nats,
  redis,
  amqp,
  rabbitmq: amqp
};

const { SYNC } = core;
const init = options => {
  const { uri, deserialize, serialize, redisClient } = options;

  if (!uri && !redisClient) {
    throw new Error('A `uri` option with the database connection string, or a `redisClient` object has to be provided to feathers-sync');
  }

  let adapter;

  if (redisClient) {
    if (typeof redisClient !== "object") {
      throw new Error('`redisClient` option provided to feathers-sync is not an object');
    }

    adapter = adaptors["redis"];
  }  

  if (deserialize && typeof deserialize !== 'function') {
    throw new Error('`deserialize` option provided to feathers-sync is not a function');
  }

  if (serialize && typeof serialize !== 'function') {
    throw new Error('`serialize` option provided to feathers-sync is not a function');
  }

  if (typeof adapter !== "function") {
    const { protocol } = new URL(uri);
    const name = protocol.substring(0, protocol.length - 1);
    const identifiedProtocolName = Object.keys(adaptors).filter((adaptor) => name.indexOf(adaptor) !== -1 ? adaptor : null);
    adapter = adaptors[identifiedProtocolName];

    if (typeof adapter !== "function") {
      throw new Error(`${name} is an invalid adapter (uri ${uri})`);
    }
  }  

  return adapter({
    serialize: JSON.stringify,
    deserialize: JSON.parse,
    key: 'feathers-sync',
    ...options
  });
};

module.exports = init;

Object.assign(module.exports, adaptors, {
  default: init,
  SYNC
});
const { URL } = require('url');
const core = require('./core');
const mongodb = require('./adapters/mongodb');
const redis = require('./adapters/redis');
const amqp = require('./adapters/amqp');
const adaptors = {
  mongodb,
  core,
  redis,
  amqp,
  rabbitmq: amqp
};

const { SYNC } = core;

module.exports = options => {
  const { uri, deserialize, serialize } = options;

  if (!uri) {
    throw new Error('A `uri` option with the database connection string has to be provided to feathers-sync');
  }

  if (deserialize && typeof deserialize !== 'function') {
    throw new Error('`deserialize` option provided to feathers-sync is not a function');
  }

  if (serialize && typeof serialize !== 'function') {
    throw new Error('`serialize` option provided to feathers-sync is not a function');
  }

  const { protocol } = new URL(uri);
  const name = protocol.substring(0, protocol.length - 1);
  const identifiedProtocolName = Object.keys(adaptors).filter((adaptor) => name.indexOf(adaptor) !== -1 ? adaptor : null);
  const adapter = adaptors[identifiedProtocolName];

  if (!adapter) {
    throw new Error(`${name} is an invalid adapter (uri ${uri})`);
  }

  return adapter({
    serialize: JSON.stringify,
    deserialize: JSON.parse,
    ...options
  });
};

Object.assign(module.exports, adaptors, { SYNC });

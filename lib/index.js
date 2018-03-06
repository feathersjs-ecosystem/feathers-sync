const url = require('url');
const core = require('./core');
const mongodb = require('./adapters/mongodb');
const redis = require('./adapters/redis');
const amqp = require('./adapters/amqp');
const mappings = {
  mongodb,
  core,
  redis,
  amqp,
  rabbitmq: amqp
};

module.exports = options => {
  const { uri } = options;

  if (!uri) {
    throw new Error('A `uri` option with the database connection string has to be provided to feathers-sync');
  }

  const { protocol } = url.parse(uri);
  const name = protocol.substring(0, protocol.length - 1);
  const adapter = mappings[name];

  if (!adapter) {
    throw new Error(`${name} is an invalid adapter (uri ${uri})`);
  }

  return adapter(options);
};

Object.assign(module.exports, mappings);

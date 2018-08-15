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
  if (!options.uri) {
    throw new Error('A `uri` option with the database connection string has to be provided to feathers-sync');
  }

  const adapter = getAdapter(options);

  return adapter(options);
};

function getAdapter (options) {
  const { uri, adapterType } = options;
  let adapter;

  if (adapterType) {
    adapter = mappings[adapterType];

    if (!adapter) {
      throw new Error(`${adapterType} is an invalid adapter (adapterType ${adapterType})`);
    }
  } else {
    const { protocol } = url.parse(uri);
    const name = protocol.substring(0, protocol.length - 1);
    adapter = mappings[name];

    if (!adapter) {
      throw new Error(`${name} is an invalid adapter (uri ${uri})`);
    }
  }

  return adapter;
}

Object.assign(module.exports, mappings);

var debug = require('debug')('feathers-sync');
var mongo = require('./mongodb');
var redis = require('./redis');
var amqp = require('./amqp');

module.exports = function (config) {
  var proto = '';
  config = config || { db: 'mongodb://localhost:27017/sync' };

  if (config.db) {
    proto = config.db.split('://')[0];
  } else if (config.uri) {
    proto = config.uri.split('://')[0];
  }

  if (['mongodb', 'redis', 'amqp'].indexOf(proto) === -1) {
    return debug('Adapter not found %s', proto);
  }

  debug('will sync via adapter: %s ', proto);

  if (proto === 'mongodb') {
    return mongo(config);
  } else if (proto === 'redis') {
    return redis(config);
  } else if (proto === 'amqp') {
    return amqp(config);
  } else {

  }
};

const core = require('./core');
const mongodb = require('./mongodb');
const redis = require('./redis');
const amqp = require('./amqp');

module.exports = {
  mongodb,
  core,
  redis,
  amqp,
  rabbitmq: amqp
};

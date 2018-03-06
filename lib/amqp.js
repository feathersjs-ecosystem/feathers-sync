const amqplib = require('amqplib');
const debug = require('debug')('feathers-sync:amqp');
const core = require('./core');

module.exports = config => {
  const open = amqplib.connect(config.uri, config.amqpConnectionOptions);
  const { key = 'feathers-sync' } = config;

  debug(`Setting up AMQP connection ${config.uri}`);

  return app => {
    app.configure(core);

    const ready = open.then(connection => connection.createChannel()
      .then(channel => {
        return channel.assertExchange(key, 'fanout', { durable: false }).then(() => {
          return channel.assertQueue('').then(q => {
            channel.bindQueue(q.queue, key, '').then(() => {
              channel.consume(q.queue, message => {
                if (message !== null) {
                  debug(`Got ${key} event from APMQ channel`);
                  app.emit('sync-in', JSON.parse(message.content.toString()));
                }
              }, { noAck: true });

              app.on('sync-out', data => {
                debug(`Publishing ${key} event to APMQ channel`);
                channel.publish(key, '', Buffer.from(JSON.stringify(data)));
              });

              return channel;
            });
          });
        });
      }).then(channel => ({ connection, channel })));

    app.sync = { ready };
  };
};

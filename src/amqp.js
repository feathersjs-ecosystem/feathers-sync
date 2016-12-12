var amqplib = require('amqplib/callback_api');
var debug = require('debug')('feathers-sync');

var channel;
var conf = {};
var listSubscriber = [];

var exchangeName = 'feathers-sync';

var onmessage = function (ev, data) {
  if (listSubscriber[ev] && Array.isArray(listSubscriber[ev])) {
    listSubscriber[ev].forEach(function (cb) {
      cb(data);
    });
  }
};

var connection = function (cb) {
  amqplib.connect(conf.uri, conf.amqpConnectionOptions, function (err, conn) {
    if (err) {
      debug('Error while connecting to AMQP: ', err.toString());
    } else {
      channel = conn.createChannel();
      
      if (conf.amqp && typeof conf.amqp.onClose === 'function') {
        channel.on('close', conf.amqp.onClose);
      }

      channel.assertExchange(exchangeName, 'fanout', {durable: false});
      channel.assertQueue('', {exclusive: true}, function (err, q) {
        if (err) {
          debug('Error while assertQueue to AMQP: ', err.toString());
        } else {
          channel.bindQueue(q.queue, exchangeName, '');
          if (typeof cb === 'function') {
            cb(channel);
          }
          channel.consume(q.queue, function (msg) {
            var temp = JSON.parse(msg.content.toString());
            onmessage(temp.ev, temp.data);
          }, {noAck: true});
        }
      });
    }
  });
};

var subscribe = function (ev, cb) {
  if (listSubscriber[ev]) {
    listSubscriber[ev].push(cb);
  } else {
    listSubscriber[ev] = [cb];
  }
};

var publish = function (ev, data) {
  var msg = {};
  msg.ev = ev;
  msg.data = data;
  // amqp name
  if (channel) {
    channel.publish(exchangeName, '', new Buffer(JSON.stringify(msg)));
  } else {
    connection(function (channel) {
      channel.publish(exchangeName, '', new Buffer(JSON.stringify(msg)));
    });
  }
};

module.exports = function (config) {
  debug('setting up AMQP uri %s', config.uri);
  conf.uri = config.uri;
  if (!config.prefix) {
    conf.prefix = '';
  } else {
    conf.prefix = config.prefix;
    exchangeName = conf.prefix + '-feathers-sync';
  }

  conf.amqpConnectionOptions = {
    // heartbeat: 30
  };

  if (config.amqpConnectionOptions) {
    conf.amqpConnectionOptions = config.amqpConnectionOptions;
  }

  connection();

  return function () {
    var oldSetup = this.setup;

    this.setup = function () {
      var result = oldSetup.apply(this, arguments);
      var services = this.services;
      Object.keys(services).forEach(function (path) {
        var service = services[path];
        service._serviceEvents.forEach(function (event) {
          var ev = path + ' ' + event;
          debug('subscribing to handler %s', ev);
          subscribe(ev, function (data) {
            debug('got event, calling old emit %s', ev);
            service._emit.call(service, event, data); // eslint-disable-line no-useless-call
          });
        });
      });
      return result;
    };

    this.providers.push(function (path, service) {
      if (typeof service.emit !== 'function' || typeof service.on !== 'function') {
        return;
      }

      // Store the old emit method
      service._emit = service.emit;

      // Override an emit that publishes to the hub
      service.mixin({
        emit: function (ev, data) {
          var event = path + ' ' + ev;
          debug('emitting event to channel %s', event);
          return publish(event, data);
        }
      });
    });
  };
};

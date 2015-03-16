var mubsub = require('mubsub');
var debug = require('debug')('feathers-mubsub');

module.exports = function(config) {
  debug('Setting up database', config.db);

  var client = mubsub(config.db);
  var channel = client.channel(config.collection || 'events', config);

  return function() {
    var oldSetup = this.setup;

    this.setup = function() {
      var result = oldSetup.apply(this, arguments);
      var services = this.services;
      Object.keys(services).forEach(function(path) {
        var service = services[path];
        service._serviceEvents.forEach(function(event) {
          var ev = path + ' ' + event;
          debug('Subscribing to handler', ev);
          channel.subscribe(ev, function(data) {
            debug('Got event, calling old emit', ev);
            service._emit.call(service, event, data);
          });
        });
      });
      return result;
    };

    this.providers.push(function(path, service) {
      if(typeof service.emit !== 'function' || typeof service.on !== 'function') {
        return;
      }

      // Store the old emit method
      service._emit = service.emit;

      // Override an emit that publishes to the hub
      service.mixin({
        emit: function(ev, data) {
          var event = path + ' ' + ev;
          debug('Emitting event to channel', event);
          return channel.publish(event, data);
        }
      });
    });

    if(typeof config.connect === 'function') {
      channel.connection.once('connect', config.connect);
    }
  };
};

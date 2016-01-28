var mubsub = require('mubsub');
var debug = require('debug')('feathers-sync');

module.exports = function(config) {
  debug('setting up database %s', config.db);

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
          debug('subscribing to handler %s', ev);
          channel.subscribe(ev, function(data) {
            debug('got event, calling old emit %s', ev);
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
          debug('emitting event to channel %s', event);
          return channel.publish(event, data);
        }
      });
    });

    if(typeof config.connect === 'function') {
      channel.connection.once('connect', config.connect);
    }
  };
};

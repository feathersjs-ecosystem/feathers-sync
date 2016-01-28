var redis = require('redis');
var debug = require('debug')('feathers-sync:redis');

module.exports = function(config) {
  debug('setting up database %s', config.db);

  return function() {

    var oldSetup = this.setup;

    this.setup = function() {

      var result = oldSetup.apply(this, arguments);
      var services = this.services;
      Object.keys(services).forEach(function(path) {
        var service = services[path];
        service.pub = redis.createClient(config.db);
        service.sub = redis.createClient(config.db);
        service._serviceEvents.forEach(function(event) {
          var ev = path + ' ' + event;
          debug('subscribing to handler %s', ev);
          service.sub.subscribe(ev);
          service.sub.on('message', function(e, data) {
            data = JSON.parse(data);
            debug('got event, calling old emit %s', data);
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
          console.log('redis.new.emit', data);
          var event = path + ' ' + ev;
          debug('emitting event to channel %s', event);
          return service.pub.publish(event, JSON.stringify(data));
        }
      });
    });

    if(typeof config.connect === 'function') {
      config.connect();
    }
  };
};

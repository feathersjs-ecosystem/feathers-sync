var redis = require('redis');
var debug = require('debug')('feathers-sync:redis');

module.exports = function (config) {
  debug('setting up database %s', config.db);

  return function () {
    var oldSetup = this.setup;

    this.setup = function () {
      var result = oldSetup.apply(this, arguments);
      var services = this.services;
      Object.keys(services).forEach(function (path) {
        var service = services[path];
        service.pub = redis.createClient(config.db);
        service.sub = redis.createClient(config.db);
        service._serviceEvents.forEach(function (event) {
          var ev = path + ' ' + event;
          debug('subscribing to handler %s', ev);
          service.sub.subscribe(ev);
          service.sub.on('message', function (e, data) {
            if (e !== ev) {
              return;
            }

            data = JSON.parse(data);
            debug('got event "%s", calling old emit %s', e, data);
            service._emit.call(service, event, data); // eslint-disable-line no-useless-call
          });
        });
      });
      return result;
    };

    function configurePlugin (service, path) {
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
          // Something is converting the second argument to a string here
          // So for now, pass the data as a string, and serialize back on other side
          return service.pub.publish(event, JSON.stringify(data));
        }
      });

      if (typeof config.connect === 'function') {
        setTimeout(config.connect, 50);
      }
    }

    if (this.version && parseInt(this.version, 10) >= 3) {
      this.mixins.push(configurePlugin);
    } else {
      this.providers.push((path, service) => configurePlugin(service, path));
    }
  };
};

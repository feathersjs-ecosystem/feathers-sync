var mubsub = require('mubsub');
var debug = require('debug')('feathers-sync');
var omit = require('lodash').omit;

module.exports = function (config) {
  debug('setting up database %s', config.db);
  var client = mubsub(config.db, config.mubsub);
  var channel = client.channel(config.collection || 'events', omit(config, ['mubsub', 'db', 'collection']));

  return function () {
    var oldSetup = this.setup;

    this.syncService = function (path) {
      var service = this.services[path];
      service._serviceEvents.forEach(function (event) {
        var ev = path + ' ' + event;
        debug('subscribing to handler %s', ev);
        channel.subscribe(ev, function (data) {
          debug('got event, calling old emit %s', ev);
          service._emit.call(service, event, data); // eslint-disable-line no-useless-call
        });
      });
    };

    this.setup = function () {
      var result = oldSetup.apply(this, arguments);
      Object.keys(this.services).forEach((path) => {
        this.syncService(path);
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
          return channel.publish(event, data);
        }
      });
    }

    if (this.version && parseInt(this.version, 10) >= 3) {
      this.mixins.push(configurePlugin);
    } else {
      this.providers.push((path, service) => configurePlugin(service, path));
    }

    if (typeof config.connect === 'function') {
      channel.connection.once('connect', config.connect);
    }
  };
};

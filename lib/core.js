const debug = require('debug')('feathers-sync');
const { hooks, _ } = require('@feathersjs/commons');
const SYNC = Symbol('feathers-sync/enabled');

module.exports = app => {
  if (app[SYNC]) {
    return;
  }

  app[SYNC] = true;

  if (app.sync) {
    throw new Error('Only one type of feathers-sync can be configured on the same application');
  }

  app.on('sync-in', ({ event, path, data, context }) => {
    const service = app.service(path);
    const hook = context ? Object.assign({
      app, service
    }, context) : context;

    if (service) {
      debug(`Dispatching sync-in event '${path} ${event}'`);
      service._emit(event, data, hook);
    } else {
      debug(`Invalid sync event '${path} ${event}'`);
    }
  });

  app.mixins.push((service, path) => {
    service._emit = service.emit;
    service.mixin({
      emit (event, data, ctx) {
        if (!service._serviceEvents.includes(event) || ctx[SYNC] === false) {
          debug(`Passing through non-service event '${path} ${event}'`);
          return this._emit(event, data, ctx);
        }

        const context = hooks.isHookObject(ctx)
          ? _.omit(ctx, 'app', 'service') : ctx;

        debug(`Sending sync-out event '${path} ${event}'`);

        return app.emit('sync-out', {
          event, path, data, context
        });
      }
    });
  });
};

module.exports.SYNC = SYNC;

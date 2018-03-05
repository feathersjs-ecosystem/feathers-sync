var feathers = require('@feathersjs/feathers');
var sync = require('../lib/sync');

module.exports = function app (options, connect) {
  var config = Object.assign({ connect }, options);
  var result = feathers().configure(sync(config)).use('/todos', {
    create (data) {
      return Promise.resolve(data);
    },

    remove (id) {
      return Promise.resolve({ id });
    },

    update (id, data) {
      return Promise.resolve(data);
    }
  });

  result.setup();

  if (config.uri) {
    connect();
  }

  return result;
};

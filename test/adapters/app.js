const feathers = require('@feathersjs/feathers');
const sync = require('../../lib');

module.exports = options => {
  return () => feathers()
    .configure(sync(options))
    .use('/todo', {
      events: ['custom'],
      create (data) {
        return Promise.resolve(data);
      },
      update (id, data, params) {
        return Promise.resolve(data);
      }
    });
};

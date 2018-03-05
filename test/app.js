const feathers = require('@feathersjs/feathers');
const sync = require('../lib');

module.exports = (name, options) => {
  return () => feathers()
    .configure(sync[name](options))
    .use('/todo', {
      events: ['custom'],
      create (data) {
        return Promise.resolve(data);
      }
    });
};

var assert = require('assert');
var feathers = require('@feathersjs/feathers');
var sync = require('../lib/sync');

function app (port, connect) {
  var result = feathers().configure(sync({
    db: 'redis://localhost:6379',
    connect: connect
  }))
    .use('/todos', {
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
  return result;
}

describe('feathers-sync:redis tests', function () {
  var app1, app2, app3;

  before(function (done) {
    app1 = app(8884, function () {
      app2 = app(8885, function () {
        app3 = app(8886, function () {
          done();
        });
      });
    });
  });

  it('creating todo on app1 trigger created on all apps', done => {
    var count = 0;
    var original = { test: 'data' };
    var onCreated = function (app) {
      app.service('todos').once('created', function (data) {
        assert.deepEqual(original, data);
        count++;
        if (count === 3) {
          done();
        }
      });
    };

    onCreated(app1);
    onCreated(app2);
    onCreated(app3);

    app1.service('todos').create(original).then(data => {
      assert.deepEqual(original, data);
    });
  });
});

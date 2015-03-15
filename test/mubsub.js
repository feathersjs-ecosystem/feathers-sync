var assert = require('assert');
var feathers = require('feathers');
var mubsub = require('../lib/mubsub');

function app(port, connect) {
  var result = feathers().configure(mubsub({
      db: 'mongodb://localhost:27017/feathers-mubsub',
      connect: connect
    }))
    .use('/todos', {
      create: function (data, params, callback) {
        callback(null, data);
      },

      remove: function (id, params, callback) {
        callback(null, {id: id});
      },

      update: function (id, data, params, callback) {
        callback(null, data);
      }
    });
  result.listen(port);
  return result;
}

describe('feathers-mubsub tests', function () {
  var app1, app2, app3;

  before(function (done) {
    app1 = app(8887, function() {
      app2 = app(8888, function() {
        app3 = app(8889, function() {
          done();
        });
      });
    });
  });

  it('creating todo on app1 trigger created on all apps', function (done) {
    var count = 0;
    var original = { test: 'data' };
    var onCreated = function(app) {
      app.service('todos').once('created', function(data) {
        assert.deepEqual(original, data);
        count++;
        if(count === 3) {
          done();
        }
      });
    };

    onCreated(app1);
    onCreated(app2);
    onCreated(app3);

    app1.service('todos').create(original, {}, function(err, data) {
      assert.deepEqual(original, data);
    });
  });
});

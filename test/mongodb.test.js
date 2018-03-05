var assert = require('assert');
var app = require('./app');

describe('feathers-sync:mongodb tests', function () {
  var app1, app2, app3;

  before(function (done) {
    const options = {
      db: 'mongodb://localhost:27017/feathers-sync'
    };

    app1 = app(options, function () {
      app2 = app(options, function () {
        app3 = app(options, function () {
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

    app1.service('todos').create(original).then(data =>
      assert.deepEqual(original, data)
    ).catch(done);
  });
});

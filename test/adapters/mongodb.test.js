const assert = require('assert');
const _app = require('./app');
const createApp = _app({
  uri: 'mongodb://localhost:27017/feathers-sync'
});

describe('feathers-sync MongoDB tests', () => {
  let app1, app2, app3;

  before(() => {
    app1 = createApp();

    return app1.sync.ready.then(() => {
      app2 = createApp();

      return app2.sync.ready;
    }).then(() => {
      app3 = createApp();

      return app3.sync.ready;
    });
  });

  it('initialized with mongodb adapter', () => {
    assert.ok(app1.sync);
    assert.equal(app1.sync.type, 'mongodb');
  });

  it('creating todo on app1 trigger created on all apps with hook context', done => {
    const original = { test: 'data' };
    let count = 0;
    const onCreated = app => {
      app.service('todo').once('created', (data, context) => {
        assert.deepEqual(original, data);
        assert.ok(context);
        assert.deepEqual(context.result, data);
        assert.equal(context.method, 'create');
        assert.equal(context.type, 'after');
        assert.equal(context.service, app.service('todo'));
        assert.equal(context.app, app);

        count++;
        if (count === 3) {
          done();
        }
      });
    };

    onCreated(app1);
    onCreated(app2);
    onCreated(app3);

    app1.service('todo').create(original).then(data =>
      assert.deepEqual(original, data)
    ).catch(done);
  });

  it('updating todo on app1 with query operators trigger update on all apps with hook context', done => {
    const original = { test: 'data' };
    const query = { field: { $lt: 3 } };
    let count = 0;
    const onUpdated = app => {
      app.service('todo').once('updated', (data, context) => {
        assert.deepEqual(original, data);
        assert.ok(context);
        assert.deepEqual(context.result, data);
        assert.equal(context.method, 'update');
        assert.equal(context.type, 'after');
        assert.equal(context.service, app.service('todo'));
        assert.equal(context.app, app);
        assert.deepEqual(context.params, { query });

        count++;
        if (count === 3) {
          done();
        }
      });
    };

    onUpdated(app1);
    onUpdated(app2);
    onUpdated(app3);

    app1.service('todo').update(null, { test: 'data' }, { query }).then(data =>
      assert.deepEqual(original, data)
    ).catch(done);
  });
});

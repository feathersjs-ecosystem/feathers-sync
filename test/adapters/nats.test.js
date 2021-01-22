const assert = require('assert');
const _app = require('./app');

describe('feathers-sync NATS tests', () => {
  const createApp = _app({
    uri: 'nats://localhost:4222',
    key: 'feathers-sync2'
  });

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

  it('initialized with NATS adapter', () => {
    assert.ok(app1.sync);
    assert.strictEqual(app1.sync.type, 'nats');
  });

  it('creating todo on app1 trigger created on all apps with hook context', done => {
    const original = { test: 'data' };
    let count = 0;
    const onCreated = app => {
      app.service('todo').once('created', (data, context) => {
        assert.deepStrictEqual(original, data);
        assert.ok(context);
        assert.deepStrictEqual(context.result, data);
        assert.strictEqual(context.method, 'create');
        assert.strictEqual(context.type, 'after');
        assert.strictEqual(context.service, app.service('todo'));
        assert.strictEqual(context.app, app);

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
      assert.deepStrictEqual(original, data)
    ).catch(done);
  });
});

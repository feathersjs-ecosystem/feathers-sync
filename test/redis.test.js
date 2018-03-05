const assert = require('assert');
const _app = require('./app');
const createApp = _app('redis', {
  db: 'redis://localhost:6379'
});

describe('feathers-sync Redis tests', () => {
  let app1, app2, app3;

  before(() => {
    app1 = createApp();
    app2 = createApp();
    app3 = createApp();

    return app3.sync.ready;
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
});

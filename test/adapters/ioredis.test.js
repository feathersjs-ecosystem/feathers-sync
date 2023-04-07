const assert = require('assert');
const feathers = require('@feathersjs/feathers');
const { redis } = require('../../lib');
const Redis = require('ioredis');

const redisClient = new Redis({
  lazyConnect: true,
  maxRetriesPerRequest: null
});

describe('ioredis client tests', () => {
  let app;

  before(done => {
    app = feathers()
      .configure(redis({
        key: 'feathers-sync',
        serialize: JSON.stringify,
        deserialize: JSON.parse,
        redisClient
      }))
      .use('/todo', {
        events: ['custom'],
        async create (data) {
          return data;
        },
        async update (id, data, params) {
          return data;
        }
      });
    app.sync.ready.then(() => {
      done();
    });
  });

  it('duplicates client', () => {
    assert.ok(redisClient.duplicate());
  });

  it('syncs on created with hook context', done => {
    const original = { test: 'data' };

    app.service('todo').once('created', (data, context) => {
      assert.deepStrictEqual(original, data);
      assert.ok(context);
      assert.deepStrictEqual(context.result, data);
      assert.strictEqual(context.method, 'create');
      assert.strictEqual(context.type, 'around');
      assert.strictEqual(context.service, app.service('todo'));
      assert.strictEqual(context.app, app);

      done();
    });

    app.service('todo')
      .create(original)
      .then(data =>
        assert.deepStrictEqual(original, data)
      )
      .catch(done);
  });

  it('sync-in event gets turned into service event', done => {
    app.service('todo').once('created', (data, context) => {
      assert.deepStrictEqual(data, { message: 'This is a test' });
      assert.strictEqual(context.app, app);
      assert.strictEqual(context.service, app.service('todo'));
      assert.strictEqual(context.method, 'create');
      assert.strictEqual(context.type, 'after');
      done();
    });
    app.emit('sync-in', {
      event: 'created',
      path: 'todo',
      data: { message: 'This is a test' },
      context: {
        data: { message: 'This is a test' },
        params: {},
        type: 'after',
        method: 'create',
        path: 'todo',
        result: { message: 'This is a test' }
      }
    });
  });

  it('sends sync-out for service events', done => {
    const message = { message: 'This is a test' };

    app.once('sync-out', data => {
      try {
        assert.deepStrictEqual(data, {
          event: 'created',
          path: 'todo',
          data: message,
          context: {
            arguments: [message, {}],
            data: message,
            params: {},
            type: 'around',
            statusCode: undefined,
            method: 'create',
            event: 'created',
            path: 'todo',
            result: message
          }
        });
        done();
      } catch (error) {
        done(error);
      }
    });

    app.service('todo').create(message);
  });
});

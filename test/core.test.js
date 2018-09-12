const assert = require('assert');
const feathers = require('@feathersjs/feathers');
const sync = require('../lib/core');

describe('feathers-sync core tests', () => {
  const app = feathers()
    .configure(sync)
    .use('/todo', {
      events: ['custom'],
      create (data) {
        return Promise.resolve(data);
      }
    });

  it('configuring twice does nothing', () => {
    app.configure(sync);
  });

  it('sends sync-out for service events', done => {
    const message = { message: 'This is a test' };

    app.once('sync-out', data => {
      try {
        assert.deepEqual(data, {
          event: 'created',
          path: 'todo',
          data: message,
          context: {
            arguments: [ message ],
            data: message,
            params: {},
            type: 'after',
            method: 'create',
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

  it('can skip sending sync event', done => {
    const message = 'This is a test';

    app.service('todo').once('created', todo => {
      assert.equal(todo.message, message);
      done();
    });

    app.once('sync-out', () => {
      done(new Error('Should never get here'));
    });

    let synced = false;

    app.service('todo').hooks({
      before (context) {
        if (!synced) {
          context[sync.SYNC] = false;
          synced = true;
        }

        return context;
      }
    });
    app.service('todo').create({ message });
  });

  it('sends sync-out for custom events', done => {
    app.once('sync-out', data => {
      assert.deepEqual(data, {
        event: 'custom',
        path: 'todo',
        data: 'testing',
        context: undefined
      });
      done();
    });

    app.service('todo').emit('custom', 'testing');
  });

  it('passes non-service events through', done => {
    const todo = app.service('todo');

    todo.once('something', data => {
      assert.equal(data, 'test');
      done();
    });
    todo.emit('something', 'test');
  });

  it('sync-in event gets turned into service event', done => {
    app.service('todo').once('created', (data, context) => {
      assert.deepEqual(data, { message: 'This is a test' });
      assert.equal(context.app, app);
      assert.equal(context.service, app.service('todo'));
      assert.equal(context.method, 'create');
      assert.equal(context.type, 'after');
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

  it('sync-in does nothing for invalid event (path)', () => {
    app.emit('sync-in', {
      event: 'something',
      path: 'todos'
    });
  });
});

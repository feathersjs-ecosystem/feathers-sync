# Feathers sync

[![Greenkeeper badge](https://badges.greenkeeper.io/feathersjs-ecosystem/feathers-sync.svg)](https://greenkeeper.io/)

[![Build Status](https://travis-ci.org/feathersjs-ecosystem/feathers-sync.png?branch=master)](https://travis-ci.org/feathersjs-ecosystem/feathers-sync)
[![Dependency Status](https://img.shields.io/david/feathersjs-ecosystem/feathers-sync.svg?style=flat-square)](https://david-dm.org/feathersjs-ecosystem/feathers-sync)
[![Download Status](https://img.shields.io/npm/dm/feathers-sync.svg?style=flat-square)](https://www.npmjs.com/package/feathers-sync)
[![Slack Status](http://slack.feathersjs.com/badge.svg)](http://slack.feathersjs.com)

> Synchronize service events between application instances

## About

When running multiple instances of your Feathers application (e.g. on several Heroku Dynos), service events (`created`, `updated`, `patched`, `removed`) do not get propagated to other instances.

feathers-sync uses a messaging mechanism to propagate all events to all application instances. It currently supports:

- MongoDB publish/subscribe (via [mubsub](https://github.com/scttnlsn/mubsub))
- Redis via [redis](https://github.com/NodeRedis/node_redis)
- AMQP (RabbitMQ) via [amqplib](https://github.com/squaremo/amqp.node)

This allows to scale real-time websocket connections to any number of clients.

### Usage

The application initialized in the following example will use the local `feathers-sync` database and `sync` collection and share service events with every other instance connected to the same database:

```js
const feathers = require('@feathers/feathers');
const sync = require('feathers-sync');

const app = feathers();

app.configure(sync({
  uri: 'mongodb://localhost:27017/sync',
  collection: 'events'
}));
app.use('/todos', todoService);
```

### `app.sync`

When set up, `app.sync` will contain the following information:

- `type` - The adapter type (e.g. `mongodb` or `redis`)
- `ready` - A promise that resolves when the synchronization mechanism is ready

```js
app.sync.ready.then(() => {
  // Do things here
});
```

### Disabling synchronization



## Adapters

`feathers-sync` can be initialized either by specifying the type of adapter through the `uri` (e.g. `mongodb://localhost:27017/sync`) or using e.g. `sync.mongodb` directly:

```js
// Configure MongoDB
app.configure(sync({
  uri: 'mongodb://localhost:27017/sync',
  collection: 'events'
}));

// Configure MongoDB with an existing connection
app.configure(sync.mongodb({
  db: existingConnection
  collection: 'events'
}));

// Configure Redis
app.configure(sync({
  uri: 'redis://localhost:6379'
}));

app.configure(sync.redis({
  db: redisInstance
}));
```

### MongoDB

- `uri` - The connection string (must start with `mongodb://`)
- `db` - The MongoDB database object or connection string (alias for `uri`)
- `collection` (default: `events`) - The name of the capped event collection
- `mubsub` - Settings to be passed to [mubsub](https://github.com/scttnlsn/mubsub) (e.g. `{authSource:'admin'}`)
- `channel` - Mubsub channel synchronization options:
  - `size` (default: `5mb`) - Max size of the collection in bytes
  - `max` - Max amount of documents in the collection
  - `retryInterval` (default: `200ms`) - Time in ms to wait if no docs are found
  - `recreate` (default: `true`) - Recreate the tailable cursor when an error occurs (default is `true`)

### Redis

- `uri` - The connection string (must start with `redis://`)
- `db` - The Redis database object or connection string (e.g. `redis://localhost:6379`)
- `key` - The key under which all synchronization events will be stored (default: `feathers-sync`)

### AMQP

- `uri` - The AMQP connection string (e.g. `amqp://guest:guest@localhost:5672`).
- `key` (default: `feathers-sync`) - The name exchange where sync messages will be published
- `amqpConnectionOptions` - AMQP [connection options](http://www.squaremobius.net/amqp.node/channel_api.html#connect)

## How it works

![alt tag](https://raw.githubusercontent.com/PedroMD/feathers-sync/master/feathers-sync%20and%20real-time%20events-60.png)

## Caveats

When listening to service events with `feathers-sync`, all events are going to get propagated to all clients. This means, that your event listeners should not perform any actions that change the global state (e.g. write something into the database) because every server instance will perform the same action.

Instead, event listeners should only be used to update the local state (e.g. a local cache) and send real-time updates to all its clients.

If you need to perform actions, for example setting up a first blog post after a new user has been created, add it to the service method itself (which will only run on its own instance) or use a [Feathers after hook](https://docs.feathersjs.com/api/hooks.html).

## Writing custom adapters

`feathers-sync` allows to implement custom adapters using the `sync-in` and `sync-out` events on the application:

```js
const { core } = require('feathers-sync');
const myMessagingService = {
  publish(data) {
    // send data here
  },

  subscribe(callback) {
    // subscribe to message queue and emit data
  }
}

module.exports = config => {
  return app => {
    app.configure(core);
    app.sync = {
      type: 'custom',
      ready: new Promise((resolve, reject) => {
        // resolve when client is ready
        // reject on connection error
      })
    };
    
    // Sent every time a service 
    app.on('sync-out', data => {
      // Publish `data` to the message queue
      myMessagingService.publish(data);
    });

    myMessagingService.subscribe(data => {
      // Send the synchronization event to the application
      app.emit('sync-in', data);
    });
  };
};
```

The `data` for the `sync-in` event should be in the same form as the one that is sent by `sync-out` (currently it includes `{ event, path, data, context }`).

## License

Copyright (c) 2018 Feathers contributors

Licensed under the [MIT license](LICENSE).

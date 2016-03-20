# Feathers sync

[![Build Status](https://travis-ci.org/feathersjs/feathers-sync.png?branch=master)](https://travis-ci.org/feathersjs/feathers-sync)

> Synchronize service events between application instances using Redis or MongoDB publish/subscribe

## About

When running multiple instances of your Feathers application (e.g. on several Heroku Dynos), service events (`created`, `updated`, `patched`, `removed`) do not get propagated to other instances. feathers-sync uses MongoDB publish/subscribe via [mubsub](https://github.com/scttnlsn/mubsub) or Redis via [redis](https://github.com/NodeRedis/node_redis) to propagate all events to all application instances.

This allows to scale real-time websocket connections to any number of clients.

The application initialized in the following example will use the local `feathers-sync` database and `sync` collection and share service events with every other instance connected to the same database:

```js
var feathers = require('feathers');
var sync = require('feathers-sync');

var app = feathers();
app.configure(feathers.rest())
  .configure(feathers.socketio())
  .configure(sync({
    db: 'mongodb://localhost:27017/sync',
    collection: 'events'
  }))
  .use('/todos', todoService);

app.listen(3000);
```

### Use with MongoDB:

- __db__ - The MongoDB connection string (e.g. `mongodb://localhost:27017/events`) or database object
- __collection__ - The name of the capped event collection (default is `events`)
- __connect__ - A callback for when the MongoDB connection has been established

Additionally you can pass the original sync options:

- __size__ - Max size of the collection in bytes, default is 5mb
- __max__ - Max amount of documents in the collection
- __retryInterval__ - Time in ms to wait if no docs are found, default is 200ms
- __recreate__ - Recreate the tailable cursor when an error occurs (default is `true`)

### Use with Redis:

- __db__ - The Redis connection string (e.g. `redis://localhost:6379`) or database object
- __connect__ - A callback for when the Redis connection has been established

## Caveats

When listening to service events with this, all events are going to get propagated to all clients. This means, that your event listeners should not perform any actions that change the global state (e.g. write something into the database) because every client will perform the same action.

Instead, event listeners should only be used to update the local state (e.g. a local cache) and send real-time updates to all connected clients, e.g. all browsers listening to websocket events.

If you need to perform actions, for example setting up a first blog post after a new user has been created add it to the service method itself (which will only run on its own instance) or use [feather-hooks](https://github.com/feathersjs/feathers-hooks) after hooks.

## Changelog

__0.1.0__

- Can now use Redis or Mongo
- Initial release

## Author

- [David Luecke](https://github.com/daffl)

## License

Copyright (c) 2015 David Luecke

Licensed under the [MIT license](LICENSE).

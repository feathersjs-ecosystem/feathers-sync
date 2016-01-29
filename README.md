# Feathers sync

[![Build Status](https://travis-ci.org/feathersjs/feathers-sync.png?branch=master)](https://travis-ci.org/feathersjs/feathers-sync)

> Synchronize service events between application instances using MongoDB publish/subscribe

## About

When running multiple instances of your Feathers application (e.g. on several Heroku Dynos), service events (`created`, `updated`, `patched`, `removed`) do not get propagated to other instances. feathers-sync uses MongoDB publish/subscribe via [sync](https://github.com/scttnlsn/sync) to propagate all events to all application instances.

This allows to scale real-time websocket connections to any number of clients.

The application initialized in the following example will use the local `feathers-sync` database and `sync` collection and share service events with every other instance connected to the same database:

```js
var feathers = require('feathers');
var sync = require('feathers-sync');

var app = feathers();
app.configure(feathers.rest())
  .configure(feathers.socketio())
  .configure(sync('mongo', {
    db: 'mongodb://localhost:27017/sync',
    collection: 'events'
  }))
  .use('/todos', todoService);

app.listen(3000);
```

Arguments:
- adapter - `mongo` or `redis`

Options:

- __db__ - The mongo or redis connection string (e.g. `mongodb://localhost:27017/events` `localhost:6379`) or database object
- __collection__ - The name of the capped event collection (default is `events`) - this is discarded in redis
- __connect__ - A callback when the MongoDB connection has been established

Additionally you can pass the original sync options (also discarded in redis):

- __size__ - max size of the collection in bytes, default is 5mb
- __max__ - max amount of documents in the collection
- __retryInterval__ - time in ms to wait if no docs are found, default is 200ms
- __recreate__ - recreate the tailable cursor when an error occurs (default is `true`)

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

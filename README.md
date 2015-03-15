# Feathers MubSub

[![Build Status](https://travis-ci.org/feathersjs/mubsub.png?branch=master)](https://travis-ci.org/feathersjs/feathers-mubsub)

> Synchronize service events between application instances using MongoDB

## About

When running multiple instances of your Feathers application (e.g. on several Heroku Dynos), service events (like `created`, `updated`, `patched`, `removed`) do not get propagated to other instances. feathers-mubsub uses [mubsub](https://github.com/scttnlsn/mubsub) based MongoDB publish/subscribe that propagates an event to every subscribed application.
This allows to scale real-time websocket connections to any number of clients.

## Changelog

__0.1.0__

- Initial release

## Author

- [David Luecke](https://github.com/daffl)

## License

Copyright (c) 2015 David Luecke

Licensed under the [MIT license](LICENSE).

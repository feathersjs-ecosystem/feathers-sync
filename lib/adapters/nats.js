const { connect, StringCodec } = require("nats");
const debug = require("debug")("feathers-sync:nats");
const core = require("../core");

module.exports = (config) => {
  debug(`Setting up NATS connection ${config.uri}`);

  return (app) => {
    const { key, serialize, deserialize, natsConnectionOptions } = config;
    const natsClient = connect(natsConnectionOptions);
    const stringCodec = StringCodec();

    app.configure(core);
    app.sync = {
      type: "nats",
      serialize,
      deserialize,
      ready: new Promise((resolve, reject) => {
        natsClient
          .then((connection) => {
            const sub = connection.subscribe(key);
            // listening events and resolving connection
            (async () => {
              for await (const message of sub) {
                const data = stringCodec.decode(message.data);
                debug(
                  `[${sub.getProcessed()}]: ${stringCodec.decode(message.data)}`
                );
                app.emit("sync-in", data);
              }
              debug("subscription closed");
            })();
            resolve(connection);
          })
          .catch((error) => reject(error));
      }),
    };

    app.on("sync-out", async (data) => {
      const _natsClient = await connect(natsConnectionOptions);
      debug(`Publishing key ${key} to NATS`);
      await _natsClient.publish(key, stringCodec.encode(data));
      await _natsClient.drain();
    });
  };
};

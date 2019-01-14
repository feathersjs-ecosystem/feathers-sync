const redis = require('redis');
const debug = require('debug')('feathers-sync:redis');
const core = require('../core');

module.exports = config => {
    return app => {
        const key = config.key || 'feathers-sync';
        const db = config.uri || config.db;
        if (typeof db !== "undefined")
            debug(`Setting up Redis client for ${db}`);
        const pub = config.pub || redis.createClient(db);
        const sub = config.sub || redis.createClient(db);
    
        app.configure(core);
        app.sync = {
            pub,
            sub,
            type: 'redis',
            ready: Promise.race([
                new Promise((resolve, reject) => sub.once('ready', resolve)),
                new Promise((resolve, reject) => sub.once('error', reject))
            ])
        };

        app.on('sync-out', data => {
            debug(`Publishing key ${key} to Redis`);
            pub.publish(key, JSON.stringify(data));
        });

        sub.subscribe(key);
        sub.on('message', function (e, data) {
            if (e === key) {
                debug(`Got ${key} message from Redis`);
                app.emit('sync-in', JSON.parse(data));
            }
        });
    };
};
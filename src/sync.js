var debug = require('debug')('feathers-sync');
var mongo = require('./mongodb');
var redis = require('./redis');

module.exports = function(config) {

  config = config || { db: 'mongodb://localhost:27017/sync' };

  var proto = config.db.split('://')[0];

  if(['mongodb', 'redis'].indexOf(proto) === -1){
    return debug('Adapter not found %s', proto);
  }

  debug('will sync via adapter: %s ', proto);

  if('mongodb' === proto){
    return mongo(config);
  } else if('redis' === proto) {
    return redis(config);
  } else {
    return;
  }
};

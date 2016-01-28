var mubsub = require('mubsub');
var debug = require('debug')('feathers-sync');
var mubsub = require('./mubsub');
var redis = require('./redis');

module.exports = function(adapter, config) {

  adapter = adapter || 'mongo';
  config = config || { db: 'localhost:27017/sync' };

  if(['mongo', 'redis'].indexOf(adapter) === -1){
    return debug('Adapter not found %s', adapter);
  }

  debug('will sync via adapter: %s ', adapter);

  if(adapter.indexOf('mongo') > -1){
    return mubsub(config);
  } else if(adapter === 'redis') {
    return redis(config);
  } else {
    return;
  }
};

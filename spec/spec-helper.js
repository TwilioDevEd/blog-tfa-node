'use strict';

var mongoose = require('mongoose')
  , config = require('../config');

mongoose.Promise = global.Promise;

before((done) => {
  mongoose.connect(config.dbConnection, done);
});

after((done) => {
  mongoose.disconnect(done);
});

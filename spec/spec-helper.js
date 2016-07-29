'use strict';

var mongoose = require('mongoose')
  , config = require('../config');

mongoose.Promise = global.Promise;

before(function (done) {
  mongoose.connect(config.dbConnection, done);
});

after(function (done) {
  mongoose.disconnect(done);
});

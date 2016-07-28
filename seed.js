'use strict';

var mongoose = require('mongoose')
  , config = require('./config')
  , User = require('./models/user')
  , users = require('./users-data')
  , _ = require('underscore');

mongoose.connect(config.dbConnection, function(err) {
  if (err) throw new Error(err);

  User.remove({}, function() {
    User.create(users, function(err, result) {
      if (err) throw new Error(err);
      console.log('Data loaded succesfully!');
      mongoose.disconnect();
    });
  });
});

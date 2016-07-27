'use strict';

var mongoose = require('mongoose');

var schema = new mongoose.Schema({
  username: String
});

module.exports = mongoose.model('user', schema);

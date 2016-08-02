'use strict';

var bcrypt = require('bcrypt-nodejs')
  , mongoose = require('mongoose');

var schema = new mongoose.Schema({
  username: { type: String, unique: true, required: true, dropDups: true },
  phone_number: String,
  passwordHash: String
});

schema.statics.buildAndCreate = function(username, password, callback, fallback) {
  var self = this;
  bcrypt.hash(password, null, null, (err, hash) => {
    self.create({
      'username': username,
      'passwordHash': hash
    })
    .then(callback)
    .catch(fallback);
  });
};

schema.statics.findByUsername = function(username, callback) {
  return this.findOne({'username': username.toLowerCase()}, callback);
};

schema.methods.validatePassword = function(pass, callback) {
  bcrypt.compare(pass, this.passwordHash, callback);
};

module.exports = mongoose.model('user', schema);

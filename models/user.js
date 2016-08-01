'use strict';

var bcrypt = require('bcrypt-nodejs')
  , mongoose = require('mongoose');

var schema = new mongoose.Schema({
  username: { type: String, unique: true, required: true, dropDups: true },
  phone_number: String,
  password_hash: String
});

schema.statics.buildAndCreate = function(username, password, callback, fallback) {
  var self = this;
  bcrypt.hash(password, null, null, (err, hash) => {
    self.create({
      'username': username,
      'password_hash': hash
    })
    .then(callback)
    .catch(fallback);
  });
};

schema.statics.findByUsername = function(username, callback) {
  return this.findOne({'username': username.toLowerCase()}, callback);
};

schema.methods.validateToken = function(token) {
  console.log(`Validating token ${token}`);
  var verify = new totp.TotpAuth(this.totp_secret).verify(token);
  return verify !== null;
};

schema.methods.validatePassword = function(pass, callback) {
  bcrypt.compare(pass, this.password_hash, callback);
};

module.exports = mongoose.model('user', schema);

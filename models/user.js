'use strict';

var bcrypt = require('bcrypt-nodejs')
  , totp = require('../lib/totp')
  , mongoose = require('mongoose')
  , base32 = require('thirty-two');

var schema = new mongoose.Schema({
  username: { type: String, unique: true, required: true, dropDups: true },
  totpSecret: String,
  totpEnabledViaApp: Boolean,
  phoneNumber: String,
  totpEnabledViaSms: Boolean,
  passwordHash: String
});

schema.statics.buildAndCreate = function(username, password, callback, fallback) {
  var self = this;
  bcrypt.hash(password, null, null, (err, hash) => {
    self.create({
      'username': username,
      'passwordHash': hash,
      'totpSecret': totp.generateSecret()
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
  var verify = new totp.TotpAuth(this.totpSecret).verify(token);
  return verify !== null;
};

schema.methods.validatePassword = function(pass, callback) {
  bcrypt.compare(pass, this.passwordHash, callback);
};

module.exports = mongoose.model('user', schema);

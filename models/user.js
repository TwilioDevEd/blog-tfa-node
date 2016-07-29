'use strict';

var bcrypt = require('bcrypt-nodejs')
  , totp = require('../lib/totp')
  , mongoose = require('mongoose')
  , base32 = require('thirty-two');

var schema = new mongoose.Schema({
  username: { type: String, unique: true, required: true, dropDups: true },
  totp_secret: String,
  totp_enabled_via_app: Boolean,
  phone_number: String,
  totp_enabled_via_sms: Boolean,
  password_hash: String
});

schema.statics.buildAndCreate = function(username, password, callback, fallback) {
  var self = this;
  bcrypt.hash(password, null, null, (err, hash) => {
    self.create({
      'username': username,
      'password_hash': hash,
      'totp_secret': totp.generateSecret() //TODO change this
    })
    .then(callback)
    .catch(fallback);
  });
};

schema.statics.findByUsername = function(username, callback) {
  return this.findOne({'username': username.toLowerCase()}, callback);
}

schema.statics.qrcodeUri = function(user) {
  var encoded = base32.encode(user.totp_secret);
  var encodedForGoogle = encoded.toString().replace(/=/g,'');
  return `otpauth://totp/${user.username}?secret=${encodedForGoogle}`;
}

schema.methods.validateToken = function(token) {
  console.log(`Validating token ${token}`);
  var verify = new totp.TotpAuth(this.totp_secret).verify(token);
  return verify !== null;
};

schema.methods.validatePassword = function(pass, callback) {
  bcrypt.compare(pass, this.password_hash, callback);
};

module.exports = mongoose.model('user', schema);

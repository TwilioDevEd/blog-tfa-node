'use strict';

var bcrypt = require('bcrypt-nodejs')
  , totp = require('../lib/totp')
  , mongoose = require('mongoose');

var schema = new mongoose.Schema({
  username: String,
  totp_secret: String,
  totp_enabled_via_app: Boolean,
  phone_number: String,
  totp_enabled_via_sms: Boolean,
  password_hash: String
});

schema.statics.build = function(username, password, callback) {
  bcrypt.hash(password, null, null, function(err, hash) {
    callback({
      'username': username,
      'password_hash': hash,
      'totp_secret': totp.secret//TODO change this
    });
  });
}
schema.methods.validatePassword = function(pass, callback) {
  bcrypt.compare(pass, this.password_hash, callback);
};

module.exports = mongoose.model('user', schema);

'use strict';

var bcrypt = require('bcrypt-nodejs');

var mongoose = require('mongoose');

var schema = new mongoose.Schema({
  username: String,
  totp_secret: String,
  totp_enabled_via_app: Boolean,
  phone_number: String,
  totp_enabled_via_sms: Boolean,
  password_hash: String
});

schema.methods.validatePassword = function(pass, callback) {
  bcrypt.compare(pass, this.password_hash, callback);
};


module.exports = mongoose.model('user', schema);

'use strict';

var bcrypt = require('bcrypt-nodejs')
  , totp = require('../lib/totp')
  , mongoose = require('mongoose')
  , twilioClient = require('twilio')()
  , base32 = require('thirty-two');
;

var schema = new mongoose.Schema({
  username: { type: String, unique: true, required: true, dropDups: true },
  totp_secret: String,
  totp_enabled_via_app: Boolean,
  phone_number: String,
  totp_enabled_via_sms: Boolean,
  password_hash: String
});

schema.statics.buildAndCreate = function(username, password, callback) {
  bcrypt.hash(password, null, null, (err, hash) => {
    this.create({
      'username': username,
      'password_hash': hash,
      'totp_secret': totp.secret//TODO change this
    }, callback);
  });
}

schema.statics.sendSms = function(username, callback) {
  this.findByUsername(username, (err, user) => {
    var token = new totp.TotpAuth(user.totp_secret).generate();
    var msg = `Use this code to log in: ${token}`;
    console.log(msg);
    twilioClient.sms.messages.create({
      to: user.phone_number,
      from: process.env.TWILIO_PHONE_NUMBER,
      body: msg
    }, function(err, message) {
      if (!err) {
        callback(user, true);
      } else {
        console.log(`Oops! There was an error!`);
        console.log(err);
        callback(user, false);
      }
    });
  });
};

schema.statics.findByUsername = function(username, callback) {
  this.findOne({'username': username.toLowerCase()}, callback);
}

schema.statics.qrcodeUri = function(user) {
  var encoded = base32.encode(user.totp_secret);
  var encodedForGoogle = encoded.toString().replace(/=/g,'');
  return `otpauth://totp/somelabel?secret=${encodedForGoogle}`;
}

schema.methods.validateToken = function(token) {
  console.log(`Validating token ${token}`);
  var verify = new totp.TotpAuth(this.totp_secret).verify(token);
  return verify !== null && verify.delta === 0;
};

schema.methods.validatePassword = function(pass, callback) {
  bcrypt.compare(pass, this.password_hash, callback);
};

module.exports = mongoose.model('user', schema);

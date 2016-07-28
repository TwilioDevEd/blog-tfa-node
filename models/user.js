'use strict';

var bcrypt = require('bcrypt-nodejs')
  , totp = require('../lib/totp')
  , mongoose = require('mongoose')
  , twilio = require('twilio');

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

schema.statics.sendSms = function(username, callback) {
  this.findOne({'username': username}, function(err, user) {
    if (user.totp_enabled_via_sms) {
      var token = new totp.TotpAuth().generate();
      var msg = `Use this code to log in: ${token}`;
      client.sms.messages.create({
        to: user.phone_number,
        from: process.env.TWILIO_PHONE_NUMBER,
        body: msg
      }, function(err, message) {
        if (!err) {
          console.log(`Success! The SID for this SMS message is: ${message.sid}`);
          callback(user, true);
        } else {
          console.log('Oops! There was an error!');
          callback(user, false);
        }
      });
    } else {
      callback(user, false);
    }  
  })
  
}

schema.methods.validatePassword = function(pass, callback) {
  bcrypt.compare(pass, this.password_hash, callback);
};

module.exports = mongoose.model('user', schema);

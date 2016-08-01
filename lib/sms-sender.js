'use strict';

var totp = require('../lib/totp')
  , twilioClient = require('twilio')()
  , User = require('../models/user')
  , config = require('../config');

module.exports = (username, callback, fallback) => {
  return User.findByUsername(username)
  .then((user) => {
    var token = new totp.TotpAuth(user.totp_secret).generate();
    var msg = `Use this code to log in: ${token}`;
    console.log(msg);
    twilioClient.sms.messages.create({
      to: user.phone_number,
      from: config.phoneNumber,
      body: msg
    }, (err, message) => {
      if (!err) {
        callback(user, true);
      } else {
        console.log(`Oops! There was an error!`);
        console.log(err);
        callback(user, false);
      }
    });
  })
  .catch(fallback);
};

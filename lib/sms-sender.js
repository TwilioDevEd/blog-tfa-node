'use strict';

var totp = require('../lib/totp')
  , config = require('../config')
  , twilioClient = require('twilio')(config.accountSid, config.secret)
  , User = require('../models/user');

module.exports = (username, callback, fallback) => {
  return User.findByUsername(username)
  .then((user) => {
    var token = new totp.TotpAuth(user.totpSecret).generate();
    var msg = `Use this code to log in: ${token}`;
    console.log(msg);
    twilioClient.api.messages.create({
      to: user.phoneNumber,
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

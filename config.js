'use strict';

var _ = require('underscore');

var dbConnection = function() {
  if (process.env.NODE_ENV === 'test') {
    return 'mongodb://localhost/test';
  }

  return 'mongodb://localhost/blog-tfa';
};

var config = {
  dbConnection: dbConnection(),
  secret: process.env.APP_SECRET,
  accountSid: process.env.TWILIO_ACCOUNT_SID,
  authToken: process.env.TWILIO_AUTH_TOKEN,
  phoneNumber: process.env.TWILIO_NUMBER
};

var isUnconfigured = _.every(_.values(config), function(value) {
  return _.isUndefined(value);
});

if (isUnconfigured) {
  throw new Error(
    'TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_NUMBER, and APP_SECRET must be set');
}

module.exports = config;

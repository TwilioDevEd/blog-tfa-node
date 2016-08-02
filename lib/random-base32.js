'use strict';

var randomstring = require("randomstring");

// Generates random base 32 secret compatible to Google Authenticator
module.exports = () => {
  return randomstring.generate({
    length: 16,
    charset: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'
  });
};

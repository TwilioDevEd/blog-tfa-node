'use strict';

var expect = require('chai').expect,
    totp = require('../../lib/totp');

describe('TOTP', function () {
  describe('#gen', function () {
    it('generates a valid token', function () {
      var totpAuth = new totp.TotpAuth('12345678901234567890');
      var token = totpAuth.generate();
      expect(totpAuth.verify(token)).to.be.deep.equals({delta: 0});
    });
  });
});

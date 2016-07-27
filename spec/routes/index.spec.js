'use strict';

var expect = require('chai').expect
  , supertest = require('supertest')
  , cheerio = require('cheerio')
  , app = require('../../app.js');

describe('default route', function () {
  describe('GET /', function () {
    it('responds with 200 OK', function (done) {
      supertest(app)
      .get('/')
      .expect(function (res) {
          var $ = cheerio.load(res.text);
          expect($('.well div h1').text()).to.equal('Don\'t have an account?');
          expect($('button.btn').text()).to.equal('Log in');
          expect($('a.btn').text()).to.contain('Sign up');
          var text = 'This is a demonstration of how to add TOTP based ' +
                      'Two-Factor Authentication to an existing application.';
          expect($('.span6 div').first().text()).to.equal(text);
        })
      .expect(200, done);
    });
  });

});

// describe('main page', function () {
//   describe('GET /', function () {
//     it('responds with 200 OK', function (done) {
//       supertest(app).get('/').expect(200, done);
//     });
//   });
// });
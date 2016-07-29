'use strict';

var mockery = require('mockery');

mockery.enable();
mockery.warnOnUnregistered(false);
mockery.registerMock('twilio', function() {
  return {
    sms: {
      messages: {
        create: function(opts, callback) {
          if (opts.to === 'FAKE') {
            callback('error fake number', undefined);
          } else {
            callback(undefined, 'default message');
          }
        }
      }
    }
  };
});

var expect = require('chai').expect
  , supertest = require('supertest-session')
  , cheerio = require('cheerio')
  , users = require('../../users-data.json')
  , User = require('../../models/user')
  , app = require('../../app')
  , totp = require('../../lib/totp');

var testSession = null;

require('../spec-helper');

beforeEach(function () {
  testSession = supertest(app);
});

describe('default route', function () {
  describe('GET /', function () {
    it('responds with 200 OK', function (done) {
      testSession.get('/')
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

describe('sign in', function () {
  beforeEach(function (done) {
      User.remove({}, function() {
        User.create(users, function(err, result) {
          done();
        });
      });
    });
    
  describe('with badpassword', function () {
    it('responds with alert Incorrect Username or Password', function (done) {
      testSession
        .post('/')
        .send({
          username: 'user',
          password: 'badpassword'
        })
        .end(function(err, res){
          expect(res.statusCode).to.equal(200);
          var $ = cheerio.load(res.text); 
          expect($('.alert.alert-error').text()).to.contain('Incorrect Username or Password');
          done();
        });
    });
  });

  describe('with bad user', function () {
    it('responds with alert Incorrect Username or Password', function (done) {
      testSession
        .post('/')
        .send({
          username: 'baduser',
          password: 'password'
        })
        .end(function(err, res){
          expect(res.statusCode).to.equal(200);
          var $ = cheerio.load(res.text);
          expect($('.alert.alert-error').text()).to.contain('Incorrect Username or Password');
          done();
        });
    });
  });

  describe('with bad user and bad password', function () {
    it('responds with alert Incorrect Username or Password', function (done) {
      testSession
        .post('/')
        .send({
          username: 'baduser',
          password: 'badpassword'
        })
        .end(function(err, res){
          expect(res.statusCode).to.equal(200);
          var $ = cheerio.load(res.text);
          expect($('.alert.alert-error').text()).to.contain('Incorrect Username or Password');
          done();
        });
    });
  });

  describe('with correct user and password', function () {
    it('responds with You are logged in', function (done) {
      testSession
        .post('/')
        .send({
          username: 'user',
          password: 'password'
        })
        .end(function(err, res){
          expect(res.statusCode).to.equal(302);
          expect(res.header.location).to.equal('/user/');
          done();
        });
    });
  });

  describe('with correct user (case insensitive) and password', function () {
    it('responds with You are logged in', function (done) {
      testSession
        .post('/')
        .send({
          username: 'UsEr',
          password: 'password'
        })
        .end(function(err, res){
          expect(res.statusCode).to.equal(302);
          expect(res.header.location).to.equal('/user/');
          done();
        });
    });
  });

  describe('with sms enabled', function () {
    it('responds with "Verify TFA" page', function (done) {
      testSession
        .post('/')
        .send({
          username: 'user.app_no.sms_yes',
          password: 'password'
        })
        .end(function(err, res){
          expect(res.statusCode).to.equal(302);
          expect(res.header.location).to.equal('/verify_tfa/');
          done();
        });
    });
  });
});

describe('sign up', function () {
  describe('with passwords not matching', function () {
    it('responds with "Passwords do not match" message', function (done) {
      testSession
        .post('/sign-up/')
        .send({
          username: 'newuser',
          password1: 'password',
          password2: 'passwordddddd'
        })
        .end(function(err, res){
          expect(res.statusCode).to.equal(200);
          var $ = cheerio.load(res.text);
          expect($('.alert.alert-error').text()).to.contain('Passwords do not match');
          done();
        });
    });
  });

  describe('with correct user and password', function () {
    it('redirects to "/user/"', function (done) {
      testSession
        .post('/sign-up/')
        .send({
          username: 'newuser',
          password1: 'password',
          password2: 'password'
        })
        .end(function(err, res){
          expect(res.statusCode).to.equal(302);
          expect(res.header.location).to.equal('/user/');
          done();
        });
    });
  });

  describe('with username that already exists', function () {
    it('redirects to "/user/"', function (done) {
      testSession
        .post('/sign-up/')
        .send({
          username: 'user2',
          password1: 'password',
          password2: 'password'
        })
        .end(function(err, res){
          expect(res.statusCode).to.equal(200);
          var $ = cheerio.load(res.text);
          expect($('.alert.alert-error').text()).to.contain('That username is already in use');
          done();
        });
    });
  });

  describe('with username (case insensitive) that already exists', function () {
    it('redirects to "/user/"', function (done) {
      testSession
        .post('/sign-up/')
        .send({
          username: 'UsEr2',
          password1: 'password',
          password2: 'password'
        })
        .end(function(err, res){
          expect(res.statusCode).to.equal(200);
          var $ = cheerio.load(res.text);
          expect($('.alert.alert-error').text()).to.contain('That username is already in use');
          done();
        });
    });
  });
});

describe('sign in', function() {
  describe('when I access /user/ after sign in', function() {
    it('responds with enable buttons', function (done) {
      testSession
        .post('/')
        .send({
          username: 'user',
          password: 'password'
        })
        .end(function(err, res) {
          testSession.get(res.header.location)
          .end(function(err2, res2) {
            var $ = cheerio.load(res2.text);
            expect($('a.btn').eq(0).text()).to.contain('Enable app based authentication');
            expect($('a.btn').eq(1).text()).to.contain('Enable SMS based authentication');
            expect($('ul.nav li a').eq(1).text()).to.contain('Log out');
            done();
          });
        });
    });
  });

  describe('when I access /user/ after sign in with app-> false, sms->false', function() {
    it('responds with you are logged in', function (done) {
      testSession
        .post('/')
        .send({
          username: 'user.app_no.sms_no',
          password: 'password'
        })
        .end(function(err, res) {
          testSession.get(res.header.location)
          .end(function(err2, res2) {
            var $ = cheerio.load(res2.text);
            expect($('.container div h1').text()).to.contain('You are logged in');
            done();
          });
        });
    });
  });

  describe('when I access sign in with app-> yes, sms->false', function() {
    it('redirects to /verify_tfa/ page with google authenticator', function (done) {
      testSession
        .post('/')
        .send({
          username: 'user.app_yes.sms_no',
          password: 'password'
        })
        .end(function(err, res) {
          expect(res.header.location).to.equal('/verify_tfa/');

          testSession.get(res.header.location)
          .end(function(err2, res2) {
            var $ = cheerio.load(res2.text);  
            expect(res2.text).to.not.contain('You are logged in');
            expect(res2.text).to.contain('Account Verification');
            expect(res2.text).to.contain('Google Authenticator');
            expect(res2.text).to.not.contain('SMS that was just sent to you');
            expect(res2.text).to.contain('Enter your verification code here');
            done();
          });
        });
    });
  });

  describe('when I access sign in with app-> false, sms-> true', function() {
    it('redirects to /verify_tfa/ page with "sms was sent" message', function (done) {
      testSession
        .post('/')
        .send({
          username: 'user.app_no.sms_yes',
          password: 'password'
        })
        .end(function(err, res) {
          expect(res.header.location).to.equal('/verify_tfa/');

          testSession.get(res.header.location)
          .end(function(err2, res2) {
            var $ = cheerio.load(res2.text);  
            expect(res2.text).to.not.contain('You are logged in');
            expect(res2.text).to.contain('Account Verification');
            expect(res2.text).to.not.contain('Google Authenticator');
            expect(res2.text).to.contain('SMS that was just sent to you');
            expect(res2.text).to.contain('Enter your verification code here');
            done();
          });
        });
    });
  });

  describe('when I access sign in with app-> true, sms-> true', function() {
    it('redirects to /verify_tfa/ page with "Google Authenticator" + "sms was sent" messages', function (done) {
      testSession
        .post('/')
        .send({
          username: 'user.app_yes.sms_yes',
          password: 'password'
        })
        .end(function(err, res) {
          expect(res.header.location).to.equal('/verify_tfa/');

          testSession.get(res.header.location)
          .end(function(err2, res2) {
            var $ = cheerio.load(res2.text);  
            expect(res2.text).to.not.contain('You are logged in');
            expect(res2.text).to.contain('Account Verification');
            expect(res2.text).to.contain('Google Authenticator');
            expect(res2.text).to.contain('SMS that was just sent to you');
            expect(res2.text).to.contain('Enter your verification code here');
            done();
          });
        });
    });
  });

});

describe('enable tfa via app', function() {
  describe('get /enable-tfa-via-app/', function() {
    it('shows google authenticator instructions', function(done) {
      testSession
        .post('/')
        .send({
          username: 'user',
          password: 'password'
        })
        .end(function(err, res) {

          testSession
          .get('/enable-tfa-via-app')
          .end(function(err2, res2) {
            expect(res2.statusCode).to.equal(200);
            expect(res2.text).to.contain('Install Google Authenticator');
            expect(res2.text).to.contain('Open the Google Authenticator app');
            expect(res2.text).to.contain('Tap menu, then tap "Set up account"');
            expect(res2.text).to.contain('then tap "Scan a barcode"');
            expect(res2.text).to.contain('scan the barcode below');
            expect(res2.text).to.contain('Once you have scanned the barcode, enter the 6-digit code below');
            expect(res2.text).to.contain('Submit');
            expect(res2.text).to.contain('Cancel');
            done();
          });
        });
    });
  });

  describe('post /enable-tfa-via-app/ with correct token', function() {
    it('shows "You are setup via Google Authenticator"', function(done) {
      testSession
        .post('/')
        .send({
          username: 'user',
          password: 'password'
        })
        .end(function(err, res) {
          User.findOne({'username': 'user'}, function(err, result) {
            testSession
            .post('/enable-tfa-via-app')
            .send({
              token: new totp.TotpAuth(result.totp_secret).generate()
            })
            .end(function(err2, res2) {
              expect(res2.statusCode).to.equal(200);
              expect(res2.text).to.contain('You are set up');
              expect(res2.text).to.contain('via Google Authenticator');
              done();
            });
          });
        });
    });
  });

  describe('post /enable-tfa-via-app/ with wrong token', function() {
    it('shows "There was an error verifying your token"', function(done) {
      testSession
        .post('/')
        .send({
          username: 'user',
          password: 'password'
        })
        .end(function(err, res) {
          User.findOne({'username': 'user'}, function(err, result) {
            testSession
            .post('/enable-tfa-via-app')
            .send({
              token: '-1'
            })
            .end(function(err2, res2) {
              expect(res2.statusCode).to.equal(200);
              expect(res2.text).to.contain('There was an error verifying your token');
              done();
            });
          });
        });
    });
  });
});

describe('enable tfa via sms', function() {
  describe('send phone number to /enable-tfa-via-sms/', function() {
    it('shows sms instructions', function(done) {
      testSession
        .post('/')
        .send({
          username: 'user',
          password: 'password'
        })
        .end(function(err, res) {
          testSession
          .post('/enable-tfa-via-sms')
          .send({
            'phone_number': '+14155551212'
          })
          .end(function(err2, res2) {
            expect(res2.statusCode).to.equal(200);
            expect(res2.text).to.contain('Enter your mobile phone number');
            expect(res2.text).to.contain('A 6-digit verification code will be sent');
            expect(res2.text).to.contain('Enter your verification code');
            expect(res2.text).to.contain('Submit and verify');
            expect(res2.text).to.contain('Cancel');
            done();
          });
        });
    });
  });

  describe('send wrong phone number', function() {
    it('show error message', function(done) {
      testSession
        .post('/')
        .send({
          username: 'user',
          password: 'password'
        })
        .end(function(err, res) {
          testSession
          .post('/enable-tfa-via-sms')
          .send({
            'phone_number': 'FAKE'
          })
          .end(function(err2, res2) {
            expect(res2.statusCode).to.equal(200);
            expect(res2.text).to.contain('There was an error sending');
            done();
          });
        });
    });
  });

  describe('send correct token to /enable-tfa-via-sms/', function() {
    it('shows "you are set up" msg', function(done) {
      testSession
        .post('/')
        .send({
          username: 'user',
          password: 'password'
        })
        .end(function(err, res) {
          testSession
          .post('/enable-tfa-via-sms')
          .send({
            'phone_number': '+14155551212'
          })
          .end(function(err2, res2) {
            //TODO improve this test using spy
            var token = new totp.TotpAuth().generate();

            testSession
            .post('/enable-tfa-via-sms')
            .send({
              'token': token
            })
            .end(function(err2, res2) {
              expect(res2.statusCode).to.equal(200);
              expect(res2.text).to.contain('You are set up');
              expect(res2.text).to.contain('via Twilio SMS');

              done();
            });
          });
        });
    });
  });
});
'use strict';

var expect = require('chai').expect
  , supertest = require('supertest')
  , cheerio = require('cheerio')
  , users = require('../../users-data.json')
  , User = require('../../models/user')
  , app = require('../../app');

require('../spec-helper');

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

describe('sign in', function () {
  beforeEach(function (done) {
      User.remove({}, function() {
        User.create(users, function(err, result) {
          done();
        });
      });
    });
    
  describe('sign in with badpassword', function () {
    it('responds with alert Incorrect Username or Password', function (done) {
      supertest(app)
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

  describe('sign in with bad user', function () {
    it('responds with alert Incorrect Username or Password', function (done) {
      supertest(app)
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

  describe('sign in with bad user and bad password', function () {
    it('responds with alert Incorrect Username or Password', function (done) {
      supertest(app)
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

  describe('sign in with correct user and password', function () {
    it('responds with You are logged in', function (done) {
      supertest(app)
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

    describe('sign in with tfa', function () {
      it('responds with "Verify TFA" page', function (done) {
        supertest(app)
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
    describe('sign up with passwords not matching', function () {
      it('responds with "Passwords do not match" message', function (done) {
        supertest(app)
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

    describe('sign up with correct user and password', function () {
      it('redirects to "/user/"', function (done) {
        supertest(app)
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

    describe('sign up with username that already exists', function () {
      it('redirects to "/user/"', function (done) {
        supertest(app)
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
  });
});

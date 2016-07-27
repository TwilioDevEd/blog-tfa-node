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
  });
});

'use strict';

require('./mock-twilio');

var expect = require('chai').expect
  , supertest = require('supertest-session')
  , cheerio = require('cheerio')
  , users = require('../users-data.json')
  , User = require('../models/user')
  , app = require('../app');

var testSession = null;

require('./spec-helper');

beforeEach(() => {
  testSession = supertest(app);
});

// remove/add users
beforeEach((done) => {
  User.remove({}, () => {
    User.create(users, (err, result) => {
      done();
    });
  });
});

describe('default route', () => {
  describe('GET /', () => {
    it('responds with 200 OK', (done) => {
      testSession.get('/')
      .expect((res) => {
          var $ = cheerio.load(res.text);
          expect($('.well div h1').text()).to.equal('Don\'t have an account?');
          expect($('button.btn').text()).to.equal('Log in');
          expect($('a.btn').text()).to.contain('Sign up');
        })
      .expect(200, done);
    });
  });

});

describe('sign in', () => {
    
  describe('with badpassword', () => {
    it('responds with alert Incorrect Username or Password', (done) => {
      testSession
        .post('/')
        .send({
          username: 'user',
          password: 'badpassword'
        })
        .end((err, res) => {
          expect(res.statusCode).to.equal(200);
          var $ = cheerio.load(res.text); 
          expect($('.alert.alert-error').text()).to.contain('Incorrect Username or Password');
          done();
        });
    });
  });

  describe('with bad user', () => {
    it('responds with alert Incorrect Username or Password', (done) => {
      testSession
        .post('/')
        .send({
          username: 'baduser',
          password: 'password'
        })
        .end((err, res) => {
          expect(res.statusCode).to.equal(200);
          var $ = cheerio.load(res.text);
          expect($('.alert.alert-error').text()).to.contain('Incorrect Username or Password');
          done();
        });
    });
  });

  describe('with bad user and bad password', () => {
    it('responds with alert Incorrect Username or Password', (done) => {
      testSession
        .post('/')
        .send({
          username: 'baduser',
          password: 'badpassword'
        })
        .end((err, res) => {
          expect(res.statusCode).to.equal(200);
          var $ = cheerio.load(res.text);
          expect($('.alert.alert-error').text()).to.contain('Incorrect Username or Password');
          done();
        });
    });
  });

  describe('with correct user and password', () => {
    it('responds with You are logged in', (done) => {
      testSession
        .post('/')
        .send({
          username: 'user',
          password: 'password'
        })
        .end((err, res) => {
          expect(res.statusCode).to.equal(302);
          expect(res.header.location).to.equal('/user/');
          done();
        });
    });
  });

  describe('with correct user (case insensitive) and password', () => {
    it('responds with You are logged in', (done) => {
      testSession
        .post('/')
        .send({
          username: 'UsEr',
          password: 'password'
        })
        .end((err, res) => {
          expect(res.statusCode).to.equal(302);
          expect(res.header.location).to.equal('/user/');
          done();
        });
    });
  });

});

describe('sign up', () => {
  describe('with passwords not matching', () => {
    it('responds with "Passwords do not match" message', (done) => {
      testSession
        .post('/sign-up/')
        .send({
          username: 'newuser',
          password1: 'password',
          password2: 'passwordddddd'
        })
        .end((err, res) => {
          expect(res.statusCode).to.equal(200);
          var $ = cheerio.load(res.text);
          expect($('.alert.alert-error').text()).to.contain('Passwords do not match');
          done();
        });
    });
  });

  describe('with correct user and password', () => {
    it('redirects to "/user/"', (done) => {
      testSession
        .post('/sign-up/')
        .send({
          username: 'newuser',
          password1: 'password',
          password2: 'password'
        })
        .end((err, res) => {
          expect(res.statusCode).to.equal(302);
          expect(res.header.location).to.equal('/user/');
          done();
        });
    });
  });

  describe('with username that already exists', () => {
    it('redirects to "/user/"', (done) => {
      testSession
        .post('/sign-up/')
        .send({
          username: 'user2',
          password1: 'password',
          password2: 'password'
        })
        .end((err, res) => {
          expect(res.statusCode).to.equal(200);
          var $ = cheerio.load(res.text);
          expect($('.alert.alert-error').text()).to.contain('That username is already in use');
          done();
        });
    });
  });

  describe('with username (case insensitive) that already exists', () => {
    it('redirects to "/user/"', (done) => {
      testSession
        .post('/sign-up/')
        .send({
          username: 'UsEr2',
          password1: 'password',
          password2: 'password'
        })
        .end((err, res) => {
          expect(res.statusCode).to.equal(200);
          var $ = cheerio.load(res.text);
          expect($('.alert.alert-error').text()).to.contain('That username is already in use');
          done();
        });
    });
  });
});

describe('sign in', () => {
  describe('when I access /user/ after sign in', () => {
    it('responds with enable buttons', (done) => {
      testSession
        .post('/')
        .send({
          username: 'user',
          password: 'password'
        })
        .end((err, res) => {
          testSession.get(res.header.location)
          .end((err2, res2) => {
            var $ = cheerio.load(res2.text);
            expect($('ul.nav li a').eq(1).text()).to.contain('Log out');
            done();
          });
        });
    });
  });
});

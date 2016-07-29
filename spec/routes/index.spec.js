'use strict';

require('../mock-twilio');

var expect = require('chai').expect
  , supertest = require('supertest-session')
  , cheerio = require('cheerio')
  , users = require('../../users-data.json')
  , User = require('../../models/user')
  , app = require('../../app')
  , totp = require('../../lib/totp');

var testSession = null;

require('../spec-helper');

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
          var text = 'This is a demonstration of how to add TOTP based ' +
                      'Two-Factor Authentication to an existing application.';
          expect($('.span6 div').first().text()).to.equal(text);
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

  describe('with sms enabled', () => {
    it('responds with "Verify TFA" page', (done) => {
      testSession
        .post('/')
        .send({
          username: 'user.app_no.sms_yes',
          password: 'password'
        })
        .end((err, res) => {
          expect(res.statusCode).to.equal(302);
          expect(res.header.location).to.equal('/verify-tfa/');
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
            expect($('a.btn').eq(0).text()).to.contain('Enable app based authentication');
            expect($('a.btn').eq(1).text()).to.contain('Enable SMS based authentication');
            expect($('ul.nav li a').eq(1).text()).to.contain('Log out');
            done();
          });
        });
    });
  });

  describe('when I access /user/ after sign in with app-> false, sms->false', () => {
    it('responds with you are logged in', (done) => {
      testSession
        .post('/')
        .send({
          username: 'user.app_no.sms_no',
          password: 'password'
        })
        .end((err, res) => {
          testSession.get(res.header.location)
          .end((err2, res2) => {
            var $ = cheerio.load(res2.text);
            expect($('.container div h1').text()).to.contain('You are logged in');
            done();
          });
        });
    });
  });

  describe('when I access sign in with app-> yes, sms->false', () => {
    it('redirects to /verify-tfa/ page with google authenticator', (done) => {
      testSession
        .post('/')
        .send({
          username: 'user.app_yes.sms_no',
          password: 'password'
        })
        .end((err, res) => {
          expect(res.header.location).to.equal('/verify-tfa/');

          testSession.get(res.header.location)
          .end((err2, res2) => {
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

  describe('when I access sign in with app-> false, sms-> true', () => {
    it('redirects to /verify-tfa/ page with "sms was sent" message', (done) => {
      testSession
        .post('/')
        .send({
          username: 'user.app_no.sms_yes',
          password: 'password'
        })
        .end((err, res) => {
          expect(res.header.location).to.equal('/verify-tfa/');

          testSession.get(res.header.location)
          .end((err2, res2) => {
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

  describe('when I access sign in with app-> true, sms-> true', () => {
    it('redirects to /verify-tfa/ page with "Google Authenticator" + "sms was sent" messages', (done) => {
      testSession
        .post('/')
        .send({
          username: 'user.app_yes.sms_yes',
          password: 'password'
        })
        .end((err, res) => {
          expect(res.header.location).to.equal('/verify-tfa/');

          testSession.get(res.header.location)
          .end((err2, res2) => {
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

describe('enable tfa via app', () => {
  describe('get /enable-tfa-via-app/', () => {
    it('shows google authenticator instructions', (done) => {
      testSession
        .post('/')
        .send({
          username: 'user',
          password: 'password'
        })
        .end((err, res) => {

          testSession
          .get('/enable-tfa-via-app')
          .end((err2, res2) => {
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

  describe('post /enable-tfa-via-app/ with correct token', () => {
    it('shows "You are setup via Google Authenticator"', (done) => {
      testSession
        .post('/')
        .send({
          username: 'user',
          password: 'password'
        })
        .end((err, res) => {
          User.findOne({'username': 'user'}, (err, result) => {
            testSession
            .post('/enable-tfa-via-app')
            .send({
              token: new totp.TotpAuth(result.totp_secret).generate()
            })
            .end((err2, res2) => {
              expect(res2.statusCode).to.equal(200);
              expect(res2.text).to.contain('You are set up');
              expect(res2.text).to.contain('via Google Authenticator');
              done();
            });
          });
        });
    });
  });

  describe('post /enable-tfa-via-app/ with wrong token', () => {
    it('shows "There was an error verifying your token"', (done) => {
      testSession
        .post('/')
        .send({
          username: 'user',
          password: 'password'
        })
        .end((err, res) => {
          User.findOne({'username': 'user'}, (err, result) => {
            testSession
            .post('/enable-tfa-via-app')
            .send({
              token: '-1'
            })
            .end((err2, res2) => {
              expect(res2.statusCode).to.equal(200);
              expect(res2.text).to.contain('There was an error verifying your token');
              done();
            });
          });
        });
    });
  });
});

describe('enable tfa via sms', () => {
  describe('send phone number to /enable-tfa-via-sms/', () => {
    it('shows sms instructions', (done) => {
      testSession
        .post('/')
        .send({
          username: 'user',
          password: 'password'
        })
        .end((err, res) => {
          testSession
          .post('/enable-tfa-via-sms')
          .send({
            'phone_number': '+14155551212'
          })
          .end((err2, res2) => {
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

  describe('send wrong phone number', () => {
    it('show error message', (done) => {
      testSession
        .post('/')
        .send({
          username: 'user',
          password: 'password'
        })
        .end((err, res) => {
          testSession
          .post('/enable-tfa-via-sms')
          .send({
            'phone_number': 'FAKE'
          })
          .end((err2, res2) => {
            expect(res2.statusCode).to.equal(200);
            expect(res2.text).to.contain('There was an error sending');
            done();
          });
        });
    });
  });

  describe('send correct token to /enable-tfa-via-sms/', () => {
    it('shows "you are set up" msg', (done) => {
      testSession
        .post('/')
        .send({
          username: 'user',
          password: 'password'
        })
        .end((err, res) => {
          testSession
          .post('/enable-tfa-via-sms')
          .send({
            'phone_number': '+14155551212'
          })
          .end((err2, res2) => {
            //TODO improve this test using spy
            var token = new totp.TotpAuth('R6LPJTVQXJFRYNDJ').generate();

            testSession
            .post('/enable-tfa-via-sms')
            .send({
              'token': token
            })
            .end((err2, res2) => {
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

describe('verify tfa sms enabled', () => {
  describe('when submits valid token', () => {
    it('logins', (done) => {
      testSession
      .post('/')
      .send({
        username: 'user.app_no.sms_yes',
        password: 'password'
      })
      .end((err, res) => {
        testSession
        .get('/verify-tfa/')
        .end((err2, res2) => {
          expect(res2.statusCode).to.equal(200);
          expect(res2.text).to.contain('The SMS that was just sent to you');
          //TODO improve this test using spy
          var token = new totp.TotpAuth('NVHWYJ4OV75YW3WC').generate();
          testSession
          .post('/verify-tfa/')
          .send({'token': token})
          .end((err3, res3) => {
            expect(res3.statusCode).to.equal(302);
            expect(res3.header.location).to.equal('/user/');
            done();
          });
        });
      });
    });
  });

  describe('when submits invalid token', () => {
    it('show token is invalid message', (done) => {
      testSession
      .post('/')
      .send({
        username: 'user.app_no.sms_yes',
        password: 'password'
      })
      .end((err, res) => {
        testSession
        .get('/verify-tfa/')
        .end((err2, res2) => {
          expect(res2.statusCode).to.equal(200);
          expect(res2.text).to.contain('The SMS that was just sent to you');
          //TODO improve this test using spy
          var token = new totp.TotpAuth('WRONG_TOKEN').generate();
          testSession
          .post('/verify-tfa/')
          .send({'token': token})
          .end((err3, res3) => {
            expect(res3.statusCode).to.equal(200);
            expect(res3.text).to.contain('There was an error verifying your token');
            done();
          });
        });
      });
    });
  });
});

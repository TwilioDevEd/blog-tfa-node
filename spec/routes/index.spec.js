'use strict';

var expect = require('chai').expect
  , supertest = require('supertest')
  , app = require('../../app.js');

describe('default route', function () {
  describe('GET /', function () {
    it('responds with 200 OK', function (done) {
      supertest(app).get('/').expect(200, done);
    });
  });
});
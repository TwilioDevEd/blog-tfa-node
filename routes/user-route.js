'use strict';

var express = require('express')
  , router = express.Router()
  , loginRequired = require('../lib/login-required')
  , buildData = require('../lib/build-data');

// GET /user/
router.get('/', loginRequired, (req, res, next) => {
  var data = buildData(req);
  res.render('user.jade', data);
});

module.exports = router;

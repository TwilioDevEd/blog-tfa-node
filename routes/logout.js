'use strict';

var express = require('express')
  , router = express.Router();

// GET /logout
router.get('/', (req, res) => {
  req.session.destroy((err) => res.redirect('/'));
});

module.exports = router;

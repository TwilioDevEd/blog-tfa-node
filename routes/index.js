var express = require('express');
var router = express.Router();

router.get('/', function(req, res, next) {
  var data = { 
    opts: {
      user: {}
    } 
  };
  res.render('main_page.jade', data);
});

// router.post('/', function(req, res, next) {
//   res.render('main_page.jade', {});
// });

module.exports = router;

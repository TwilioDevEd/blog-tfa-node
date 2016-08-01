var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');
var config = require('./config');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use('/static', express.static(path.join(__dirname, 'public')));
app.use(session({
  secret: config.secret,
  resave: true,
  saveUninitialized: true
}));

app.use('/', require('./routes/main-page-route'));
app.use('/enable-tfa-via-app/', require('./routes/enable-tfa-via-app-route'));
app.use('/enable-tfa-via-sms/', require('./routes/enable-tfa-via-sms-route'));
app.use('/logout/', require('./routes/logout-route'));
app.use('/sign-up/', require('./routes/sign-up-route'));
app.use('/user/', require('./routes/user-route'));
app.use('/verify-tfa/', require('./routes/verify-tfa-route'));
app.use('/auth-qr-code.png/', require('./routes/auth-qr-code-png-route'));

// catch 404 and forward to error handler
app.use((req, res, next) => {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use((err, req, res, next) => {
    console.log(err);
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use((err, req, res, next) => {
  console.log(err);
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});

module.exports = app;

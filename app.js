var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

const RateLimit = require("express-rate-limit");
const maxArticles = 20
const maxComments = 40


require("dotenv").config()


const mongoose = require("mongoose");
// const Schema = mongoose.Schema;
const mongoDb = process.env.MONGODB_URI;
mongoose.connect(mongoDb, { useUnifiedTopology: true, useNewUrlParser: true });






var indexRouter = require('./routes/index');
// var usersRouter = require('./routes/users');
var apiv1Router = require('./routes/apiv1');

var app = express();
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

const jwtsecret = process.env.JWT_SECRET || "blowhard's_secret"

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

const limiter = RateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 20,
});
// Apply rate limiter to all requests
app.use(limiter);
app.use('/', indexRouter);
// app.use('/users', usersRouter);
app.use("/api/v1/", apiv1Router)

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;

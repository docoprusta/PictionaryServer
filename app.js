var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var logger = require('morgan');

var users = require('./routes/users');
var words = require('./routes/words');

var db = require('./model/db');
var userModel = require('./model/users');
var wordModel = require('./model/words');

var app = express();

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser())

app.use('/users', users);
app.use('/words', words);

module.exports = app;

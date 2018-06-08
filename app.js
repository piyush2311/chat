var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var mongoose = require('mongoose');
var config = require('./config/config.' + process.env.NODE_ENV + '.json');

// database connection
mongoose.connect("mongodb://" + config.db.username + ":" + config.db.password + "@" + config.db.host + ":" + config.db.port + "/" + config.db.name + '?authSource=admin', function (err, res){
    if (err) {
      console.log("ERROR in connecting to database");
      process.exit(90);
    }
    console.log("database connected at " + config.db.host + ":" + config.db.port);
});

mongoose.Promise = require('bluebird');

var app = express();
var server = require('./server')(app);
var ioServer = require('./socket')(server);

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));



// load route
require('./controllers/chat')(app);

app.get('/*', function(req, res) {
    res.render('index', { title: 'Express' });
});

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


server.listen(process.env.PORT || config.serverPort);

module.exports = app;


var express = require('express');
var glob = require('glob');

var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var compress = require('compression');
var methodOverride = require('method-override');
var exphbs = require('express-handlebars');
var util = require('util');
var oauthServer = require('oauth2-server');

module.exports = function(app, config) {
  var memoryStore = require(config.root + '/app/oauth/memoryStore');
  //  var MemoryStore = require(config.root + '/app/oauth/memoryStore_v0');
  var env = process.env.NODE_ENV || 'development';
  app.locals.ENV = env;
  app.locals.ENV_DEVELOPMENT = env == 'development';

  app.engine('handlebars', exphbs({
    layoutsDir: config.root + '/app/views/layouts/',
    defaultLayout: 'main',
    partialsDir: [config.root + '/app/views/partials/']
  }));
  app.set('views', config.root + '/app/views');
  app.set('view engine', 'handlebars');

  // app.use(favicon(config.root + '/public/img/favicon.ico'));
  app.use(logger('dev'));
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({
    extended: true
  }));
  app.use(cookieParser());
  app.use(compress());
  app.use(express.static(config.root + '/public'));
  app.use(methodOverride());

  //  var store = memoryStore;
  app.oauth = oauthServer({
    model: memoryStore,
    debug: true,
    grants: ['authorization_code']
  });

  memoryStore.dump();

  // Post token.
  app.all('/oauth/token', app.oauth.grant());

  // Get authorization.
  app.get('/oauth/authorize', function(req, res) {
    // Redirect anonymous users to login page.
    if (!req.app.locals.user) {
      return res.redirect(util.format('/login?redirect=%s&client_id=%s&redirect_uri=%s', req.path, req.query.client_id,
        req.query.redirect_uri));
    }

    return res.render('authorize', {
      client_id: req.query.client_id,
      redirect_uri: req.query.redirect_uri
    });
  });

  // Post authorization.
  app.post('/oauth/authorize', function(req, res, next) {
    // Redirect anonymous users to login page.
    if (!req.app.locals.user) {
      return res.redirect(util.format('/login?client_id=%s&redirect_uri=%s', req.query.client_id, req.query.redirect_uri));
    }
    next();
  }, app.oauth.authCodeGrant(function(req, next) {
    // The first param should to indicate an error
    // The second param should a bool to indicate if the user did authorise the app
    // The third param should for the user/uid (only used for passing to saveAuthCode)
    memoryStore.dump();
    next(null, req.body.allow === 'yes', req.app.locals.user.id, req.app.locals.user);
  }));

  // Get login.
  // Cf login Ctrl

  // Post login.
  app.post('/login', function(req, res) {
    // @TODO: Insert your own login mechanism.

    memoryStore.getUser(req.body.username, req.body.password, function(err, user) {
      if (err) {
        return res.status(500).end();
      }

      console.log('USER:', user);

      if (!user) {
        return res.render('login', {
          redirect: req.body.redirect,
          client_id: req.body.client_id,
          redirect_uri: req.body.redirect_uri
        });
      }

      res.app.locals.user = user;

      // Successful logins should send the user back to /oauth/authorize.
      var path = req.body.redirect || '/';

      return res.redirect(util.format('/%s?client_id=%s&redirect_uri=%s', path, req.body.client_id, req.body.redirect_uri));
    });
  });

  app.get('/secret', app.oauth.authorise(), function(req, res) {
    // Will require a valid access_token
    res.send('Secret area');
  });

  var controllers = glob.sync(config.root + '/app/controllers/*.js');

  controllers.forEach(function(controller) {
    require(controller)(app);
  });

  app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
  });

  if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
      res.status(err.status || 500);
      res.render('error', {
        message: err.message,
        error: err,
        title: 'error'
      });
    });
  }

  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: {},
      title: 'error'
    });
  });

};

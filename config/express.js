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
var uuid = require('uuid');
var pg = require('pg')
  , session = require('express-session')
  , pgSession = require('connect-pg-simple')(session);

module.exports = function(app, config) {
  //  var store = require(config.root + '/app/oauth/memoryStore');
  var store = require(config.root + '/app/oauth/postgresStore');
  var saml = require(config.root + '/app/strategy/samlStrategy');
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

  app.use(session({
    genid: function() {
      return uuid.v4(); // use UUIDs for session IDs
    },
    store: new pgSession({
      pg: pg, // Use global pg-module
      conString: process.env.DATABASE_URL_OAUTH || 'postgres://lvlearningdev:lvlearningdev2016!@localhost/oneprofilepoc',
      // Connect using something else than default DATABASE_URL env variable
      tableName: 'session' // Use another table-name than the default "session" one
    }),
    secret: 'oneprofilesecret',
    resave: true,
    saveUninitialized: false
  }));

  //  var store = memoryStore;
  app.oauth = oauthServer({
    model: store,
    debug: true,
    grants: ['authorization_code'],
    authCodeLifetime: 31536000,
    accessTokenLifetime: 31536000
  });

  var samlURL = '';

  // Post token.
  app.all('/oauth/token', app.oauth.grant());

  // Get authorization.
  app.get('/oauth/authorize', function(req, res, next) {
    // Redirect anonymous users to login page.
    if (!req.session.user) {
      saml.getSamlRequest(req, function(err, samlRequest) {
        req.session.clientId = req.query.client_id;
        req.session.redirectUri = req.query.redirect_uri;
        return res.redirect(samlRequest);
      });
    }

    //@TODO: Vérifier si le user à déja authorisé l'application est que le code n'est pas expiré.
    store.getAuthCodeByUserAndClient(req.query.client_id, req.session.user.id, function(err, result) {
      if (err) return next(err);
      if (result) {
        return res.redirect(req.query.redirect_uri + '?code=' + result.code);
      }
      return res.render('authorize', {
        client_id: req.query.client_id,
        redirect_uri: req.query.redirect_uri
      });
    });
  });

  // Post authorization.
  app.post('/oauth/authorize', function(req, res, next) {
    // Redirect anonymous users to login page.
    if (!req.session.user) {
      return res.redirect(util.format('/login?client_id=%s&redirect_uri=%s', req.body.client_id, req.body.redirect_uri));
    }
    next();
  }, app.oauth.authCodeGrant(function(req, next) {
    // The first param should to indicate an error
    // The second param should a bool to indicate if the user did authorise the app
    // The third param should for the user/uid (only used for passing to saveAuthCode)
    next(null, req.body.allow === 'yes', req.session.user.id, req.session.user);
  }));

  // Get login.
  // Cf login Ctrl

  // Post login.
  app.post('/api/auth/login/callback', function(req, res) {
    // @TODO: Insert your own login mechanism.

    //    store.getUser(req.body.username, req.body.password, function(err, user) {

    console.log(req.body);

    if (req.body && req.body.SAMLResponse) {
      saml.validateSAMLResponse(req.body, function(err, profile, logout) {
        if (err) return res.status(500).send('ERROR !!!');
        if (!profile) {
          return res.render('login', {
            redirect: req.body.redirect || '/oauth/authorize',
            client_id: req.body.client_id,
            redirect_uri: req.body.redirect_uri
          });
        }

        req.session.user = profile;

        if (req.session.clientId) {
          console.log(req.session.clientId);
          console.log(req.session.redirectUri);

          // Successful logins should send the user back to /oauth/authorize.
          var path = '/oauth/authorize';

          return res.redirect(util.format('/%s?client_id=%s&redirect_uri=%s', path, req.session.clientId, req.session.redirectUri));
        }


      });
    }

    return res.redirect('/');
  });
  //  });


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

  // Error handling
  app.use(app.oauth.errorHandler());

};

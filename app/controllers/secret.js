/**
 * Created by Paul-Guillaume Déjardin on 13/04/16.
 * Copyright © 2016 Xebia IT Architects. All rights reserved.
 */

var express = require('express'),
  router = express.Router();

module.exports = function(app) {
  app.use('/secret', app.oauth.authorise(), router);
};

router.get('/', function(req, res, next) {
  res.render('index', {
    title: 'Generator-Express MVC Secret Area',
    secret: true
  });
});

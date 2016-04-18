/**
 * Created by Paul-Guillaume Déjardin on 13/04/16.
 * Copyright © 2016 Xebia IT Architects. All rights reserved.
 */

var express = require('express'),
  router = express.Router();

module.exports = function(app) {
  app.use('/login', router);
};

router.get('/', function(req, res, next) {
  res.render('login', {
    title: 'Login',
    redirect: req.query.redirect,
    client_id: req.query.client_id,
    redirect_uri: req.query.redirect_uri
  });
});

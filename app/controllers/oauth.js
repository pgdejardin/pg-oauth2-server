/**
 * Created by Paul-Guillaume Déjardin on 14/04/16.
 * Copyright © 2016 Xebia IT Architects. All rights reserved.
 */

var express = require('express'),
  router = express.Router(),
  request = require('request');

module.exports = function(app) {
  app.use('/oauth', router);
};

router.get('/callback', function(req, res, next) {
  var code = req.query.code;
  if (code) {
    request({
      method: 'POST',
      uri: 'http://localhost:3000/oauth/token?client_id=123&client_secret=123',
      form: {
        client_id: 123,
        client_secret: 123,
        code: code,
        grant_type: 'authorization_code'
      }
    }, function(err, response) {
      res.set({
        Authorization: 'Bearer ' + JSON.parse(response.body).access_token
      });
      return res.redirect('/secret?access_token=' + JSON.parse(response.body).access_token);
    });
  } else {
    res.redirect('/');
  }
});

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
        grant_type: 'authorization_code',
        redirect_uri: 'http://localhost:3000/secret'
      }
    }, function(err, response) {
      if (err) {
        res.set('Content-Type', 'text/html');
        return res.send(response.body);
      }

      console.log(response.statusCode);

      if (response.statusCode !== 200) {
        res.set('Content-Type', 'text/html');
        return res.send(response.body);
      }

      var body = JSON.parse(response.body).access_token;

//      res.set({
//        Authorization: 'Bearer ' + body
//      });
      return res.redirect('/secret?access_token=' + body);
    });
  } else {
    res.redirect('/');
  }
});

/**
  * Created by Paul-Guillaume Déjardin on 15/04/16.
  * Copyright © 2016 Xebia IT Architects. All rights reserved.
  */

var express = require('express'),
  router = express.Router(),
  postgresStore = require('../oauth/postgresStore');

module.exports = function (app) {
  app.use('/users', app.oauth.authorise(), router);
};

router.get('/',  function (req, res) {
  postgresStore.getUserByToken(req.query.access_token, function(err, result) {
    if (err) res.status(500).end();
    if (result) {
     return res.send(result)
    }
    return res.status(404).end();
  });
});

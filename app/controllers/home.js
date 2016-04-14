var express = require('express'),
  router = express.Router(),
  request = require('request'),
  db = require('../models');

module.exports = function (app) {
  app.use('/', router);
};

router.get('/', function (req, res, next) {
  db.Article.findAll().then(function (articles) {
    res.render('index', {
      title: 'Generator-Express MVC',
      articles: articles
    });
  });
});

router.get('oauth/callback', function(req, res, next) {
  var code = req.query.code;
  console.log(code)
  if (code) {
    request.post('/oauth/token?client_id=123&client_secret=123', function(err, response) {
      res.redirect('/?access_token=' + response.access_token);
    });
  }
  return res.redirect('/');
});

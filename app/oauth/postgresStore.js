/**
 * Created by Paul-Guillaume Déjardin on 14/04/16.
 * Copyright © 2016 Xebia IT Architects. All rights reserved.
 */

var pg = require('pg'),
  knex = require('knex')({
    client: 'pg',
    debug: true,
    connection: {
      host: process.env.POSTGRESQL_HOSTNAME || '127.0.0.1',
      port: process.env.POSTGRESQL_PORT || 5432,
      user: process.env.POSTGRESQL_USERNAME,
      password: process.env.POSTGRESQL_PASSWORD,
      database: process.env.POSTGRESQL_DATABASE_OAUTH
    }
  }),
  model = module.exports,
  connString = process.env.DATABASE_URL_OAUTH;


/*
 * Required
 */

model.getAccessToken = function(bearerToken, callback) {
  pg.connect(connString, function(err, client, done) {
    if (err) return callback(err);
    client.query('SELECT access_token, client_id, expires, user_id FROM oauth_access_tokens ' +
      'WHERE access_token = $1', [bearerToken], function(err, result) {
      if (err || !result.rowCount) return callback(err);
      // This object will be exposed in req.oauth.token
      // The user_id field will be exposed in req.user (req.user = { id: "..." }) however if
      // an explicit user object is included (token.user, must include id) it will be exposed
      // in req.user instead
      var token = result.rows[0];
      callback(null, {
        accessToken: token.access_token,
        clientId: token.client_id,
        expires: token.expires,
        userId: token.userId
      });
      done();
    });
  });
};

model.getClient = function(clientId, clientSecret, callback) {
  pg.connect(connString, function(err, client, done) {
    if (err) return callback(err);

    client.query('SELECT client_id, client_secret, redirect_uri FROM oauth_clients WHERE ' +
      'client_id = $1', [clientId], function(err, result) {
      if (err || !result.rowCount) return callback(err);

      var client = result.rows[0];

      //TODO: A voir comment gérer ca
      //      if (clientSecret !== null && client.client_secret !== clientSecret) return callback();

      // This object will be exposed in req.oauth.client
      callback(null, {
        clientId: client.client_id,
        clientSecret: client.client_secret,
        redirectUri: client.redirect_uri
      });
      done();
    });
  });
};

model.getRefreshToken = function(bearerToken, callback) {
  pg.connect(connString, function(err, client, done) {
    if (err) return callback(err);
    client.query('SELECT refresh_token, client_id, expires, user_id FROM oauth_refresh_tokens ' +
      'WHERE refresh_token = $1', [bearerToken], function(err, result) {
      // The returned user_id will be exposed in req.user.id
      callback(err, result.rowCount ? result.rows[0] : false);
      done();
    });
  });
};

model.grantTypeAllowed = function(clientId, grantType, callback) {
  pg.connect(connString, function(err, client, done) {
    if (err) return callback(err);
    client.query('SELECT oauth.client_id, grant_type.grant_type ' +
      'FROM oauth_authorization_type oauth ' +
      'INNER JOIN grant_type ON oauth.grant_type = grant_type.id ' +
      'WHERE oauth.client_id = $1 AND grant_type.grant_type = $2',
      [clientId, grantType],
      function(err, result) {
        if (err || !result.rowCount) return callback(err, false);
        callback(null, true);
        done();
      });
  });

};

model.saveAccessToken = function(accessToken, clientId, expires, user, callback) {
  findAccessTokenByUserId(clientId, user.id)
    .asCallback(function(err, rows) {
      if (err) return callback(err);
      if (rows && rows.length > 0) {
        knex('oauth_access_tokens')
          .where('client_id', '=', clientId)
          .andWhere('user_id', '=', user.id)
          .update({
            access_token: accessToken,
            expires: expires
          })
          .asCallback(function(err) {
            if (err) return callback(err);
            return callback(null);
          });
      } else {
        knex('oauth_access_tokens')
          .insert({
            access_token: accessToken,
            client_id: clientId,
            user_id: user.id,
            expires: expires
          })
          .asCallback(function(err) {
            if (err) return callback(err);
            return callback(null);
          });
      }
    });
};

model.saveRefreshToken = function(refreshToken, clientId, expires, userId, callback) {
  pg.connect(connString, function(err, client, done) {
    if (err) return callback(err);
    client.query('INSERT INTO oauth_refresh_tokens(refresh_token, client_id, user_id, ' +
      'expires) VALUES ($1, $2, $3, $4)', [refreshToken, clientId, userId, expires],
      function(err) {
        callback(err);
        done();
      });
  });
};

/*
 * Required to support authorization grant type
 */
model.getUser = function(username, password, callback) {
  pg.connect(connString, function(err, client, done) {
    if (err) return callback(err);
    client.query('SELECT id FROM users WHERE username = $1 AND password = $2', [username,
      password], function(err, result) {
      callback(err, result.rowCount ? result.rows[0] : false);
      done();
    });
  });
};

model.saveAuthCode = function(authCode, clientId, expires, user, callback) {
  findAuthCodeByUserId(clientId, user)
    .asCallback(function(err, rows) {
      if (err) return callback(err);
      if (rows && rows.length > 0) {
        knex('oauth_authorization_codes')
          .where('client_id', '=', clientId)
          .andWhere('user_id', '=', user)
          .update({
            code: authCode,
            expires: expires
          })
          .asCallback(function(err) {
            if (err) return callback(err);
            return callback(null);
          })
      } else {
        knex('oauth_authorization_codes')
          .insert({
            code: authCode,
            client_id: clientId,
            user_id: user,
            expires: expires
          })
          .asCallback(function(err) {
            if (err) return callback(err);
            return callback(null);
          });
      }
    });
};

model.getAuthCode = function(bearerCode, callback) {
  pg.connect(connString, function(err, client, done) {
    if (err) return callback(err);
    client.query('SELECT code, client_id, expires, user_id FROM oauth_authorization_codes ' +
      'WHERE code = $1', [bearerCode], function(err, result) {
      if (err || !result.rowCount) return callback(err);
      // This object will be exposed in req.oauth.token
      // The user_id field will be exposed in req.user (req.user = { id: "..." }) however if
      // an explicit user object is included (token.user, must include id) it will be exposed
      // in req.user instead
      var code = result.rows[0];
      callback(null, {
        accessToken: code.code,
        clientId: code.client_id,
        expires: code.expires,
        userId: code.user_id
      });
      done();
    });
  });
};

model.getUserByToken = function(accessToken, callback) {
  knex.select('users.username', 'users.id')
    .from('users')
    .innerJoin('oauth_access_tokens', 'users.id', 'oauth_access_tokens.user_id')
    .where('access_token', '=', accessToken)
    .asCallback(function(err, rows) {
      if (err) return callback(err);
      if (rows && rows.length > 0) {
        return callback(null, rows[0]);
      }
      callback(null, {});
    });
};

model.getAuthCodeByUserAndClient = function(clientId, userId, callback) {
  knex.select('*')
    .from('oauth_authorization_codes')
    .where('client_id', '=', clientId)
    .andWhere('user_id', '=', userId)
    .asCallback(function(err, rows) {
      if (err) return callback(err);
      console.log(rows);
      if (rows && rows.length > 0) {
        return callback(null, rows[0]);
      }
      callback(null, null);
    })
};

var findAuthCodeByUserId = function(clientId, userId) {
  return knex('oauth_authorization_codes')
    .where('client_id', '=', clientId)
    .andWhere('user_id', '=', userId);
};

var findAccessTokenByUserId = function(clientId, userId) {
  return knex('oauth_access_tokens')
    .where('client_id', '=', clientId)
    .andWhere('user_id', '=', userId);
};

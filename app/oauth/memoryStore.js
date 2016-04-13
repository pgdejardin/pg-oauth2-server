/**
 * Created by Paul-Guillaume Déjardin on 13/04/16.
 * Copyright © 2016 Xebia IT Architects. All rights reserved.
 */

var crypto = require('crypto');
var randomBytes = require('bluebird').promisify(require('crypto').randomBytes);

/**
 * Constructor.
 */
var self;

function InMemoryCache() {
  this.clients = [{ clientId: '123', clientSecret: '123', redirectUris: ['http://localhost:3000'], grants: ['authorization_code'] }];
  this.tokens = [];
  this.users = [{ id: '123', username: 'test', password: '123' }];
  self = this;
}

/**
 * Dump the cache.
 */

InMemoryCache.prototype.dump = function() {
  console.log('clients', this.clients);
  console.log('tokens', this.tokens);
  console.log('users', this.users);
};

/*
 * Get access token.
 */

InMemoryCache.prototype.getAccessToken = function(bearerToken) {
  var tokens = this.tokens.filter(function(token) {
    return token.accessToken === bearerToken;
  });

  return tokens.length ? tokens[0] : false;
};

/**
 * Get refresh token.
 */

InMemoryCache.prototype.getRefreshToken = function(bearerToken) {
  var tokens = this.tokens.filter(function(token) {
    return token.refreshToken === bearerToken;
  });

  return tokens.length ? tokens[0] : false;
};

/**
 * Get client.
 */

InMemoryCache.prototype.getClient = function(clientId, clientSecret) {
  //  console.log('Clients:', this.clients);
  //  console.log('Clients FROM SELF:', self.clients);
  var clients = self.clients.filter(function(client) {
    return client.clientId === clientId && client.clientSecret === clientSecret || client.clientId === clientId;
  });

  return clients.length ? clients[0] : false;
};

/**
 * Save token.
 */

InMemoryCache.prototype.saveToken = function(token, client, user) {
  this.tokens.push({
    accessToken: token.accessToken,
    accessTokenExpiresAt: token.accessTokenExpiresAt,
    clientId: client.clientId,
    refreshToken: token.refreshToken,
    refreshTokenExpiresAt: token.refreshTokenExpiresAt,
    userId: user.id
  });
};

/*
 * Get user.
 */

InMemoryCache.prototype.getUser = function(username, password) {
  var users = this.users.filter(function(user) {
    return user.username === username && user.password === password;
  });

  return users.length ? users[0] : false;
};

InMemoryCache.prototype.generateAuthorizationCode = function() {
  return randomBytes(256).then(function(buffer) {
    return crypto
      .createHash('sha1')
      .update(buffer)
      .digest('hex');
  });
};

InMemoryCache.prototype.saveAuthorizationCode = function() {
  return { authorizationCode: this.generateAuthorizationCode() };
};

/**
 * Export constructor.
 */

module.exports = InMemoryCache;

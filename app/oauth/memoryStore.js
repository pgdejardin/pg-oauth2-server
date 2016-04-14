var model = module.exports;

// In-memory datastores:
var oauthAccessTokens = [],
  oauthRefreshTokens = [],
  oauthClients = [
    {
      clientId: '123',
      clientSecret: '123',
      redirectUri: 'http://localhost:3000/oauth/callback',
      grants: ['authorization_code'],
      grant_type: 'authorization_code'
    }
  ],
  authorizedClientIds = {
    password: [
      'thom'
    ],
    refresh_token: [
      'thom'
    ],
    authorization_code: [
      '123'
    ]
  },
  users = [
    {
      id: '123',
      username: '123',
      password: '123'
    }
  ],
  oauthAuthCode = [];

// Debug function to dump the state of the data stores
model.dump = function() {
  console.log('oauthAccessTokens', oauthAccessTokens);
  console.log('oauthClients', oauthClients);
  console.log('authorizedClientIds', authorizedClientIds);
  console.log('oauthRefreshTokens', oauthRefreshTokens);
  console.log('oauthAuthCode', oauthAuthCode);
  console.log('users', users);
};

/*
 * Required
 */

model.getAccessToken = function(bearerToken, callback) {
  for (var i = 0, len = oauthAccessTokens.length; i < len; i++) {
    var elem = oauthAccessTokens[i];
    if (elem.accessToken === bearerToken) {
      return callback(false, elem);
    }
  }
  callback(false, false);
};

model.getRefreshToken = function(bearerToken, callback) {
  for (var i = 0, len = oauthRefreshTokens.length; i < len; i++) {
    var elem = oauthRefreshTokens[i];
    if (elem.refreshToken === bearerToken) {
      return callback(false, elem);
    }
  }
  callback(false, false);
};

model.getClient = function(clientId, clientSecret, callback) {
  for (var i = 0, len = oauthClients.length; i < len; i++) {
    var elem = oauthClients[i];
    if (elem.clientId === clientId &&
      (clientSecret === null || elem.clientSecret === clientSecret)) {
      return callback(false, elem);
    }
  }
  callback(false, false);
};

model.grantTypeAllowed = function(clientId, grantType, callback) {
  callback(false, authorizedClientIds[grantType] &&
    authorizedClientIds[grantType].indexOf(clientId.toLowerCase()) >= 0);
};

model.saveAccessToken = function(accessToken, clientId, expires, userId, callback) {
  oauthAccessTokens.unshift({
    accessToken: accessToken,
    clientId: clientId,
    userId: userId,
    expires: expires
  });

  callback(false);
};

model.saveRefreshToken = function(refreshToken, clientId, expires, userId, callback) {
  oauthRefreshTokens.unshift({
    refreshToken: refreshToken,
    clientId: clientId,
    userId: userId,
    expires: expires
  });

  callback(false);
};

/*
 * Required to support password grant type
 */
model.getUser = function(username, password, callback) {
  var usersResult = users.filter(function(user) {
    return user.username === username && user.password === password;
  });

  return usersResult.length ? callback(false, usersResult[0]) : callback(false, false);
};

model.saveAuthCode = function(authCode, clientId, expires, user, callback) {
  oauthAuthCode.unshift({
    authCode: authCode,
    clientId: clientId,
    expires: expires,
    userId: user
  });

  callback(false, false);
};

model.getAuthCode = function(bearerCode, callback) {
  var authCodes = oauthAuthCode.filter(function(authCode) {
    return authCode.authCode === bearerCode;
  });

  return authCodes.length ? callback(false, authCodes[0]) : callback(false, false);
};

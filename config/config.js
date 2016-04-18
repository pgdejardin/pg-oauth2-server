var path = require('path'),
    rootPath = path.normalize(__dirname + '/..'),
    env = process.env.NODE_ENV || 'development';

var config = {
  development: {
    root: rootPath,
    app: {
      name: 'simple-node-express'
    },
    port: process.env.PORT || 3000,
//    db: 'postgres://localhost/simple-node-express-development'
    db: process.env.DATABASE_URL_OAUTH || 'postgres://localhost/oneprofilepoc'
  },

  test: {
    root: rootPath,
    app: {
      name: 'simple-node-express'
    },
    port: process.env.PORT || 3000,
    db: process.env.DATABASE_URL_OAUTH|| 'postgres://localhost/simple-node-express-test'
  },

  production: {
    root: rootPath,
    app: {
      name: 'simple-node-express'
    },
    port: process.env.PORT || 3000,
    db: process.env.DATABASE_URL_OAUTH|| 'postgres://localhost/simple-node-express-production'
  }
};

module.exports = config[env];

"use strict";

var SAML = require('passport-saml').SAML;
var fs = require('fs');
var config = require('../../conf/config.js');

var saml = {
  certificate: process.env.SAML_CERTIFICATE,
  entryPoint: process.env.SAML_ENTRY_POINT || 'https://fed-prp.vuitton.biz/adfs/ls/',
  entryId: process.env.SAML_ENTRY_ID || 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress',
  givenName: process.env.SAML_GIVEN_NAME || 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname',
  surName: process.env.SAML_SURNAME || 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/surname',
  logoutUrl: process.env.SAML_LOGOUT_URL || 'https://fed-prp.vuitton.biz/adfs/ls/PartialLogout/Lv-Live.aspx'
};

const samlConfig = {
   entryPoint: saml.entryPoint,
   issuer: 'LV-LIVE',
   callbackUrl: 'https://lv-cas.herokuapp.com/api/auth/login/callback',
   cert: saml.certificate,
   privateCert: fs.readFileSync(__dirname + '/../../certs/saml/saml.pem', 'utf-8'),
   decryptionPvk: fs.readFileSync(__dirname + '/../../certs/saml/saml.pem', 'utf-8'),
   identifierFormat: null
};

var getSamlRequest = function(req, callback) {
    var saml = new SAML(samlConfig);
    saml.getAuthorizeUrl(req, callback);
};

////////////////////////////////////////////////////////////////////////////////////
// Exports
////////////////////////////////////////////////////////////////////////////////////

module.exports = {
    getSamlRequest: getSamlRequest
};
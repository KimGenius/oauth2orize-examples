'use strict';

const oauth2orize = require('oauth2orize');
const passport = require('passport');
const login = require('connect-ensure-login');
const db = require('../db');
const utils = require('../utils');

// Create OAuth 2.0 server
const server = oauth2orize.createServer();

// Register serialialization and deserialization functions.
//
// When a client redirects a user to user authorization endpoint, an
// authorization transaction is initiated. To complete the transaction, the
// user must authenticate and approve the authorization request. Because this
// may involve multiple HTTP request/response exchanges, the transaction is
// stored in the session.
//
// An application must supply serialization functions, which determine how the
// client object is serialized into the session. Typically this will be a
// simple matter of serializing the client's ID, and deserializing by finding
// the client by ID from the database.

server.serializeClient((client, done) => done(null, client.id));

server.deserializeClient((id, done) => {
  db.clients.findById(id, (error, client) => {
    if (error) return done(error);
    return done(null, client);
  });
});

// Register supported grant types.
//
// OAuth 2.0 specifies a framework that allows users to grant client
// applications limited access to their protected resources. It does this
// through a process of the user granting access, and the client exchanging
// the grant for an access token.

// Grant authorization codes. The callback takes the `client` requesting
// authorization, the `redirectUri` (which is used as a verifier in the
// subsequent exchange), the authenticated `user` granting access, and
// their response, which contains approved scope, duration, etc. as parsed by
// the application. The application issues a code, which is bound to these
// values, and will be exchanged for an access token.

server.grant(oauth2orize.grant.code((client, redirectUri, user, ares, done) => {
  console.log('grant code')
  const code = utils.getUid(16);
  db.authorizationCodes.save(code, client.id, redirectUri, user.id, (error) => {
    if (error) return done(error);
    return done(null, code);
  });
}));

// Grant implicit authorization. The callback takes the `client` requesting
// authorization, the authenticated `user` granting access, and
// their response, which contains approved scope, duration, etc. as parsed by
// the application. The application issues a token, which is bound to these
// values.

server.grant(oauth2orize.grant.token((client, user, ares, done) => {
  console.log('grant token')
  const token = utils.getUid(256);
  db.accessTokens.save(token, user.id, client.clientId, (error) => {
    if (error) return done(error);
    return done(null, token);
  });
}));

// Exchange authorization codes for access tokens. The callback accepts the
// `client`, which is exchanging `code` and any `redirectUri` from the
// authorization request for verification. If these values are validated, the
// application issues an access token on behalf of the user who authorized the
// code.

server.exchange(oauth2orize.exchange.code((client, code, redirectUri, done) => {
  console.log('exchange code')
  db.authorizationCodes.find(code, (error, authCode) => {
    if (error) return done(error);
    if (client.id !== authCode.clientId) return done(null, false);
    if (redirectUri !== authCode.redirectUri) return done(null, false);
    const token = utils.getUid(256);
    db.accessTokens.save(token, authCode.userId, authCode.clientId, (error) => {
      if (error) return done(error);
      return done(null, token);
    });
  });
}));

// Exchange user id and password for access tokens. The callback accepts the
// `client`, which is exchanging the user's name and password from the
// authorization request for verification. If these values are validated, the
// application issues an access token on behalf of the user who authorized the code.

server.exchange(oauth2orize.exchange.password((client, username, password, scope, done) => {
  console.log('exchange password')
// Validate the client
  db.clients.findByClientId(client.clientId, (error, localClient) => {
    if (error) return done(error);
    if (!localClient) return done(null, false);
    if (localClient.clientSecret !== client.clientSecret) return done(null, false);
    // Validate the user
    db.users.findByUsername(username, (error, user) => {
      if (error) return done(error);
      if (!user) return done(null, false);
      if (password !== user.password) return done(null, false);
      // Everything validated, return the token
      const token = utils.getUid(256);
      db.accessTokens.save(token, user.id, client.clientId, (error) => {
        if (error) return done(error);
        return done(null, token);
      });
    });
  });
}));

// Exchange the client id and password/secret for an access token. The callback accepts the
// `client`, which is exchanging the client's id and password/secret from the
// authorization request for verification. If these values are validated, the
// application issues an access token on behalf of the client who authorized the code.

server.exchange(oauth2orize.exchange.clientCredentials((client, scope, done) => {
  console.log('exchange clientCredentials')
// Validate the client
  db.clients.findByClientId(client.clientId, (error, localClient) => {
    if (error) return done(error);
    if (!localClient) return done(null, false);
    if (localClient.clientSecret !== client.clientSecret) return done(null, false);
    // Everything validated, return the token
    const token = utils.getUid(256);
    // Pass in a null for user id since there is no user with this grant type
    db.accessTokens.save(token, null, client.clientId, (error) => {
      if (error) return done(error);
      return done(null, token);
    });
  });
}));

// User authorization endpoint.
//
// `authorization` middleware accepts a `validate` callback which is
// responsible for validating the client making the authorization request. In
// doing so, is recommended that the `redirectUri` be checked against a
// registered value, although security requirements may vary accross
// implementations. Once validated, the `done` callback must be invoked with
// a `client` instance, as well as the `redirectUri` to which the user will be
// redirected after an authorization decision is obtained.
//
// This middleware simply initializes a new authorization transaction. It is
// the application's responsibility to authenticate the user and render a dialog
// to obtain their approval (displaying details about the client requesting
// authorization). We accomplish that here by routing through `ensureLoggedIn()`
// first, and rendering the `dialog` view.

module.exports.authorization = [
  // 로그인 체크 : 로그인이 안되있으면 로그인 페이지로 가는듯
  login.ensureLoggedIn(),
  server.authorization((clientId, redirectUri, done) => {
    // DB에 가져온 ClientId가 있는지 체크
    db.clients.findByClientId(clientId, (error, client) => {
      console.log('findByClientId!!!')
      if (error) return done(error);
      // WARNING: For security purposes, it is highly advisable to check that
      //          redirectUri provided by the client matches one registered with
      //          the server. For simplicity, this example does not. You have
      //          been warned.
      // WARNING: 번역: 보안을 위해서 클라이언트가 제공한 redirectUri가 서버에 등록된 것과
      //               일치하는지 체크하는 것이 좋다. 단순화를 위해서는 안그래도 되지만 보안 위험
      return done(null, client, redirectUri);
    });
  }, (client, user, done) => {
    // Check if grant request qualifies for immediate approval
    
    // Auto-approve
    console.log('auto? not auto?')
    if (client.isTrusted) {
      console.log('this is auto!')
      return done(null, true);
    }

    console.log('this is not auto!')
    db.accessTokens.findByUserIdAndClientId(user.id, client.clientId, (error, token) => {
      // Auto-approve
      console.log(token)
      if (token) return done(null, true);
      
      // Otherwise ask user
      return done(null, false);
    });
  }),
  (request, response) => {
    console.log('this way~')
    response.render('dialog', {
      transactionId: request.oauth2.transactionID,
      user: request.user,
      client: request.oauth2.client
    });
  },
];

// User decision endpoint.
//
// `decision` middleware processes a user's decision to allow or deny access
// requested by a client application. Based on the grant type requested by the
// client, the above grant middleware configured above will be invoked to send
// a response.

exports.decision = [
  login.ensureLoggedIn(),
  server.decision(),
];


// Token endpoint.
//
// `token` middleware handles client requests to exchange authorization grants
// for access tokens. Based on the grant type being exchanged, the above
// exchange middleware will be invoked to handle the request. Clients must
// authenticate when making requests to this endpoint.

exports.token = [
  passport.authenticate(['basic', 'oauth2-client-password'], { session: false }),
  () => {
    console.log('passport -> token')
  },
  server.token(),
  server.errorHandler(),
];

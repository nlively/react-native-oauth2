import Dispatcher from './Dispatcher';
import OAuth2Token from './OAuth2Token';
import OAuth2API from './OAuth2API';

import Q from 'q';
import {EventEmitter} from 'events';
import assign from 'object-assign';

const VALID_TOKEN_EVENT = 'valid_token_event';
const NO_VALID_TOKEN_EVENT = 'no_valid_token_event';

var _token = new OAuth2Token();
var deferredRequestPool = [];


var OAuth2SessionStore = assign({}, EventEmitter.prototype, {

  emitValidToken: function (token) {
    this.emit(VALID_TOKEN_EVENT, token);
  },

  addValidTokenListener: function (callback) {
    this.on(VALID_TOKEN_EVENT, callback);
  },

  removeValidTokenListener: function (callback) {
    this.removeListener(VALID_TOKEN_EVENT, callback);
  },


  emitNoValidToken: function () {
    this.emit(NO_VALID_TOKEN_EVENT);
  },
  addNoValidTokenListener: function (callback) {
    this.on(NO_VALID_TOKEN_EVENT, callback);
  },
  removeNoValidTokenListener: function (callback) {
    this.removeListener(NO_VALID_TOKEN_EVENT, callback);
  },

  hasValidAccessToken: function () {
    return (_token && _token.isValid());
  },

  initFromStorage: function (token) {
      // If we have a token, refresh it, as this method is only
      // called when the app is starting up.
      if (token && token.access_token) {
        _token = new OAuth2Token(token);

        // Call out to the API and refresh the access token
        OAuth2API.refreshAccessToken(_token);
      } else {
        // We don't have a valid token...
        SessionStore.emitNoValidToken();
      }
  },

  requestAccessTokenAsync: function () {
    var defer = Q.defer();

    // If an access getToken is not present...
    if (!_token || !_token.isPresent()) {
      // Aaaaahhhh!!! We have to get them to log in in order to proceed.
      OAuth2SessionStore.emitNoValidToken();

      // TODO: should we have this?  We might pushing something into the request pool that doesn't belong
      // defer.reject();
    }
    // If the getToken is present but expired...
    else if (_token.isExpired()) {
      // Call out to the API to get a fresh token
      OAuth2API.refreshAccessToken(_token);
    } else {
      defer.resolve(_token);
    }

    // Add the promise to a pool of deferred requests.
    // One we get a valid token (see VALID_ACCESS_TOKEN below),
    // we will resolve each promise in this pool, which
    // will cause the API requests to be sent to the server
    deferredRequestPool.push(defer);

    return defer.promise;
  },

});

function setToken(token) {
  _token = new OAuth2Token(token);
  return _token;
}

// This pool is populated via calls to OAuth2SessionStore.requestAccessTokenAsync(),
// which is used by the APIHelper to make sure we have a valid token
// before we submit API requests.
function resolveItemsInDeferredRequestPool() {
  while (deferredRequestPool.length > 0) {
    var item = deferredRequestPool.shift();
    item.resolve();
  }
}

// Discards any pending deferred requests.  This is called when a session ends.
function rejectItemsInDeferredRequestPool() {
  while (deferredRequestPool.length > 0) {
    var item = deferredRequestPool.shift();
    item.reject('Session ended');
  }
}

OAuth2SessionStore.dispatchToken = Dispatcher.register(function (payload) {

  switch (payload.actionType) {

    case 'valid_token':
      // Save the token to device storage
      setToken(payload.token);

      // Having received a valid access token, we can now loop through
      // any promises that were waiting for a token and resolve them.
      resolveItemsInDeferredRequestPool();

      // Emit a valid token event
      OAuth2SessionStore.emitValidToken(payload.token);
      break;


    case 'no_valid_token':
      // Wipe out any requests queued in the request pool
      rejectItemsInDeferredRequestPool();

      // Reset the token in memory to an empty instance of the OAuth2Token class
      _token = new OAuth2Token();

      // Signal that the authenticated session has come to an end
      OAuth2SessionStore.emitNoValidToken();
      break;
  }
});


module.exports = OAuth2SessionStore;

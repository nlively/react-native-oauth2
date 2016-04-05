import APIHelper from './lib/APIHelper';
import OAuth2API from './lib/OAuth2API';
import OAuth2Token from './lib/OAuth2Token';
import OAuth2SessionStore from './lib/OAuth2SessionStore';
import Dispatcher from './lib/Dispatcher';

function _onValidToken(callback) {
  OAuth2SessionStore.addValidTokenListener(callback);
}

function _onNoValidToken(callback) {
  OAuth2SessionStore.addNoValidTokenListener(callback);
}

module.exports = {
  OAuth2API: OAuth2API,
  OAuth2Token: OAuth2Token,
  authenticate: (username, password) => {
    OAuth2API.obtainAccessTokenWithCredentials(username, password);
  },
  reset: () => {
    Dispatcher.dispatch({actionType: 'no_valid_token'});
  },
  onValidToken: _onValidToken,
  onNoValidToken: _onNoValidToken,
  initializeConfig: (client_id, client_secret, token_uri) => {
    OAuth2API.init(client_id, client_secret, token_uri);
  },
  initializeSession: (token) => {
    OAuth2SessionStore.initFromStorage(token);
  },
  authenticatedRequest: APIHelper.authenticatedRequest,
};
import Q from 'q';
import param from 'jquery-param';
import OAuth2Token from './OAuth2Token';
import Dispatcher from 'Dispatcher';

var OAUTH2_CLIENT_ID, OAUTH2_CLIENT_SECRET, OAUTH2_DEFAULT_SCOPE, TOKEN_URL;

var _is_authorizing = false;

function OAuth2API() {

}

// Initializes the authentication manager singleton based on
// a config object
OAuth2API.init = function (client_id, client_secret, token_url, default_scope) {
  OAUTH2_CLIENT_ID = client_id;
  OAUTH2_CLIENT_SECRET = client_secret;
  TOKEN_URL = token_url;
  OAUTH2_DEFAULT_SCOPE = default_scope;
};

// Obtains access getToken from the API with username and password
OAuth2API.obtainAccessTokenWithCredentials = function (username, password, scope) {
  var defer = Q.defer();

  if (!_is_authorizing) {
    _is_authorizing = true;

    var body = {
      grant_type: 'password',
      client_id: OAUTH2_CLIENT_ID,
      client_secret: OAUTH2_CLIENT_SECRET,
      username: username,
      password: password,
      scope: scope || OAUTH2_DEFAULT_SCOPE,
    };
    fetch(TOKEN_URL, {method: 'POST', body: param(body)})
      .then((res) => {
        if (res.status == 200) {

          return res.json();
        }
        else {

          throw  'Response code ' + res.status;
        }
      }, (error) => {

        throw(error);
      })
      .then((responseJSON) => {
        if (responseJSON.access_token) {

          Dispatcher.dispatch({
            actionType: 'valid_token',
            token: responseJSON,
          });

          defer.resolve();
        } else {

          throw 'No access code returned';
        }
        _is_authorizing = false;
      })
      .catch((error) => {
        _is_authorizing = false;
        defer.reject(error.message);
        // TODO: handle this error
      });
  }

  return defer.promise;
};

// Obtains a new access getToken from an existing access getToken
OAuth2API.refreshAccessToken = function (_token) {
  if (!_is_authorizing) {
    _is_authorizing = true;

    var body = {
      client_id: OAUTH2_CLIENT_ID,
      client_secret: OAUTH2_CLIENT_SECRET,
      refresh_token: _token.refresh_token,
      grant_type: 'refresh_token'
    };
    fetch(TOKEN_URL, {method: 'POST', body: param(body)})
      .then((res) => {
        if (res.status == 200) {
          return res.json();
        }
        else {

          Dispatcher.dispatch({
            actionType: 'no_valid_token'
          });

          throw  'Response code ' + res.status;
        }
      }, (error) => {
        throw(error);
      })
      .then((responseJSON) => {
        if (responseJSON.access_token) {

          Dispatcher.dispatch({
            actionType: 'valid_token',
            token: responseJSON,
          });
          
        } else {
          throw 'No access code returned';
        }
        _is_authorizing = false;
      })
      .catch((error) => {
        _is_authorizing = false;
        // TODO: handle error
      });
  }
};


module.exports = OAuth2API;

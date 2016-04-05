/**
 *
 * NOTE: the APIHelper methods use the promises framework, but not
 * to return data.  They simply use the promises framework to signal
 * to the caller that the request succeeded or failed.
 *
 * Data is sent through dispatched events according to the Flux pattern.
 *
 * The promises here can be used, for example, by loading indicators to know
 * when to disappear or display an error.
 *
 */

import Q from 'q';

const SessionStore = require('../Stores/SessionStore');
const ConfigStore = require('../Stores/ConfigStore');

function _initialFetchResponse(res) {
  if (res.status == 200) {
    return res.json();
  }
  else {
    throw  'Response code ' + res.status;
  }
}

function _initialFetchError(error) {
  throw(error);
}


function APIHelper() {
}

APIHelper.authenticatedDelete = function (url, params) {
  var defer = Q.defer();

  SessionStore.requestAccessTokenAsync().then(function (token) {
    var headers = {
      'Authorization': token.getAuthorizationHeader()
    };
    var body = param(params);

    if (body && body.length > 0) {
      url += '?' + body;
    }

    // Now that we have a valid auth token...
    fetch(url, {method: 'DELETE', headers: headers})
      .then(_initialFetchResponse, _initialFetchError)
      .then((responseJSON) => {
        defer.resolve(responseJSON);
      })
      .catch((error) => {
        defer.reject(error);
      });
  }, function () {
    defer.reject();
  });

  return defer.promise;
};

APIHelper.authenticatedGet = function (url, params) {
  var defer = Q.defer();

  SessionStore.requestAccessTokenAsync().then(function (token) {
    var headers = {
      'Authorization': token.getAuthorizationHeader()
    };
    var body = param(params);

    if (body && body.length > 0) {
      url += '?' + body;
    }

    // Now that we have a valid auth token...
    fetch(url, {method: 'GET', headers: headers})
      .then(_initialFetchResponse, _initialFetchError)
      .then((responseJSON) => {
        defer.resolve(responseJSON);
      })
      .catch((error) => {
        defer.reject(error);
      });
  }, function () {
    defer.reject();
  });

  return defer.promise;
};

APIHelper.authenticatedPost = function (url, data) {
  var defer = Q.defer();

  SessionStore.requestAccessTokenAsync().then(function (token) {

    var headers = {
      'Authorization': token.getAuthorizationHeader()
    };
    var param_data = param(data);

    // Now that we have a valid auth token...
    fetch(url, {method: 'POST', body: param_data, headers: headers})
      .then(_initialFetchResponse, _initialFetchError)
      .then((responseJSON) => {
        defer.resolve(responseJSON);
      })
      .catch((error) => {
        defer.reject(error);
      });

  }, function () {
    defer.reject();
  });

  return defer.promise;
};

module.exports = APIHelper;
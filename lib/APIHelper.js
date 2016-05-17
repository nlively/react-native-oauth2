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
import FormData from 'form-data';
import param from 'jquery-param';
import assign from 'object-assign';

import OAuth2SessionStore from './OAuth2SessionStore';

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

APIHelper.authenticatedRequest = (method, url, body, headers) => {
  var defer = Q.defer();

  OAuth2SessionStore.requestAccessTokenAsync().then((token) => {

    const headers = assign({}, {
      'Authorization': token.getAuthorizationHeader(),
      'Accept-Encoding': 'identity'
    }, headers);

    var options = {
      method: method,
      headers: headers
    };
    if (body) {
      options.body = body;
    }

    // Now that we have a valid auth token...
    fetch(url, options)
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
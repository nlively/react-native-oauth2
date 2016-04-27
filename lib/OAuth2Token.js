const moment = require('moment');
const assign = require('object-assign');

function OAuth2Token(token) {
    var obtained = (token != null) ? moment().unix() : 0;

    var self = assign({}, token);

    self.isExpired = function () {
        var seconds_to_expiration = (obtained + token.expires_in) - moment().unix();
        //console.log('Expires in... ' + seconds_to_expiration + ' seconds');
        // 10 minute buffer for access getToken
        return (seconds_to_expiration <= 600);
    };

    self.isRefreshable = function () {
        return (self.isPresent() && token.refresh_token);
    };

    self.isPresent = function () {
        return (token != null && token.access_token);
    };

    self.isValid = function () {
        return (self.isPresent() && !self.isExpired());
    };

/*
 * jayskode 042716
 * The Authorization header commented out here was being rejected by our server.
 * Changing to allows it to be accepted by our web service.  Time will whether whether
 * we intend to fix the problem on the server side instead by allowing Bearer tokens.
 */

    self.getAuthorizationHeader = function (token_type) {
//      return 'Bearer ' + token.access_token + '';
        return 'OAuth ="' + token.access_token + '"';
    }

/*
 * jayskode 0422716
 * Our web service is being awfully particular right now about how the Authorization header
 * can be formatted.
 * There must be a space before the equal sign, and there must NOT be a space after the equal sign.
 * Hopefully we will change this on the server side, to accept any human-readable Authorization string
 * and ignore petty differences with whitespace and whatnot.
 */

    return self;
}

module.exports = OAuth2Token;

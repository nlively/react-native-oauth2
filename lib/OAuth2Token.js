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

    self.getAuthorizationHeader = function (token_type) {
//      return 'Bearer ' + token.access_token + '';
        return 'OAuth ="' + token.access_token + '"';
    }

    return self;
}

module.exports = OAuth2Token;
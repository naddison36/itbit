var querystring = require("querystring"),
    request = require("request"),
    VError = require('verror'),
    cheerio = require('cheerio'),
    crypto = require("crypto"),
    _ = require("underscore"),
    util = require('util');

var self;

var ItBit = function ItBit(settings) {
    self = this;

    this.key = settings.key;
    this.secret = settings.secret;

    this.serverV1 = settings.serverV1 || "https://api.itbit.com/v1";
    this.serverV2 = settings.serverV2 || "https://www.itbit.com/api/v2";
    this.timeout = settings.timeout || 20000;  // milli seconds

    // initialize nonce to current unix time in seconds
    this.nonce = (new Date()).getTime();
};

function makePublicRequest(version, path, args) {
    var functionName = 'ItBit.makePublicRequest()';

    var params = querystring.stringify(args);
    if (params) path = path + "?" + params;

    var server;
    if (version === 'v1') {
        server = self.serverV1;
    }
    else if (version === 'v2') {
        server = self.serverV2;
    }
    else {
        return Promise.reject(new VError('%s version %s needs to be either v1 or v2', functionName, version));
    }

    var options = {
        method: "GET",
        uri: server + path,
        headers: {
            "User-Agent": "itBit node.js client",
            "Content-type": "application/x-www-form-urlencoded"
        },
        json: args
    };

    return executeRequest(options);
};

function makePrivateRequest(method, path, args) {
    var functionName = "ItBit.makePrivateRequest()";

    if (!self.key || !self.secret) {
        return Promise.reject(new VError("%s must provide key and secret to make a private API request.", functionName))
    }

    var uri = self.serverV1 + path;

    // compute the post data
    var postData = "";
    if (method === 'POST' || method === 'PUT') {
        postData = JSON.stringify(args);
    }
    else if (method === "GET" && !_.isEmpty(args)) {
        uri += "?" + querystring.stringify(args);
    }

    var timestamp = (new Date()).getTime();
    var nonce = self.nonce++;

    // message is concatenated string of nonce and JSON array of secret, method, uri, json_body, nonce, timestamp
    var message = nonce + JSON.stringify([method, uri, postData, nonce.toString(), timestamp.toString()]);

    var hashBuffer = crypto
        .createHash("sha256")
        .update(message).digest();

    var bufferToHash = Buffer.concat([Buffer.from(uri), hashBuffer]);

    var signer = crypto.createHmac("sha512", self.secret);

    var signature = signer
        .update(bufferToHash)
        .digest("base64");

    var options = {
        method: method,
        uri: uri,
        headers: {
            "User-Agent": "itBit node.js client",
            Authorization: self.key + ':' + signature,
            "X-Auth-Timestamp": timestamp,
            "X-Auth-Nonce": nonce
        },
        json: args,
        timeout: self.timeout
    };

    return executeRequest(options);
};

function executeRequest(options) {
    var functionName = 'ItBit.executeRequest()', requestDesc;

    if (options.method === 'GET') {
        requestDesc = util.format('%s request to url %s',
            options.method, options.uri);
    }
    else {
        requestDesc = util.format('%s request to url %s with nonce %s and data %s',
            options.method, options.uri, options.headers["X-Auth-Nonce"], JSON.stringify(options.json));
    }
    return new Promise(function (resolve, reject) {
        request(options, function (err, res, body) {
            var error = null;   // default to no errors

            if (err) {
                return reject(new VError(err, '%s failed %s', functionName, requestDesc));
            }
            else if (!body) {
                return reject(new VError('%s failed %s. Not response from server', functionName, requestDesc));
            }
            // if request was not able to parse json response into an object
            else if (!_.isObject(body)) {
                // try and parse HTML body form response
                $ = cheerio.load(body);

                var responseBody = $('body').text();

                if (responseBody) {
                    return reject(new VError(err, '%s could not parse response body from %s\nResponse body: %s', functionName, requestDesc, responseBody));
                }
                else {
                    return reject(new VError(err, '%s could not parse json or HTML response from %s', functionName, requestDesc));
                }
            }
            else if (body && body.code) {
                error = new VError('%s failed %s. Error code %s, description: %s', functionName,
                    requestDesc, body.code, body.description);
                error.name = body.code;
                return reject(error);
            }
            // the following is to trap the JSON response
            // {"error":"The itBit API is currently undergoing maintenance"}
            else if (body && body.error) {
                error = new VError('%s failed %s. Error %s', functionName,
                    requestDesc, body.error);
                error.name = body.error;
                return reject(error);
            }
            else if (!(res.statusCode === 200 || res.statusCode === 201 || res.statusCode === 202)) {
                error = new VError('%s failed %s. Response status code %s, response body %s', functionName,
                    requestDesc, res.statusCode, res.body);
                error.name = res.statusCode;
                return reject(error);
            }

            resolve(body);
        });
    });
};

ItBit.prototype.getOrderBook = function (tickerSymbol) {
    return makePublicRequest('v1', "/markets/" + tickerSymbol + "/order_book", {});
};

ItBit.prototype.getTicker = function (tickerSymbol) {
    return makePublicRequest('v1', "/markets/" + tickerSymbol + "/ticker", {});
};

ItBit.prototype.getTrades = function (tickerSymbol) {
    return makePublicRequest('v1', "/markets/" + tickerSymbol + "/trades?since=0", {});
};

ItBit.prototype.getWallets = function (userId) {
    return makePrivateRequest("GET", "/wallets", {userId: userId});
};

ItBit.prototype.getWallet = function (walletId) {
    return makePrivateRequest("GET", "/wallets/" + walletId, {});
};

ItBit.prototype.getWalletBalance = function (walletId, tickerSymbol) {
    return makePrivateRequest("GET", "/wallets/" + walletId + "/balances/" + tickerSymbol, {});
};

ItBit.prototype.getOrders = function (walletId, instrument, status) {
   
    var args = {};
    
    if (instrument)
        args.instrument = instrument;
    
    if (status)
        args.status = status;
    
    if (args.instrument || args.status)
        return makePrivateRequest("GET", "/wallets/" + walletId + "/orders", args);

    return makePrivateRequest("GET", "/wallets/" + walletId);
};

ItBit.prototype.getOrder = function (walletId, id) {
    return makePrivateRequest("GET", "/wallets/" + walletId + "/orders/" + id, {});
};

// price is an optional argument, if not used it must be set to null
ItBit.prototype.addOrder = function (walletId, side, type, amount, price, instrument, metadata, clientOrderIdentifier) {
    var args = {
        side: side,
        type: type,
        currency: instrument.slice(0, 3),
        amount: amount.toString(),
        price: price.toString(),
        instrument: instrument
    };

    if (metadata) {
        args.metadata = metadata;
    }
    if (clientOrderIdentifier) {
        args.clientOrderIdentifier = clientOrderIdentifier;
    }

    return makePrivateRequest("POST", "/wallets/" + walletId + "/orders", args);
};

ItBit.prototype.cancelOrder = function (walletId, id) {
    return makePrivateRequest("DELETE", "/wallets/" + walletId + "/orders/" + id, {});
};

ItBit.prototype.getWalletTrades = function (walletId, params) {
    return makePrivateRequest("GET", "/wallets/" + walletId + "/trades", params);
};

ItBit.prototype.getFundingHistory = function (walletId, params) {
    return makePrivateRequest("GET", "/wallets/" + walletId + "/funding_history", params);
};

ItBit.prototype.cryptocurrency_withdrawals = function (walletId, currency, amount, address) {
    var args = {currency: currency, amount: amount, address: address};

    return makePrivateRequest("POST", "/wallets/" + walletId + '/cryptocurrency_withdrawals', args);
};

ItBit.prototype.cryptocurrency_deposits = function (walletId, currency) {
    var args = {currency: currency};

    return makePrivateRequest("POST", "/wallets/" + walletId + '/cryptocurrency_deposits', args);
};

module.exports = ItBit;

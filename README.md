itBit
===============

[![npm version](https://badge.fury.io/js/itbit.svg)](https://badge.fury.io/js/itbit)
[![Known Vulnerabilities](https://snyk.io/test/github/naddison36/itbit/badge.svg)](https://snyk.io/test/github/naddison36/itbit)


This is a node.js wrapper for the private and public methods exposed by the [itBit API](https://api.itbit.com/docs).
You will need have a registered account with [itBit](https://www.itbit.com/) and requested API keys to access the private methods.

Please contact help@itbit.com if you are having trouble opening and account and api@itbit.com to request your API key.

### Install

`npm install itbit`

### Examples

```js
var ItBit = require('itbit');

var userId = "",
    walletId = "",
    orderId = "";

var itBit = new ItBit({
    key: "",
    secret: "",
    timeout: 20000  // milliseconds
});

itBit.getTicker("XBTUSD").then(function(data) {
    console.log('bid ' + data.bid + ' ask ' + data.ask);
});

itBit.getOrderBook("XBTUSD").then(function(data) {
    console.log('%s bids and %s asks', data.bids.length, data.asks.length);
});

itBit.getWallets(userId).then(function (wallets) {
    // for each wallet
    wallets.forEach(function(wallet) {
        console.log('wallet id %s, account identifier %s', wallet.id, wallet.accountIdentifier);

        // for each currency
        wallet.balances.forEach(function(balance) {
            console.log('currency %s, total %s, available %s', balance.currency, balance.totalBalance, balance.availableBalance);
        });
    });
});

itBit.getWallet(walletId).then(function(wallet) {
        // for each currency
    wallet.balances.forEach(function(balance){
        console.log('currency %s, total %s, available %s', balance.currency, balance.totalBalance, balance.availableBalance);
    });
});

itBit.getWalletBalance(walletId, "XBT").then(function(balance) {
    console.log('total %s, available %s', balance.totalBalance, balance.availableBalance);
});

itBit.addOrder(walletId, "sell", "limit", "0.01", "500", "XBTUSD", null, null).then(function(data) {
    console.log('new order id ' + data.id);
});

itBit.getOrder(walletId, orderId).then(function(data) {
    console.log(data);
});

itBit.cancelOrder(walletId, orderId).then(function(data) {
    console.log(data);
});
```
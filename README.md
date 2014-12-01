itBit
===============
This is a node.js wrapper for the private and public methods exposed by the [itBit API](http://api-portal.anypoint.mulesoft.com/itbit/api/itbit-exchange).
You will need have a registered account with [itBit](https://www.itbit.com/) and requested API keys to access the private methods.

Please contact help@itbit.com if you are having trouble opening and account or to request your API key.

### Install

`npm install itbit`

### Examples

```js
var ItBit = require('itbit');

var itBit = new ItBit({
    key: "",
    secret: "",
    timeout: 20000  // milliseconds
});

itBit.getTicker("XBTUSD",
	function(err, data){
		console.log('bid ' + data.bid + ' ask ' + data.ask);
});

itBit.getOrderBook("XBTUSD",
	function(err, data){
		console.log('%s bids and %s asks', data.bids.length, data.asks.length);
});

itBit.getWallets(userId,
	function(err, data){
		console.log(data);
});

itBit.getWalletBalances(walletId,
	function(err, data){
		console.log(data);
});

itBit.addOrder(walletId, "sell", "limit", "0.01", "500", "XBTUSD", null, null,
	function(err, data){
		console.log('new order id ' + data.id);
});

itBit.getOrder(walletId, id,
	function(err, data){
		console.log(data);
});

itBit.cancelOrder(walletId, id,
	function(err, data){
		console.log(data);
});
```
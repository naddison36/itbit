itBit
===============
This is a node.js wrapper for the private and public methods exposed by the [itBit API](http://api-portal.anypoint.mulesoft.com/itbit/api/itbit-exchange).
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

itBit.getTicker("XBTUSD",
    function(err, data)
    {
        console.log('bid ' + data.bid + ' ask ' + data.ask);
    }
);

itBit.getOrderBook("XBTUSD",
    function(err, data)
    {
        console.log('%s bids and %s asks', data.bids.length, data.asks.length);
    }
);

itBit.getWallets(userId,
    function(err, wallets)
    {
        // for each wallet
        wallets.forEach(function(wallet)
        {
            console.log('wallet id %s, account identifier %s', wallet.id, wallet.accountIdentifier);

            // for each currency
            wallet.balances.forEach(function(balance)
            {
                console.log('currency %s, total %s, available %s', balance.currency, balance.totalBalance, balance.availableBalance);
            });
        });
    }
);

itBit.getWallet(walletId,
    function(err, wallet)
    {
        // for each currency
        wallet.balances.forEach(function(balance)
        {
            console.log('currency %s, total %s, available %s', balance.currency, balance.totalBalance, balance.availableBalance);
        });
    }
);

itBit.addOrder(walletId, "sell", "limit", "0.01", "500", "XBTUSD", null, null,
    function(err, data)
    {
        console.log('new order id ' + data.id);
    }
);

itBit.getOrder(walletId, orderId,
    function(err, data)
    {
        console.log(data);
    }
);

itBit.cancelOrder(walletId, orderId,
    function(err, data)
    {
        console.log(data);
    }
);
```
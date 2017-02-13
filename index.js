'use strict';

var express = require('express'),
    app = express(),
    port = process.env.PORT || 8080,

    middleware = require('./middleware'),
    product = require('./lib/product');

app.use(middleware());
app.get('/product/:pid', product());

app.listen(port, function() {
    console.log(`Listening on port ${port}`);
});

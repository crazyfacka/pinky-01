'use strict';

var _       = require('lodash'),
    sqlite3 = require('sqlite3'),
    cache   = require('../../cache'),
    db      = new sqlite3.Database('prod.db');

module.exports = function() {
    function isNumeric(n) {
        return !isNaN(parseFloat(n)) && isFinite(n);
    }

    function getFlatProduct(req, res) {
        var id     = req.params.pid,
            locale = req.params.locale || 'en';

        var name, description, stock, price;
        
        cache.get(id, function(error, result) {

            if(result) {
                return res.json(JSON.parse(result));
            } else {
                db.get('SELECT name FROM product WHERE id = $id', {
                    $id: id
                }, function(err, rows) {
                    if (_.isEmpty(rows)) {
                        res.status(404).json({
                            message: 'Product not found'
                        });
                    }

                    name = rows.name;
                    db.get('SELECT description, stock, price FROM product_info pi, product_stock ps WHERE pi.id = $id AND ps.id = $id', {
                        $id: id
                    }, function(err, rows) {
                        description = rows.description;
                        stock = rows.stock;
                        price = rows.price;

                        var product = {name: name, description: description, stock: stock, price: price};

                        // Setting an arbitrary expiry time in case its needed
                        cache.setex(id, 21600, JSON.stringify(product));

                        return res.json(product);
                    });
                });      
            }
        })
    }

    return function(req, res) {
        if (!isNumeric(req.params.pid)) {
            res.status(500).json({
                message: 'Not a valid ID'
            });

            return;
        }

        getFlatProduct(req, res);
    };
};

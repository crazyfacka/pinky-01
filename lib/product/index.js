'use strict';

const _       = require('lodash'),
      sqlite3 = require('sqlite3'),
      db      = new sqlite3.Database('prod.db');

module.exports = function() {
    function isNumeric(n) {
        return !isNaN(parseFloat(n)) && isFinite(n);
    }

    function getFlatProduct(req, res) {
        const id     = req.params.pid,
              locale = req.params.locale || 'en';

        let name, description, stock, price;

        new Promise((resolve, reject) => {
            db.get('SELECT name FROM product WHERE id = $id', {
                $id: id
            }, function(err, rows) {
                if (err) {
                    return reject(err);
                }

                if (_.isEmpty(rows)) {
                    res.status(404).json({
                        message: 'Product not found'
                    });

                    resolve(false);
                }

                resolve(rows);
            });
        }).then((val) => {
            if (val) {
                name = val.name;
                return new Promise((resolve, reject) => {
                    db.get('SELECT description, stock, price FROM product_info pi, product_stock ps WHERE pi.id = $id AND ps.id = $id', {
                        $id: id
                    }, function(err, rows) {
                        if (err) {
                            return reject(err);
                        }

                        description = rows.description;
                        stock = rows.stock;
                        price = rows.price;

                        res.json({
                            name: name,
                            description: description,
                            stock: stock,
                            price: price
                        });

                        resolve();
                    });
                });
            }
        }, err => {
            console.log(err);
        });

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

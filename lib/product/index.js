'use strict';

const _       = require('lodash'),
      sqlite3 = require('sqlite3'),
      db      = new sqlite3.Database('prod.db');

function isNumeric(n) {
    return !isNaN(parseFloat(n)) && isFinite(n);
}

function checkAndGetName(res, product) {
    return new Promise((resolve, reject) => {
        db.get('SELECT name FROM product WHERE id = $id', {
            $id: product.id
        }, function(err, rows) {
            if (err) {
                return reject(err);
            }

            if (_.isEmpty(rows)) {
                res.status(404).json({
                    message: 'Product not found'
                });

                return resolve(false);
            }

            resolve(rows);
        });
    });
}

function getProductInfo(res, rows, product) {
    return new Promise((resolve, reject) => {
        if (rows) {
            product.name = rows.name;
            db.get('SELECT description, stock, price FROM product_info pi, product_stock ps WHERE pi.id = $id AND ps.id = $id', {
                $id: product.id
            }, function(err, rows) {
                if (err) {
                    return reject(err);
                }

                product.description = rows.description;
                product.stock = rows.stock;
                product.price = rows.price;

                resolve();
            });
        } else {
            reject(new Error('No rows returned'));
        }
    });
}

function getFlatProduct(req, res) {
    const locale = req.params.locale || 'en';

    let product = {
        id: req.params.pid
    };

    checkAndGetName(res, product).then((rows) => {
        return getProductInfo(res, rows, product);
    }, err => {
        res.status(500).json({
            message: err.message
        });
    }).then(() => {
        res.json(product);
    }, err => {
        res.status(500).json({
            message: err.message
        });
    });

}

function Product() {
    return function(req, res) {
        if (!isNumeric(req.params.pid)) {
            res.status(500).json({
                message: 'Not a valid ID'
            });

            return;
        }

        getFlatProduct(req, res);
    };
}

module.exports = Product;

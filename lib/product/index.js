'use strict';

const _       = require('lodash'),
      sqlite3 = require('sqlite3'),
      db      = new sqlite3.Database('prod.db');

function isNumeric(n) {
    return !isNaN(parseFloat(n)) && isFinite(n);
}

function checkAndGetName(product) {
    return new Promise((resolve, reject) => {
        db.get('SELECT name FROM product WHERE id = $id', {
            $id: product.id
        }, function(err, rows) {
            if (err) {
                return reject(err);
            }

            if (_.isEmpty(rows)) {
                return resolve(false);
            }

            resolve(rows);
        });
    });
}

function getProductInfo(rows, product) {
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
            reject(404);
        }
    });
}

function handleError(err, res) {
    if (err === 404) {
        res.status(404).json({
            message: "Product not found"
        });
    } else {
        res.status(500).json({
            message: err.message
        });
    }
}

function getFlatProduct(req, res) {
    const locale = req.params.locale || 'en';

    let product = {
        id: req.params.pid
    };

    checkAndGetName(product).then((rows) => {
        return getProductInfo(rows, product);
    }).then(() => {
        res.json(product);
    }).catch((err) => {
        handleError(err, res);
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

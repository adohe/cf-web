var http = require('http'),
    async = require('async'),
    querystring = require('querystring'),
    util = require('../util/util');

/**
 * Expose
 */
module.exports = function(app) {

    // home page
    app.get('/dashboard', function(req, res) {
        res.render('index');
    });

    app.get('/dashboard/service', function(req, res) {
        res.render('index');
    });

    app.all('/v1/*', function(req, res, next) {
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Headers", "X-Requested-With");
        next();
    });

    // ServicesList API
    app.get('/v1/services', function(req, res) {
        http.get('http://localhost', function(resp) {
            var data = [];

            resp.on('data', function(chunk) {
                data.push(chunk);
            });
            resp.on('end', function() {
                var serviceList = JSON.parse(data.join('')).serviceList;
                var result = {
                    'services': serviceList
                };
                res.writeHead(200, {
                    'Content-Type': 'application/json'
                });
                res.write(JSON.stringify(result));
                res.end();
            });
        }).on('error', function(e) {
            res.writeHead(500);
            res.end();
        });
    });

    // ServiceInstances API
    app.get('/v1/service/:name/:namespace', function(req, res) {
        var name = req.params.name,
            namespace = req.params.namespace,
            body = {
                "serviceName": name,
                "serviceNamespace": namespace.replace(/_/g, '/'),
            };

        if(util.isEmpty(name) || util.isEmpty(namespace)) {
            res.writeHead(500);
            res.end();
        } else {
            var options = {
                port: 80,
                path: '/registry-service/getserviceinstances',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            };
            async.parallel({
                fws: function(cb) {
                    var fwsBody = body;
                    fwsBody["subEnv"] = "fws";
                    var b = JSON.stringify(fwsBody);
                    var fwsOptions = {
                        hostname: '',
                        headers: {
                            'Content-Length': Buffer.byteLength(b)
                        }
                    };
                    var req = http.request(util.merge(fwsOptions, options), function(res) {
                        var data = [];
                        res.on('data', function(chunk) {
                            data.push(chunk);
                        });
                        res.on('end', function() {
                          console.log(data.join(''));
                          cb(null, data);
                        });
                    });
                    req.on('error', function(e) {
                        cb(e, null);
                    });
                    req.write(b);
                    req.end();
                },
                uat: function(cb) {
                    var b = JSON.stringify(body);
                    var uatOptions = {
                        hostname: '',
                        headers: {
                            'Content-Length': Buffer.byteLength(b)
                        }
                    };
                    var req = http.request(util.merge(uatOptions, options), function(res) {
                        var data = [];
                        res.on('data', function(chunk) {
                            data.push(chunk);
                        });
                        res.on('end', function() {
                          console.log(data.join(''));
                          cb(null, data);
                        });
                    });
                    req.on('error', function(e) {
                        cb(e, null);
                    });
                    req.write(b);
                    req.end();
                },
                prod: function(cb) {
                    var b = JSON.stringify(body);
                    var prodOptions = {
                        hostname: '',
                        headers: {
                            'Content-Length': Buffer.byteLength(b) 
                        }
                    };
                    var req = http.request(util.merge(prodOptions, options), function(res) {
                        var data = [];
                        res.on('data', function(chunk) {
                            data.push(chunk);
                        });
                        res.on('end', function() {
                          console.log(data.join(''));
                          cb(null, data);
                        });
                    });
                    req.on('error', function(e) {
                        cb(e, null);
                    });
                    req.write(b);
                    req.end();
                }
            },
            function(err, results) {
              res.writeHead(200);
              res.end();
            });
        }
    });
}

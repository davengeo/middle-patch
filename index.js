const express      = require('express'),
      cookieParser = require('cookie-parser'),
      bodyParser   = require('body-parser'),
      config       = require('config'),
      morgan       = require('morgan'),
      _            = require('lodash'),
      http         = require('http'),
      httpProxy    = require('http-proxy'),
      ProxyRules   = require('http-proxy-rules');

const app = express();
const proxy = httpProxy.createProxy();

// express configuration
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(morgan('combined'));

// proxy configuration
const proxyConf = config.get('proxy');

//noinspection JSUnresolvedVariable
const rules = new ProxyRules({
    rules:   proxyConf.routing,
    default: proxyConf.default
});

//proxy initialization
http
    .createServer(function(req, res) {
        let target = rules.match(req);
        if(target) {
            console.log('routing from %s to %s', req.url, target);
            return proxy.web(req, res, { target: target });
        }
        console.log('request to %s coming from %s cannot be dispatched', req.url, req.socket.remoteAddress);
        res.writeHead(500);
        res.end('The request url and path doesn\'t match any rule!');
    })
    .listen(proxyConf.port);

console.log('proxy listening in port %s', proxyConf.port);


//express initialization
const expressConf = config.get('express');

app.use(expressConf.route, require('./bulk-gets-fix'));
//noinspection JSUnresolvedVariable,JSValidateTypes
_.forEach(expressConf.public, folder => app.use(express.static(folder)));

app.listen(expressConf.port);

console.log('express listening in port %s', expressConf.port);

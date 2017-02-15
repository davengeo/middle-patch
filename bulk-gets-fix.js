const express = require('express'),
      request = require('request'),
      _       = require('lodash'),
      config  = require('config');


const syncGwConf = config.get('sync-gw-db');

let router = express.Router();

let rebuildDocs = function(body) {
    const parts = body.split(/\r\n|\r|\n/g);
    return _.reduce(
        _.filter(parts, part => _.startsWith(part, '{')).map(JSON.parse),
        (result, item) => {
            result.push({ ok: item });
            return result;
        },
        []);
}

router.post('', (req, res) => {
    //noinspection JSUnresolvedVariable
    const url = `${syncGwConf.syncGwAdmin}/${syncGwConf.db}/_bulk_get`
    console.log(`calling to \'multipart/mixed\' _bulk_get POST ${url}`)
    return request.post({
        url:     url,
        json:    true,
        headers: { accept: 'multipart/mixed' },
        qs:      req.query,
        body:    req.body
    }, (error, response, body) => {
        console.log('rebuilding response to \'application/json\'');
        //noinspection JSUnresolvedFunction
        res.status(200).json({ results: [{ docs: rebuildDocs(body) }] }).end();
    });
});

module.exports = router;

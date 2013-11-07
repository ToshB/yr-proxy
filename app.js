'use strict';
require('newrelic');
var express = require('express'),
    yrProxy = require('./yrProxy.js')(600),
    search = require('./search.js'),
    app = express();

app.configure(function(){
  app.set('port', process.env.PORT || 3000);
  app.use(function (req, res, next){
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    next();
  });
  app.use(express.favicon());
});

app.get('/', function(req, res){
  res.send(JSON.stringify({
    title: 'Yr.no JSON/CORS Proxy',
    about: 'Weather forecast from yr.no, delivered by the Norwegian Meteorological Institute and the NRK',
    author: 'Torstein Bjørnstad',
    github: 'https://github.com/toshb/yr-proxy',
    usage: [
      {
        type: 'place search',
        example: req.protocol + '://' + req.headers.host + '/search?q=lufthavn&pri=40',
        usage: 'Case insensitive per-word startswith search, optional priority filter. Lower pri, bigger place.'
      },
      {
        type: 'weather lookup',
        example: req.protocol + '://' + req.headers.host + '/sted/Norge/Oslo/Oslo/Oslo/varsel.json',
        usage: 'Looks up weather on yr.no, converts to json, adds cors headers. 10 min cache.'
      }
    ]
  }));
});

app.get('/stats', function(req, res){
  yrProxy.getStats(function (err, data){
    res.send(data);
  });
});

app.get('/search', function(req, res){
  var q = req.query.q,
      pri = parseInt(req.query.pri, 10) || 999;

  if(!q){
    res.send(JSON.stringify({Error:'Missing query parameter q, e.g. search?q=Trondheim'}));
    return;
  }
  search.search({q: q, pri: pri}, function(err, results){
    if(err){
      console.log(err);
      res.send(JSON.stringify({Error:'An error occured during search'}));
      return;
    }
    res.send(JSON.stringify(results));
  });
});

app.get(/(.+)/, function(req, res){
  var path = req.params[0];
  yrProxy.getResponseData(req.headers.host, path, function(err, data){
    if(data.expires){
      res.setHeader('Cache-Control', 'public');
      res.setHeader('Expires', data.expires.toUTCString());
    }
    res.send(err ? err : data.body);
  });
});

app.listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});

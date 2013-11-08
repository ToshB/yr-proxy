'use strict';
require('newrelic');
var express = require('express'),
    yrProxy = require('./yrProxy.js')(),
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

app.get('/mu-dcf59ea8-f9e77d78-e331ac23-70d9b8f8', function(req, res){
  res.send('42');
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
        type: 'nearby search',
        example: req.protocol + '://' + req.headers.host + '/nearby?lat=59.16&lon=11.42&dist=5000',
        usage: 'Location search, return locations near a given location. Max distance 20000 (meters).'
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

app.get('/nearby', function(req, res){
  var lat = req.query.lat,
      lon = req.query.lon,
      dist = req.query.dist || 10000;

  if(dist > 20000){
    dist = 20000;
  }

  if(!lat || !lon){
    res.send(JSON.stringify({Error:'Missing query parameter lat or lon. e.g. nearby?lat=59.16&lon=11.42&dist=5000'}));
  }

  search.nearby({lat: lat, lon: lon, dist:dist}, function(err, results){
    if(err){
      console.log(err);
      res.send(JSON.stringify({Error:'An error occured during search'}));
      return;
    }
    res.send(JSON.stringify(results));
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

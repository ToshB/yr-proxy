require('newrelic');
var express = require('express'),
    yrProxy = require('./yrProxy.js')(10),
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
  yrProxy.getStats(function (err, data){
    res.send(data);
  });
});

app.get('/search2', function(req, res){
  search.search(req.query.q, function(err, results){
    res.end(res);
  });
});

app.get('/search', function(req, res){
  var query = req.query.q,
      data = {results: [{placetype: 'By', placename: 'Oslo', municipality:'Oslo', county:'Oslo', lat: 59.91273, lon: 10.74609, urls: {
    nnNO: 'http://yr-proxy.tosh.no/stad/Noreg/Oslo/Oslo/Oslo/varsel.json',
    nbNO: 'http://yr-proxy.tosh.no/sted/Norge/Oslo/Oslo/Oslo/varsel.json',
    en: 'http://yr-proxy.tosh.no/place/Norway/Oslo/Oslo/Oslo/forecast.json',
  }
}]};
  if(!query){
    res.end(JSON.stringify({Error:'Missing query parameter q, e.g. search?q=Trondheim'}));
    return;
  }
  res.end(JSON.stringify(data));
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

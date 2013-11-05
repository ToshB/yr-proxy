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

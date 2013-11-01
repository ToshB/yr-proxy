/**
 * Module dependencies.
 */
require('newrelic');
var express = require('express'),
    request = require('request'),
    //redis = require('redis').createClient(),
    xml2js = require('xml2js'),
    app = express(),
    parser,
    redis;

if(process.env.REDISTOGO_URL){
  var rtg = require('url').parse(process.env.REDISTOGO_URL);
  redis = require('redis').createClient(rtg.port, rtg.hostname);
  redis.auth(rtg.auth.split(':')[1]);
}else{
  redis = require('redis').createClient();
}

parser = new xml2js.Parser({
  explicitArray: false,
  mergeAttrs: true
});

redis.on('error', function (err) {
    console.log('Error ' + err);
  });

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
  redis.keys('*', function (err, keys){
    res.send({'Cached responses ': keys});
  });
});

function loadData(path, callback){
  var yrPath = 'http://www.yr.no' + path.replace('json', 'xml');
  request(yrPath, function (err, res, body){
    if(!err && res.statusCode === 200){
      parser.parseString(body, function (err, res){
        callback(err, res ? JSON.stringify(res) : null);
      });
    }else{
      callback(null, JSON.stringify({Error: 'Error ' + res.statusCode + ' accessing ' + yrPath}));
    }
  });
}

function getCachedJson(path, callback){
  redis.get(path, function(err, responseDataString){
    var responseData = JSON.parse(responseDataString);
    if(responseData){
      responseData.expires = new Date(responseData.expires);
      callback(err, responseData);
    }else{
      callback(null, null);
    }
  });
}
function cacheJson(path, json){
  var lifetimeInSeconds = 600,
    data = {body: json, expires: new Date()};
  data.expires.setSeconds(data.expires.getSeconds() + lifetimeInSeconds);

  redis.set(path, JSON.stringify(data));
  return data;
}

function getResponseData(path, callback){
  getCachedJson(path, function(err, responseData){
    if(responseData){
      responseData.expires = new Date(responseData.expires);
      console.log('Found data for "'+path+'" in cache, expiring '+ responseData.expires);
      callback(null, responseData);
    }else{
      console.log('Missing data for "'+path+'". Fetching.');
      loadData(path, function (err, json){
        callback(null, err ? {body: JSON.stringify(err)} : cacheJson(path, json));
      });
    }
  });
}

app.get(/(.+)/, function(req, res){
  var path = req.params[0];
  getResponseData(path, function(err, data){
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

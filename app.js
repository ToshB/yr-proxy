/**
 * Module dependencies.
 */
require('newrelic');
var express = require('express'),
    request = require('request'),
    xml2js = require('xml2js'),
    redis = require('redis'),
    parser = new xml2js.Parser({expicitArray: false, mergeAttrs: true}),
    app = express(),
    redisClient = getRedisClient();

function getRedisClient(){
  var client = null,
      rtg = process.env.REDISTOGO_URL ? require('url').parse(process.env.REDISTOGO_URL) : null;
  if(rtg){
    client = redis.createClient(rtg.port, rtg.hostname);
    client.auth(rtg.auth.split(':')[1]);
  }else{
    client = redis.createClient();
  }
  return client;
}

redisClient.on('error', function (err) {
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
  redisClient.keys('*', function (err, keys){
    res.send({'Cached responses ': keys});
  });
});

function replaceLinks(responseBody, hostName){
  return responseBody.replace(/(http:\/\/)www.yr.no(.*)\.xml/g, '$1'+hostName+'$2.json');
}

function cleanupData(data){
  data.weatherdata.links = data.weatherdata.links[0].link;
  data.weatherdata.links.forEach(function(link){
    link.id = link.id.replace('xml', 'json');
  });
}

function loadData(hostName, path, callback){
  var yrPath = 'http://www.yr.no' + path.replace('json', 'xml');
  request(yrPath, function (err, res, body){
    if(!err && res.statusCode === 200){
      body = replaceLinks(body, hostName);
      if(res.headers['content-type'].indexOf('text/xml')>-1){
        parser.parseString(body, function (err, obj){
          cleanupData(obj);
          callback(err, res ? JSON.stringify(obj) : null);
          return;
        });
      }else{
        callback(err, JSON.stringify({Error: 'Not xml/json'}));
      }
    }else{
      callback(null, JSON.stringify({Error: 'Error ' + res.statusCode + ' accessing ' + yrPath}));
    }
  });
}

function getCachedJson(path, callback){
  redisClient.get(path, function(err, responseDataString){
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
  var lifetimeInSeconds = 5,
    data = {body: json, expires: new Date()};
  data.expires.setSeconds(data.expires.getSeconds() + lifetimeInSeconds);

  redisClient.set(path, JSON.stringify(data));
  redisClient.expire(path, lifetimeInSeconds);
  return data;
}

function getResponseData(hostName, path, callback){
  getCachedJson(path, function(err, responseData){
    if(responseData){
      responseData.expires = new Date(responseData.expires);
      console.log('Found data for "'+path+'" in cache, expiring '+ responseData.expires);
      callback(null, responseData);
    }else{
      console.log('Missing data for "'+path+'". Fetching.');
      loadData(hostName, path, function (err, json){
        callback(null, err ? {body: JSON.stringify(err)} : cacheJson(path, json));
      });
    }
  });
}

app.get(/(.+)/, function(req, res){
  var path = req.params[0];
  getResponseData(req.headers.host, path, function(err, data){
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

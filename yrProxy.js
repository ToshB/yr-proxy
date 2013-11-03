var request = require('request'),
    xml2js = require('xml2js'),
    pageCache = require('./pageCache.js'), 
    parser = new xml2js.Parser({expicitArray: false, mergeAttrs: true});

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

function YrProxy(lifetimeInSeconds){
  this.lifetimeInSeconds = lifetimeInSeconds;
}

YrProxy.prototype.getStats = function(callback){
  pageCache.getStats(callback);
};

YrProxy.prototype.getResponseData = function(hostName, path, callback){
  pageCache.getCachedJson(path, function(err, responseData){
    if(responseData){
      responseData.expires = new Date(responseData.expires);
      console.log('Found data for "'+path+'" in cache, expiring '+ responseData.expires);
      callback(null, responseData);
    }else{
      console.log('Missing data for "'+path+'". Fetching.');
      loadData(hostName, path, function (err, json){
        callback(null, err ? {body: JSON.stringify(err)} : pageCache.cacheJson(path, json, this.lifetimeInSeconds));
      });
    }
  });
};

module.exports = function(){
  return new YrProxy(arguments);
};
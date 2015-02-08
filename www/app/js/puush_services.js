'use strict';

var PUUSH_API_BASE = "https://puush.me/api";
var PUUSH_API_MAGIC = "poop";

var CLIENT_DB_KEY_CONFIG = 'CONFIG';
var CLIENT_DB_KEY_HISTORY = 'HISTORY';

var s = angular.module('puushServices', []);

// Hook any initialisation here
s.run(function(Persist,Camera) {
    document.addEventListener("deviceready", Camera._fireReady, true);
    Persist.Initialise();
});

s.factory('Camera',function() {
    var svc = {};

    svc._fireReady = function() {
        console.log("yo dawg, that camera bitch be ready");
    };

    return svc;
});

// Service for access local storage
s.factory('Persist', function($rootScope,$location,webStorage){
    var svc = {};

    var storageApi = webStorage.local;

    svc.Initialise = function() {
        svc.config = angular.fromJson(storageApi.get(CLIENT_DB_KEY_CONFIG)) || {};
        svc.history = angular.fromJson(storageApi.get(CLIENT_DB_KEY_HISTORY)) || [];
    };

    svc.getConfig = function(key) {
        return svc.config[key];
    };

    svc.setConfig = function(key,value) {
        svc.config[key] = value;
        svc._persist();
    };

    svc.setHistory = function(blob) {
        svc.history = blob;
        svc._persist();
    };

    svc._persist = function() {
        storageApi.add(CLIENT_DB_KEY_CONFIG,angular.toJson(svc.config));
        storageApi.add(CLIENT_DB_KEY_HISTORY,angular.toJson(svc.history));
    };

    svc.Reset = function() {
        svc.config = {};
        svc.history = {};
        storageApi.clear();
        $location.path('/');    // Go back to app default route
    };

    return svc;
});

// Service to interact with Puush remote API
s.factory('Puush', function($http,Persist) {
    var svc = {};

    var transform_auth = function(data,headersGetter,status) {
        // Transforms run before interceptors... wtf
        if( data === '-1' ) {
            return data;
        }

        var fields = data.split(',');
        return {
            'premium': fields[0] === '1',
            'apikey': fields[1],
            'expiry': fields[2],
            'freespace': fields[3]
        };
    };

    var transform_history = function(data,headersGetter,status) {
        // Transforms run before interceptors... wtf
        if( data === '-1' ) {
            return data;
        }

        var history = [];
        data.split('\n')
            .filter(function(element){ return !(element === '0' || element === ''); })
            .forEach(function(line){
                var fields = line.split(',');
                history.push({
                    'id': fields[0],
                    'date': fields[1],
                    'url': fields[2],
                    'filename': fields[3],
                    'views': fields[4]
                    // Unknown field
                });
            }
        );

        return history;
    };

    // TODO: Download thumbnail or fullsize image
    // Try using $http to grab it and use FileManager
    // See if FileManager lets you specify the $http object for the request
    // Or use fullsize and cache

    svc.GetHistory = function(ApiKey) {
        var key = ApiKey||Persist.getConfig(CONFIG_KEY_APIKEY);

        var data = new FormData();
        data.append('k',key);

        return $http.post(PUUSH_API_BASE+'/hist', data, { 'transformResponse': transform_history });
    };

    svc.AuthenticateCredentials = function(Email,Password) {
        var data = new FormData();
        data.append('e',Email);
        data.append('p',Password);
        data.append('z',PUUSH_API_MAGIC);

        return $http.post(PUUSH_API_BASE+'/auth', data, { 'transformResponse': transform_auth });
    };

    svc.AuthenticateApiKey = function(ApiKey) {
        var key = ApiKey||Persist.getConfig(CONFIG_KEY_APIKEY);

        var data = new FormData();
        data.append('k',key);
        data.append('z',PUUSH_API_MAGIC);

        return $http.post(PUUSH_API_BASE+'/auth', data, { 'transformResponse': transform_auth });
    };

    svc.isLoggedIn = function() {
        var apiKey = Persist.getConfig(CONFIG_KEY_APIKEY);
        return (apiKey != null);
    };

    return svc;
});


// Puush API is pretty crappy, errors return HTTP 200 and body of '-1'
// This interceptor will make $http treat those as errors so we don't
// have to handle it everywhere
s.config(function($httpProvider) {
    $httpProvider.interceptors.push(function($q) {
        return {
            'request': function(config) {
                // Change settings on all puush requests
                // TODO: Bug here on Mobile Safari config.url.startsWith
                if( config.url.startsWith != null && config.url.startsWith(PUUSH_API_BASE) ) {
                    config.transformRequest = angular.identity;
                    config.headers['Content-Type'] = undefined;
                    config.withCredentials = false;
                    delete config.headers['X-Requested-With'];
                }
                return config;
            },
            'response': function(response) {
                if( response.status === 200 && response.data === '-1' ) {
                    return $q.reject(response);
                }
                return response;
            }
        };
    });
});


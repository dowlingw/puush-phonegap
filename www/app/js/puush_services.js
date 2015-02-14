'use strict';

var PUUSH_API_BASE = "http://puush.me/api";
var PUUSH_API_MAGIC = "poop";

var CLIENT_DB_KEY_CONFIG = 'CONFIG';
var CLIENT_DB_KEY_HISTORY = 'HISTORY';

var s = angular.module('puushServices', []);

// TODO: Elsewhere
function _md5hash_file(file,success,failure) {
    var slice_func = File.prototype.slice || File.prototype.mozSlice || File.prototype.webkitSlice;

    var chunk_size = 524288; // 512KiB Chunks
    var num_chunks = Math.ceil(file.size / chunk_size);
    var current_chunk = 0;

    var spark = new SparkMD5.ArrayBuffer();

    var on_load = function(e) {
        spark.append(e.target.result);
        current_chunk++;

        if (current_chunk < num_chunks) {
            load_next();
        }
        else {
            var hex = spark.end();
            spark.destroy();
            success(hex);
        }
    };

    var on_error = function () {
        spark.destroy();
        failure();
    };

    var load_next = function() {
        var file_reader = new FileReader();
        file_reader.onload = on_load;
        file_reader.onerror = on_error;

        var start = current_chunk * chunk_size;
        var end = ((start + chunk_size) >= file.size) ? file.size : start + chunk_size;

        file_reader.readAsArrayBuffer(slice_func.call(file, start, end));
    };

    load_next();
};


// Hook any initialisation here
s.run(function(Persist,Camera) {
    document.addEventListener("deviceready", Camera._fireReady, true);
    Persist.Initialise();
});

s.factory('Camera',function() {
    var svc = {};

    svc._fireReady = function() {
        // TODO: Don't allow camera until later
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
s.factory('Puush', function($http,$q,Persist) {
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

    var transform_up = function(data,headersGetter,status) {
        // Transforms run before interceptors... wtf
        if( data === '-1' || data === '-2' ) {
            return data;
        }

        // TODO: Translate this

        return data;
    };

    // TODO: Download thumbnail or fullsize image
    // Try using $http to grab it and use FileManager
    // See if FileManager lets you specify the $http object for the request
    // Or use fullsize and cache

    svc.MD5HashFile = function(file) {
        var deferred = $q.defer();

        _md5hash_file(file,
            function(hash) {
                deferred.resolve(hash);
            },
            function() {
                deferred.reject("Failed to hash file");
            }
        );

        return deferred.promise;
    };

    svc.GetFile = function(localPath) {
        var deferred = $q.defer();

        window.resolveLocalFileSystemURL(localPath,
            function(file_entry) {
                file_entry.file(function(file){
                    deferred.resolve(file);
                },function(){
                    deferred.reject("Failed to get file object");
                });
            },
            function(err) {
                $q.reject("Failed to resolve file entry object");
                console.log(err);
            }
        );

        return deferred.promise;
    };

    svc.Upload = function(file,fileUrl,md5,ApiKey) {
        var key = ApiKey||Persist.getConfig(CONFIG_KEY_APIKEY);

        // Mobile Safari doesn't appear to support FormData.append(k, BLOB, [NAME]).
        // But it seems that its ok, because there's a cordova plugin for file transfers
        // It's cooler because it has a callback for upload progress (thats going to come in handy soon)

        var deferred = $q.defer();

        var options = new FileUploadOptions();
        options.fileKey = 'f';
        options.fileName = file.name;
        options.params = {
            'k': key,
            'c': md5,
            'z': PUUSH_API_MAGIC
        };

        var failure = function(error) {
            console.log("Failed to upload file");
            console.log("code " + error.code);
            console.log("http_status " + error.http_status);
            console.log("body " + error.body);
            deferred.reject(error.code);
        };
        var success = function(result) {
            // Transformers: Errors in disguise!
            if( result.response === '-2' || result.response === '-3' || result.response === '-2,' ) {
                failure(result);
            } else {
                deferred.resolve(result);
            }
        };

        var transfer = new FileTransfer();
        transfer.upload(fileUrl, encodeURI(PUUSH_API_BASE+'/up'), success, failure, options);

        return deferred.promise;
    };

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
                if( response.status === 200 && (response.data === '-1' || response.data === '-2') ) {
                    return $q.reject(response);
                }
                return response;
            }
        };
    });
});


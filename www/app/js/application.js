'use strict';

var CONFIG_KEY_APIKEY = 'user.apikey';
var CONFIG_KEY_EMAIL = 'user.email';

var app = angular.module('puush', [
    'ngRoute',

    'webStorageModule',

    'puushServices',
    'puushControllers'
]);

app.config([ '$routeProvider',
    function($routeProvider) {
        $routeProvider
            .when('/history', { templateUrl: 'app/partials/history.html', controller: 'HistoryCtrl', tabTag: 'history' })
            .when('/upload', { templateUrl: 'app/partials/upload.html', controller: 'UploadCtrl', tabTag: 'upload' })
            .when('/account', { templateUrl: 'app/partials/account.html', controller: 'AccountCtrl', tabTag: 'account' })
            .when('/login', { templateUrl: 'app/partials/login.html', controller: 'LoginCtrl' })
            .otherwise({ redirectTo: '/history' });
    }
]);

//
app.run(function ($rootScope, $location, Puush) {
    $rootScope.$on('$routeChangeStart', function (event, next, cur) {
        if( !Puush.isLoggedIn() ) {
            $location.path('/login');
        }
    });
});
'use strict';

var c = angular.module('puushControllers', []);

c.controller('LoginCtrl', function($scope,$location,Puush,Persist) {
    $scope.email = null;
    $scope.pass = null;

    $scope.transacting = false;

    $scope.doLogin = function() {
        $scope.transacting = true;

        Puush.AuthenticateCredentials($scope.email,$scope.pass)
            .success(function(response) {
                Persist.setConfig(CONFIG_KEY_APIKEY,response.apikey);
                Persist.setConfig(CONFIG_KEY_EMAIL,$scope.email);
                $location.path('/history');
                $scope.transacting = false;
            })
            .error(function(response) {
                console.log("Fail whale");
                console.log(response);
                $scope.transacting = false;
            })
        ;
    };
});

c.controller('NavCtrl', function($scope,$route,Puush) {
    $scope.isLoggedIn = function() {
        return Puush.isLoggedIn();
    };
    $scope.isActive = function(tag) {
        return ($route.current.tabTag === tag);
    };
});

c.controller('HistoryCtrl', function($scope,Puush,Persist) {
    $scope.history = Persist.history;
    $scope.transacting = false;

    $scope.Update = function() {
        if( $scope.transacting ) {
            return;
        }

        $scope.transacting = true;
        Puush.GetHistory().success(function(data){
            $scope.transacting = false;
            $scope.history = data;
            Persist.setHistory(data);
        });
    };

    // On load trigger an update
    $scope.Update();
});

c.controller('UploadCtrl', function($scope,Puush) {

    $scope.picOk = function(image) {

    };

    $scope.picFail = function() {
        console.log("boourns")
    };

    $scope.TakePicture = function() {
        navigator.camera.getPicture($scope.picOk, $scope.picFail(), { quality: 50,
            destinationType: Camera.DestinationType.DATA_URL,
            correctOrientation: true
        });
    };

    // On load: take a photo yo!
    $scope.TakePicture();
});

c.controller('AccountCtrl', function($scope,Puush,Persist) {
    $scope.user_email = Persist.getConfig(CONFIG_KEY_EMAIL);
    $scope.user_apikey = Persist.getConfig(CONFIG_KEY_APIKEY);

    $scope.Reset = function() {
        Persist.Reset();
    };
});
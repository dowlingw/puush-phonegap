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

// This is a controller just for handling the "puush button"
c.controller('PuushCtrl', function($scope) {
    $scope.picOk = function(image) {
        console.log("win")
        // Crap, we have a picture now we need to do something with it
    };

    $scope.optSelected = function(btnIdx) {
        if( btnIdx == 3 ) {
            return;
        }
        var imageSource = (btnIdx === 1) ? Camera.PictureSourceType.CAMERA : Camera.PictureSourceType.PHOTOLIBRARY;

        navigator.camera.getPicture($scope.picOk, null, { quality: 50,
            sourceType: imageSource,
            destinationType: Camera.DestinationType.DATA_URL,
            correctOrientation: true
        });
    };

    $scope.TakePicture = function() {
        navigator.notification.confirm(
            'Select the source for the photo to puush',
            $scope.optSelected,
            'Picture Source',
            [
                // Order here is important for optSelected
                'Take Photo',
                'Photo Library',
                'Cancel'
            ]
        );
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
});

c.controller('AccountCtrl', function($scope,Puush,Persist) {
    $scope.user_email = Persist.getConfig(CONFIG_KEY_EMAIL);
    $scope.user_apikey = Persist.getConfig(CONFIG_KEY_APIKEY);

    $scope.Reset = function() {
        Persist.Reset();
    };
});
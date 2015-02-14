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
                $scope.transacting = false;
            })
        ;
    };
});

c.controller('NavCtrl', function($scope,$route,Puush) {
    $scope.showNavigation = function() {
        return Puush.isLoggedIn() && !Puush.navigation_locked;
    };
    $scope.isActive = function(tag) {
        return ($route.current.tabTag === tag);
    };
});

// This is a controller just for handling the "puush button"
c.controller('PuushCtrl', function($scope,$location) {

    $scope.picOk = function(imagePath) {
        $location.url('/upload?uri='+encodeURIComponent(btoa(imagePath)));
        $scope.$apply(); // blergh
    };

    $scope.optSelected = function(btnIdx) {
        if( btnIdx == 3 ) {
            return;
        }
        var imageSource = (btnIdx === 1) ? Camera.PictureSourceType.CAMERA : Camera.PictureSourceType.PHOTOLIBRARY;

        navigator.camera.getPicture($scope.picOk, null, {
            quality: 50,
            sourceType: imageSource,
            destinationType: Camera.DestinationType.FILE_URI,
            correctOrientation: true
        });
    };

    $scope.TakePicture = function() {
        console.log(navigator);
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

c.controller('UploadCtrl', function($scope,$routeParams,$location,Puush) {
    $scope.imagePath = atob($routeParams.uri);

    $scope.cleanup = function() {
        Puush.navigation_locked = false;
        navigator.camera.cleanup();
        $location.path('/history');
        $scope.$apply();
    };

    $scope.success = function() {
        $scope.cleanup();
    };

    $scope.failed = function() {
        alert('Failed to puush!');
        $scope.cleanup();
    };

    $scope.Upload = function(imagePath) {
        Puush.navigation_locked = true;
        Puush.GetFile(imagePath)
            .then(function (file) {
                Puush.MD5HashFile(file)
                    .then(function (md5_hash) {
                        Puush.Upload(file, imagePath, md5_hash)
                            .then($scope.success, $scope.failed);
                    }, $scope.failed);
            }, $scope.failed);
    };

    // On load start uploading
    $scope.Upload($scope.imagePath);
});

c.controller('HistoryCtrl', function($scope,Puush,Persist) {
    $scope.history = Persist.history;
    $scope.transacting = false;

    $scope.Update = function() {
        if( $scope.transacting ) {
            return;
        }

        $scope.transacting = true;
        Puush.GetHistory()
            .success(function(data){
                $scope.history = data;
                Persist.setHistory(data);
            })
            .finally(function(){
                $scope.transacting = false;
                $scope.$broadcast('scroll.refreshComplete');
            })
        ;
    };

    // On load trigger an update
    $scope.Update();
});

c.controller('AccountCtrl', function($scope,Puush,Persist) {
    $scope.user_email = Persist.getConfig(CONFIG_KEY_EMAIL);
    $scope.user_apikey = Persist.getConfig(CONFIG_KEY_APIKEY);

    $scope.Reset = function() {
        Persist.Reset();
    };
});
spikeApp.controller("mainController", function ($scope, $location, polarConverterFactory) {
    $scope.headerSrc = "tmpl/header.html";
    $scope.result = "";

    $scope.test = "Hello world";

    $scope.back = function () {
        window.history.back();
    };

    $scope.getCount = function (n) {
        return new Array(n);
    }

    $scope.isActive = function (route) {
        return route === $location.path();
    }

    $scope.isActivePath = function (route) {
        return ($location.path()).indexOf(route) >= 0;
    }

    $scope.generateTcx = function() {
        $scope.result = polarConverterFactory.run();
    }
});
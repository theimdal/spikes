polarToolsApp.controller("mainController", function ($scope, $location, polarToolsFactory) {
    $scope.headerSrc = "tmpl/header.html";
    $scope.files = [];

    $scope.back = function () {
      window.history.back();
    };

    $scope.isActive = function (route) {
      return route === $location.path();
    }

    $scope.isActivePath = function (route) {
      return ($location.path()).indexOf(route) >= 0;
    }

    $scope.generateTcx = function() {
      $scope.result = polarToolsFactory.convert();
    }

    $scope.refreshFiles = function() {
        $scope.files = polarToolsFactory.getFilesToBeConverted();
    }
});
spikeApp.controller("mainController", function ($scope, $location, polarToolsFactory) {
  $scope.headerSrc = "tmpl/header.html";
  $scope.result = "";
  $scope.files = {};

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
      $scope.result = polarToolsFactory.convert();
  }
});
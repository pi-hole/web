'use strict';

/**
 * @ngdoc function
 * @name piholeAdminApp.controller:ListCtrl
 * @description
 * # ListCtrl
 * Controller of the piholeAdminApp
 */
angular.module('piholeAdminApp')
  .controller('ListCtrl', ['$scope', 'API', 'CacheService', '$location', '$timeout', function ($scope, API, CacheService, $location, $timeout) {
    var listType = $location.path().replace('/', '').replace('list', '');
    $scope.token = true;
    $scope.alInfo = false;
    $scope.alSuccess = false;
    $scope.alFailure = false;


    $scope.listFullname = listType.capitalizeFirstLetter() + 'list';
    $scope.refreshing = false;
    var loadData = function (listType) {
      $scope.refreshing = true;
      API.getList(listType).then(function (result) {
        $scope.list = result;
        CacheService.put(listType + 'list', $scope.list);
        $scope.refreshing = false;
      })
    };
    $scope.domain = '';

    var cache = CacheService.get(listType + 'list');
    if (!cache) {
      loadData(listType);
    } else {
      $scope.list = cache;
    }


    $scope.refreshData = function () {
      loadData(listType);
    };

    $scope.addDomain = function () {
      API.fetchCRSFToken().then(function (token) {
        API.addToList(listType, $scope.domain, token).then(function (result) {
          if (result.indexOf("not a valid argument") >= 0) {
            $scope.alFailure = true;
            $timeout(function () {
              $scope.alFailure = false;
            }, 3000);

          } else {
            $scope.list.push($scope.domain);
            CacheService.put(listType + 'list', $scope.list);
            $scope.alInfo = true;
            $scope.alSuccess = true;
            $scope.domain = '';
            $timeout(function () {
              $scope.alInfo = false;
              $scope.alSuccess = false;
            }, 3000);
          }
        });
      });
    };

    $scope.removeDomain = function (domain) {
      API.fetchCRSFToken().then(function (token) {
        API.removeFromList(listType, domain, token).then(function () {
          var idx = $scope.list.indexOf(domain);
          $scope.list.splice(idx, 1);
        });
      });
    }
  }]);

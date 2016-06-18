'use strict';

/**
 * @ngdoc function
 * @name piholeAdminApp.controller:DashboardCtrl
 * @description
 * # DashboardCtrl
 * Controller of the piholeAdminApp
 */
angular.module('piholeAdminApp')
  .controller('MenuCtrl', ['$scope', 'API', '$interval', 'CacheService', function ($scope, API, $interval, CacheService) {
    var inCache = [];


    var refreshData = function () {
      API.getStatus().then(function (status) {
        $scope.status = status;
      });
    };


    refreshData();
    $interval(function () {
      refreshData();
    }, 10 * 1000);
  }]);

'use strict';

/**
 * @ngdoc function
 * @name piholeAdminApp.controller:DashboardCtrl
 * @description
 * # DashboardCtrl
 * Controller of the piholeAdminApp
 */
angular.module('piholeAdminApp')
  .controller('AppCtrl', ['$scope', 'API', '$interval', 'CacheService', function ($scope, API, $interval, CacheService) {
    var inCache = [];


    var refreshData = function () {
      API.getVersions().then(function (status) {
        $scope.versions = status;
      });
    };
    refreshData();
  }]);

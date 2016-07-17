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

    var history = CacheService.get('statusHistory');
    if(!history){
      history = [];
    }


  }]);

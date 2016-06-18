'use strict';

/**
 * @ngdoc overview
 * @name piholeAdminApp
 * @description
 * # piholeAdminApp
 *
 * Main module of the application.
 */
angular
  .module('piholeAdminApp', [
    'ngAnimate',
    'ngCookies',
    'ngResource',
    'ngRoute',
    'ngSanitize',
    'ngTouch',
    'datatables',
    'chart.js'
  ])
  .config(function ($routeProvider) {
    $routeProvider
      .when('/', {
        templateUrl: 'views/dashboard.html',
        controller: 'DashboardCtrl'
      })
      .when('/queries', {
        templateUrl: 'views/querylog.html',
        controller: 'QuerylogCtrl'
      })
      .when('/whitelist', {
        templateUrl: 'views/list.html',
        controller: 'ListCtrl'
      })
      .when('/blacklist', {
        templateUrl: 'views/list.html',
        controller: 'ListCtrl'
      })
      .otherwise({
        redirectTo: '/'
      });
  })
  .config(function ($locationProvider) {
    //$locationProvider.html5Mode(true);
  })
  .config(function ($httpProvider) {
    //$locationProvider.html5Mode(true);
    $httpProvider.defaults.headers.post['Content-Type'] = 'application/x-www-form-urlencoded;charset=utf-8';
    /**
     * The workhorse; converts an object to x-www-form-urlencoded serialization.
     * @param {Object} obj
     * @return {String}
     */
    var param = function(obj) {
      var query = '', name, value, fullSubName, subName, subValue, innerObj, i;

      for(name in obj) {
        value = obj[name];

        if(value instanceof Array) {
          for(i=0; i<value.length; ++i) {
            subValue = value[i];
            fullSubName = name + '[' + i + ']';
            innerObj = {};
            innerObj[fullSubName] = subValue;
            query += param(innerObj) + '&';
          }
        }
        else if(value instanceof Object) {
          for(subName in value) {
            subValue = value[subName];
            fullSubName = name + '[' + subName + ']';
            innerObj = {};
            innerObj[fullSubName] = subValue;
            query += param(innerObj) + '&';
          }
        }
        else if(value !== undefined && value !== null)
          query += encodeURIComponent(name) + '=' + encodeURIComponent(value) + '&';
      }

      return query.length ? query.substr(0, query.length - 1) : query;
    };

    // Override $http service's default transformRequest
    $httpProvider.defaults.transformRequest = [function(data) {
      return angular.isObject(data) && String(data) !== '[object File]' ? param(data) : data;
    }];
  });

String.prototype.capitalizeFirstLetter = function() {
  return this.charAt(0).toUpperCase() + this.slice(1);
};
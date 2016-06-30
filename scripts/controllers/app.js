'use strict';

/**
 * @ngdoc function
 * @name piholeAdminApp.controller:DashboardCtrl
 * @description
 * # DashboardCtrl
 * Controller of the piholeAdminApp
 */
angular.module('piholeAdminApp')
  .controller('AppCtrl', ['$scope', 'API', '$interval', '$rootScope', '$location', '$translate', function ($scope, API, $interval, $rootScope, $location, $translate) {
    $scope.piholeUpdateAvailable = false;
    $scope.webUpdateAvailable = false;

    /**
     * Define availble languages here
     * @type {*[]}
     */
    $scope.languages = [
      {
        language_key:'en',
        value_key: 'LANGUAGE_ENGLISH'
      },
      {
        language_key:'nl',
        value_key: 'LANGUAGE_DUTCH'
      },
      {
        language_key:'es',
        value_key: 'LANGUAGE_SPANISH'
      }
    ];

    $scope.changeLanguage = function(key){
      $translate.use(key);
    };

    var refreshData = function () {
      API.getVersions().then(function (status) {
        $scope.versions = status;
        // Update check
        $.getJSON("https://api.github.com/repos/pi-hole/pi-hole/releases/latest", function(json) {
          // Skip if on dev
          if($scope.versions.pihole !== "vDev" && versionCompare($scope.versions.pihole, json.tag_name.slice(1)) < 0) {
            // Alert user
            $scope.piholeUpdateAvailable = true;
            if(!$("#dropdown-menu").hasClass("open")) {
              $("#dropdown-menu").addClass("open");
            }
          }
        });
        $.getJSON("https://api.github.com/repos/pi-hole/AdminLTE/releases/latest", function(json) {
          // Skip if on dev
          if($scope.versions.pihole_webinterface !== "vDev" && versionCompare($scope.versions.pihole_webinterface, json.tag_name.slice(1)) < 0) {
            // Alert user
            $scope.webUpdateAvailable = true;
            if(!$("#dropdown-menu").hasClass("open")) {
              $("#dropdown-menu").addClass("open");
            }
          }
        });
      });
    };

    $scope.$on('$routeChangeSuccess', function () {
      jQuery('body').removeClass('sidebar-open');
    });

    // Credit for following function: https://gist.github.com/alexey-bass/1115557
    var  versionCompare = function(left, right) {
      if (typeof left + typeof right != 'stringstring')
        return false;

      var a = left.split('.')
        ,   b = right.split('.')
        ,   i = 0, len = Math.max(a.length, b.length);

      for (; i < len; i++) {
        if ((a[i] && !b[i] && parseInt(a[i]) > 0) || (parseInt(a[i]) > parseInt(b[i]))) {
          return 1;
        } else if ((b[i] && !a[i] && parseInt(b[i]) > 0) || (parseInt(a[i]) < parseInt(b[i]))) {
          return -1;
        }
      }

      return 0;
    };

    $rootScope.status_history = [];
    var updateAll = function(){
      API.rawQuery('getStatus&getTemp&getMemoryStats&getCPUStats').then(function(result){
        result.timestamp = new Date();
        $scope.status = result.status;
        $scope.temp = result.temp;
        $scope.mem = result.memory;
        $scope.cpu = result.cpu;
        $rootScope.$emit('statusUpdate', result);
        $rootScope.status_history.push(result);
        $rootScope.status_history = $rootScope.status_history.slice(0,6)
      })
    };


    $scope.getClass = function (path) {
      if(path === '/') {
        if($location.path() === '/') {
          return "active";
        } else {
          return "";
        }
      }

      if ($location.path().substr(0, path.length) === path) {
        return "active";
      } else {
        return "";
      }
    }

    updateAll();
    $interval(function () {
      updateAll();
    }, 10 * 1000);

    refreshData();
  }]);

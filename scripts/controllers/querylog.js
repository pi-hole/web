'use strict';

/**
 * @ngdoc function
 * @name piholeAdminApp.controller:QuerylogCtrl
 * @description
 * # QuerylogCtrl
 * Controller of the piholeAdminApp
 */
angular.module('piholeAdminApp')
  .controller('QuerylogCtrl', ['$scope', 'API', 'CacheService', '$interval', '$timeout', function ($scope, API, CacheService, $interval, $timeout) {
    //
    var queries = CacheService.get('queries');
    var tableCache = function (data, callback, settings) {
      if (!queries) {
        $scope.refreshing = true;
        API.getAllQueries(true).then(function (result) {
          var queries = result;
          $scope.refreshing = false;
          CacheService.put('queries', queries);
          $scope.queries = queries;
          $scope.$broadcast('queriesLoaded', queries);
          callback( { data: queries } );
        });
      } else {
        $scope.queries = queries;
        callback( { data: queries } );
      }
    };


    $timeout(function () {
      var dt = $('#all-queries').DataTable({
        rowCallback: function (row, data, index) {
          if (data[4] == 'Pi-holed') {
            $(row).css('color', 'red')
          }
          else {
            $(row).css('color', 'green')
          }
        },
        //data: queries,
        ajax: tableCache,
        autoWidth: false,
        order: [[0, "desc"]],
        columns: [
          {'width': "20%", 'type': 'date'},
          {'width': "10%"},
          {'width': "40%"},
          {'width': "15%"},
          {'width': "15%"}
        ]
      });


      $scope.refreshData = function(){
        CacheService.put('queries', null);
        dt.ajax.reload();
      };
    }, 10);


  }]);

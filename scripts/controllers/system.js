'use strict';

/**
 * @ngdoc function
 * @name piholeAdminApp.controller:DashboardCtrl
 * @description
 * # DashboardCtrl
 * Controller of the piholeAdminApp
 */
angular.module('piholeAdminApp')
  .controller('SystemCtrl', ['$scope', 'API', '$rootScope', '$translate', function ($scope, API, $rootScope, $translate) {
    $scope.labels = [];
    $scope.history = {
      memory: {
        serie: [$translate.instant('MEM_USED'), $translate.instant('MEM_FREE'), $translate.instant('MEM_CACHED')],
        values: [[],[],[]]
      },
      cpu: {
        serie: [$translate.instant('CPU_LOAD')],
        values: [[]]
      },
      temp: {
        serie: [$translate.instant('TEMP')],
        values: [[]]
      }
    };
    $scope.series = [$translate.instant('CPU_LOAD')];
    $scope.datasetOverride = [{ yAxisID: 'y-axis-1' }, { yAxisID: 'y-axis-2' }];
    $scope.options = {
      animation: false
    };
    $scope.mode = 'cpu';
    $scope.$watch('labels', function () {
      $scope.data = $scope.history[$scope.mode].values;
    });

    /**
     * @param mode {cpu|temp|memory}
     */
    $scope.switchGraph = function(mode){
      $scope.mode = mode;
      $scope.series = $scope.history[mode].serie;
      $scope.data = $scope.history[mode].values
    };

    var parseData = function (data) {
      var d = new Date(data.timestamp);
      var h = (d.getHours() < 10) ? '0' + d.getHours() : d.getHours();
      var m = (d.getMinutes() < 10) ? '0' + d.getMinutes() : d.getMinutes();
      var s = (d.getSeconds() < 10) ? '0' + d.getSeconds() : d.getSeconds();
      var label = h + ':' + m + ':' + s;
      $scope.labels.push(label);
      $scope.history.memory.values[0].push(data.memory.used);
      $scope.history.memory.values[1].push(data.memory.free);
      $scope.history.memory.values[2].push(data.memory.cached);
      $scope.history.cpu.values[0].push(data.cpu[0]);
      $scope.history.temp.values[0].push(data.temp);

      var start = Math.max($scope.labels.length - 12, 0);
      $scope.history.temp.values[0] = $scope.history.temp.values[0].slice(start);
      $scope.history.memory.values[0] = $scope.history.memory.values[0].slice(start);
      $scope.history.memory.values[1] = $scope.history.memory.values[1].slice(start);
      $scope.history.memory.values[2] = $scope.history.memory.values[2].slice(start);
      $scope.history.cpu.values[0] = $scope.history.cpu.values[0].slice(start);
      $scope.labels = $scope.labels.slice(start);

    };

    angular.forEach($rootScope.status_history, function (value, key) {
      parseData(value)
    });

    $rootScope.$on('statusUpdate', function (evt, data) {
      parseData(data);
    });

    $scope.diskStatsChart = {
      labels: ['Used','Free'],
      data: [[],[]],
      color: [
        "#f56954",
        "#3c8dbc"
      ],
      options: {
        animation: false
      }
    };

    API.getDiskStats().then(function(result){
      $scope.diskStatsChart.data[0] =(result.disk.total -  result.disk.free);
      $scope.diskStatsChart.data[1] = result.disk.free;
      $scope.mounts = result.disk.mounts;
    });

    $scope.refreshProcesses = function(){
      $scope.refreshing_process = true;
      API.getProcesses().then(function(result){
        $scope.processes = result.processes;
        $scope.refreshing_process = false;
      });
    };
    $scope.refreshProcesses();



    $scope.networkChart = {
      labels: ['In (bytes)','Out (bytes)'],
      data: [[],[]],
      color: [
        "#f56954",
        "#3c8dbc"
      ],
      options: {
        animation: false
      }
    };

    API.getNetworkStats().then(function(result){
      var conf_interface = 'eth0';
      angular.forEach(result.network, function(network){
        if(network.name == conf_interface){
          $scope.interface = network;
        }
      });
      $scope.networkChart.data[0] = $scope.interface.tx.bytes;
      $scope.networkChart.data[1] = $scope.interface.rx.bytes;
    });
  }]);

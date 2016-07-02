'use strict';

/**
 * @ngdoc function
 * @name piholeAdminApp.controller:DashboardCtrl
 * @description
 * # DashboardCtrl
 * Controller of the piholeAdminApp
 */
angular.module('piholeAdminApp')
  .controller('DashboardCtrl', ['$scope', 'API', '$interval', 'CacheService', '$timeout', function ($scope, API, $interval, CacheService, $timeout) {
    var queries;
    var inCache = [];

    var updateSummaryData = function () {
      API.summary().then(function (result) {
        $scope.summary = result;
        CacheService.put('summary', result)
      })
    };

    if (CacheService.get('summary')) {
      
      $scope.summary = CacheService.get('summary');
      inCache.push('updateSummaryData');
    } else {
      updateSummaryData();
    }


    var updateQueriesOverTime = function () {
      //$scope.timeLineChartCrumb
      API.overTimeData().then(function (result) {
        var i = 0;
        var labels = [];
        var timeLineChartData = [];
        angular.forEach(result, function (prop, k) {
          angular.forEach(prop, function (val, hour) {
            if (i == 0) {
              labels.push(hour);
            }
            if (!timeLineChartData[i]) {
              timeLineChartData[i] = [];
            }
            timeLineChartData[i].push(val)
          });
          if ($scope.timeLineChartCrumb.length == 0) {
            $scope.timeLineChart.data = timeLineChartData;
            $scope.timeLineChart.labels = labels;
          } else {
            $scope.timeLineChartCrumb[0].data = timeLineChartData;
            $scope.timeLineChartCrumb[0].labels = labels;
          }
          i++;
        });
        CacheService.put('timeLineChart', $scope.timeLineChart);
        $('#queries-over-time').find('.overlay').remove();
      });
    };

    $scope.timeLineChart = {
      labels: [],
      data: [
        [],
        []
      ],
      colours: [
        "#00a65a",
        "#00c0ef"
      ],
      options: {
        animation: false
      }
    };

    if (CacheService.get('timeLineChart')) {
      
      $scope.timeLineChart = CacheService.get('timeLineChart');
      inCache.push('updateQueriesOverTime');
      $('#queries-over-time').find('.overlay').remove();
    } else {
      updateQueriesOverTime();
    }

    $scope.timeLineChartCrumb = [];

    $scope.zoomOverTimeData = function (ChartElement) {
      var hour = ChartElement[0].label.toString();
      if (hour.indexOf(':') != -1) {
        var popped = $scope.timeLineChartCrumb.pop();
        $scope.timeLineChart = popped;
        return;
      } else {
        $scope.timeLineChartCrumb.push(angular.copy($scope.timeLineChart));
      }
      if (queries) {
        var ads_over_time = [];
        var domains_over_time = [];
        var labels = [];

        var thisHourQuries = [];

        angular.forEach(queries, function (query) {
          var d = new Date(query.date);
          if (d.getHours() == hour) {
            thisHourQuries.push(query)
          }
        });

        for (var i = 0; i < 60; i++) {
          ads_over_time[i] = 0;
          domains_over_time[i] = 0;
          var prefix = '';
          if (i < 10) {
            prefix = '0';
          }
          labels[i] = hour + ':' + prefix + i;
          angular.forEach(thisHourQuries, function (query) {
            var d = new Date(query.date);
            if (d.getMinutes() == i) {
              if (query.status === 'Pi-holed') {
                ads_over_time[i] += 1
              }
              domains_over_time[i] += 1
            }
          });
        }
        $scope.timeLineChart.labels = labels;
        $scope.timeLineChart.data[0] = domains_over_time;
        $scope.timeLineChart.data[1] = ads_over_time;
      }
    };

    var updateQueryTypes = function () {


      API.getQueryTypes().then(function (result) {
        var i = 0;
        var colors = [];
        var data = [];
        var labels = [];
        var ccolor = [];

        angular.forEach($.AdminLTE.options.colors, function (value) {
          colors.push(value);
        });
        angular.forEach(result, function (value, type) {
          labels.push(type);
          data.push(value);
          ccolor.push(colors.shift());
          i++;
        });
        $scope.queryTypeChart.labels = labels;
        $scope.queryTypeChart.data = data;
        $scope.queryTypeChart.color = ccolor;
        CacheService.put('queryTypeChart', $scope.queryTypeChart);
        $('#query-types').find('.overlay').remove();
      });
    };

    $scope.queryTypeChart = {
      labels: [],
      data: [],
      color: [
        "#00c0ef",
        "#dd4b39"
      ],
      options: {
        animation: false
      }
    };

    if (CacheService.get('queryTypeChart')) {
      
      $scope.queryTypeChart = CacheService.get('queryTypeChart');
      inCache.push('updateQueryTypes');
      $('#query-types').find('.overlay').remove();
    } else {
      updateQueryTypes();
    }


    var updateForwardDestinations = function () {

      API.getForwardDestinations().then(function (result) {
        var i = 0;
        var colors = [];
        var data = [];
        var labels = [];
        var ccolor = [];
        angular.forEach($.AdminLTE.options.colors, function (value) {
          colors.push(value);
        });
        angular.forEach(result, function (value, type) {
          labels.push(type);
          data.push(value);
          ccolor.push(colors.shift());
          i++;
        });
        $scope.forwardDestinationChart.data = data;
        $scope.forwardDestinationChart.labels = labels;
        $scope.forwardDestinationChart.color = ccolor;
        CacheService.put('forwardDestinationChart', $scope.forwardDestinationChart);
        $('#forward-destinations').find('.overlay').remove();
      });
    };

    $scope.forwardDestinationChart = {
      labels: [],
      data: [],
      color: [],
      options: {
        animation: false
      }
    };

    if (CacheService.get('forwardDestinationChart')) {
      
      $scope.forwardDestinationChart = CacheService.get('forwardDestinationChart');
      inCache.push('updateForwardDestinations');
      $('#forward-destinations').find('.overlay').remove();
    } else {
      updateForwardDestinations();
    }


    var updateTopClientsChart = function () {
      var topClients = [];
      API.rawQuery('summaryRaw&getQuerySources').then(function (data) {
        angular.forEach(data.top_sources, function (amount, client) {
          topClients.push({
            'ip': client,
            'amount': amount,
            'percent': (amount / data.dns_queries_today) * 100
          });
        });
        CacheService.put('topClients', topClients);
        //$scope.summary
        $scope.topClients = topClients;
        $('#client-frequency').find('.overlay').remove();
      });
    };
    $scope.topClients = [];

    if (CacheService.get('topClients')) {
      
      $scope.topClients = CacheService.get('topClients');
      inCache.push('updateTopClientsChart');
      $('#client-frequency').find('.overlay').remove();
    } else {
      updateTopClientsChart();
    }

    var updateTopLists = function () {
      var topDomains = [];
      var topAds = [];
      API.rawQuery('summaryRaw&topItems').then(function (data) {
        angular.forEach(data.top_queries, function (amount, client) {
          topDomains.push({
            'ip': client,
            'amount': amount,
            'percent': (amount / data.dns_queries_today) * 100
          })
        });
        angular.forEach(data.top_ads, function (amount, client) {
          topAds.push({
            'ip': client,
            'amount': amount,
            'percent': (amount / data.dns_queries_today) * 100
          })
        });
        CacheService.put('topDomains', topDomains);
        CacheService.put('topAds', topAds);
        $scope.topDomains = topDomains;
        $scope.topAds = topAds;
        $('#domain-frequency').find('.overlay').remove();
        $('#ad-frequency').find('.overlay').remove();
      });
    };
    $scope.topDomains = [];
    $scope.topAds = [];

    if (CacheService.get('topDomains') && CacheService.get('topAds')) {
      
      $scope.topDomains = CacheService.get('topDomains');
      $scope.topAds = CacheService.get('topAds');
      inCache.push('updateTopLists');
      $('#domain-frequency').find('.overlay').remove();
      $('#ad-frequency').find('.overlay').remove();
    } else {
      updateTopLists();
    }

    API.getAllQueries(false).then(function (result) {
      queries = result;
      CacheService.put('queryPage', queries);
    });

    var refreshData = function () {
      
      updateSummaryData();
      updateQueriesOverTime();
      updateQueryTypes();
      updateForwardDestinations();
      updateTopClientsChart();
      updateTopLists();
    };
    if(inCache) {
      $timeout(function () {
          refreshData()
      }, 5000);
    }

    $interval(function () {
      refreshData();
    }, 60 * 1000);
  }]);

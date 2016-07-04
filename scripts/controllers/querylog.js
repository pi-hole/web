'use strict';

/**
 * @ngdoc function
 * @name piholeAdminApp.controller:QuerylogCtrl
 * @description
 * # QuerylogCtrl
 * Controller of the piholeAdminApp
 */
angular.module('piholeAdminApp')
  .controller('QuerylogCtrl', ['$scope', 'API', 'CacheService', 'uiGridConstants', '$translate', 'i18nService', '$rootScope', '$routeParams', '$timeout', function ($scope, API, CacheService, uiGridConstants, $translate, i18nService, $rootScope, $routeParams, $timeout) {
    //
    var queries = CacheService.get('queryPage');
    var tableCache = function () {
      if (!queries) {
        $scope.refreshing = true;
        API.getAllQueries().then(function (result) {
          var queries = result;
          $scope.refreshing = false;
          CacheService.put('queryPage', queries);
          $scope.gridOptions.data = queries;
          $scope.$broadcast('queriesLoaded', queries);
          //callback( { data: queries } );
        });
      } else {
        $scope.gridOptions.data = queries;
        //callback( { data: queries } );
      }
    };

    var rowTemplate = function () {
      return '<div ng-class="{ \'pi-holed\': grid.appScope.rowFormatter( row ) }">' +
        '  <div ng-if="row.entity.merge">{{row.entity.title}}</div>' +
        '  <div ng-if="!row.entity.merge" ng-repeat="(colRenderIndex, col) in colContainer.renderedColumns track by col.colDef.name" class="ui-grid-cell" ng-class="{ \'ui-grid-row-header-cell\': col.isRowHeader }"  ui-grid-cell></div>' +
        '</div>';
    };

    $scope.rowFormatter = function (row) {
      return row.entity.status === 'Pi-holed';
    };

    var getTableHeight = function (numResults) {
      var rowHeight = 35; // your row height
      var headerHeight = 35; // your header height
      return (numResults * rowHeight + headerHeight)
    };

    $scope.getdomainInfo = function (row) {
      if (row.isExpanded) {
        row.entity.subGridOptions = {
          columnDefs: [
            {
              name: 'list'
            },
            {
              name: 'found',
              cellTemplate: '<div class="ui-grid-cell-contents" title="TOOLTIP"><span ng-if="COL_FIELD">{{\'DOMAIN_FOUND_IN_LIST\' | translate}}</span><span ng-if="!COL_FIELD"> {{\'DOMAIN_NOT_FOUND_IN_LIST\' | translate}} </span></div>',
            }
          ]
        };
        API.findBlockedDomain(row.entity.domain).then(function (result) {
          row.entity.subGridOptions.height = getTableHeight(result.length);
          row.entity.subGridOptions.data = result;
          row.$$height = row.entity.subGridOptions.height;
          $scope.gridOptions.expandableRowHeight = row.entity.subGridOptions.height;
        })
      }

    };

    $scope.blockDomain = function (row) {
      var listType = 'black';
      API.fetchCRSFToken().then(function (token) {
        API.addToList(listType, row.entity.domain, token).then(function (result) {
          $scope.add_result = result;
          $timeout(function(){
            $scope.add_result = false;
          }, 4000)
        });
      });
    };


    $scope.unblockDomain = function (row) {
      var listType = 'white';
      API.fetchCRSFToken().then(function (token) {
        API.addToList(listType, row.entity.domain, token).then(function (result) {
          $scope.add_result = result;
          $timeout(function(){
            $scope.add_result = false;
          }, 4000)
        });
      });
    };

    $scope.langs = i18nService.getAllLangs();
    $scope.lang = $translate.use();
    $scope.gridOptions = {
      rowTemplate: rowTemplate(),
      expandableRowTemplate: 'views/templates/row.html',
      expandableRowHeight: 100,
      paginationPageSizes: [25, 50, 75],
      paginationPageSize: 25,
      flatEntityAccess: true,
      enableFiltering: true,
      exporterMenuCsv: true,
      enableGridMenu: true,
      onRegisterApi: function (gridApi) {
        gridApi.expandable.on.rowExpandedStateChanged($scope, function (row) {

          if (row.isExpanded) {
            gridApi.expandable.collapseAllRows();
            row.isExpanded = true;
          }
          $scope.getdomainInfo(row);
        });
      },
      rowHeight: 38,
      columnDefs: [
        {
          name: 'date',
          displayName: $translate.instant('DATE'),
          cellTemplate: '<div class="ui-grid-cell-contents" title="TOOLTIP">{{COL_FIELD | date: \'dd-MMMM-yyyy HH:mm:ss\'}}</div>',
          cellFilter: 'date',
          sort: {
            direction: uiGridConstants.DESC,
            priority: 0
          }
        },
        {
          name: 'recordType',
          displayName: $translate.instant('TYPE'),
          filter: {
            term: ($routeParams.filterType) ? $routeParams.filterType : ''
          }
        },
        {
          name: 'domain',
          displayName: $translate.instant('DOMAIN'),

          filter: {
            term: ($routeParams.filterDomain) ? $routeParams.filterDomain : ''
          }
        },
        {
          displayName: $translate.instant('CLIENT'),
          field: 'clientIP',
          filter: {
            term: ($routeParams.filterIP) ? $routeParams.filterIP : ''
          }
        },
        {

          name: 'status',
          displayName: $translate.instant('STATUS'),
          cellTemplate: '<div class="ui-grid-cell-contents" title="TOOLTIP">{{COL_FIELD}} <span class="toolkit"><i class="fa fa-ban" ng-click="grid.appScope.blockDomain(row)" ng-show="COL_FIELD !==\'Pi-holed\'" title="{{ \'BLOCK_DOMAIN\' | translate }}"></i><i class="fa fa-check" title="{{ \'UNBLOCK_DOMAIN\' | translate }}" ng-click="grid.appScope.unblockDomain(row)" ng-show="COL_FIELD ===\'Pi-holed\'"></i></span></div>',
          filter: {
            type: uiGridConstants.filter.SELECT,
            selectOptions: [{value: 'Pi-holed', label: 'Pi-holed'}, {value: 'OK', label: 'OK'}]
          }
        }
      ]
    };
    
    $rootScope.$on('languageChanged', function (evt, lang) {
      $scope.lang = $translate.use();
    });

    tableCache();
    $scope.refreshData = function () {
      CacheService.put('queryPage', null);
      tableCache()
    };

  }]);

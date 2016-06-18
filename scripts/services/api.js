'use strict';

/**
 * @ngdoc service
 * @name piholeAdminApp.API
 * @description
 * # API
 * Service in the piholeAdminApp.
 */
angular.module('piholeAdminApp')
  .service('API', ['$http', 'CacheService', function ($http, CacheService) {
    return {
      summaryRaw: function APIsummaryRaw() {
        //return the promise directly.
        return $http.get('api.php?summaryRaw')
          .then(function (result) {
            //resolve the promise as the data
            return result.data;
          });
      },
      summary: function APIsummary() {
        //return the promise directly.
        return $http.get('api.php?summary')
          .then(function (result) {
            //resolve the promise as the data
            return result.data;
          });
      },
      overTimeData: function APIoverTimeData() {
        //return the promise directly.
        return $http.get('api.php?overTimeData')
          .then(function (result) {
            //resolve the promise as the data
            return result.data;
          });
      },
      topItems: function APItopItems() {
        //return the promise directly.
        return $http.get('api.php?topItems')
          .then(function (result) {
            //resolve the promise as the data
            return result.data;
          });
      },
      recentItems: function APIrecentItems() {
        //return the promise directly.
        return $http.get('api.php?recentItems')
          .then(function (result) {
            //resolve the promise as the data
            return result.data;
          });
      },
      getQueryTypes: function APIgetQueryTypes() {
        //return the promise directly.
        return $http.get('api.php?getQueryTypes')
          .then(function (result) {
            //resolve the promise as the data
            return result.data;
          });
      },
      getForwardDestinations: function APIgetForwardDestinations() {
        //return the promise directly.
        return $http.get('api.php?getForwardDestinations')
          .then(function (result) {
            //resolve the promise as the data
            return result.data;
          });
      },
      getQuerySources: function APIgetQuerySources() {
        //return the promise directly.
        return $http.get('api.php?getQuerySources')
          .then(function (result) {
            //resolve the promise as the data
            return result.data;
          });
      },

      getAllQueries: function APIgetAllQueries(asArray) {
        //return the promise directly.
        return $http.get('api.php?getAllQueries')
          .then(function (result) {
            //resolve the promise as the data
            CacheService.put('queries', result.data.data);
            if (asArray) {
              return result.data.data
            } else {
              var rows = [];

              angular.forEach(result.data.data, function (row, k) {
                rows.push({
                  date: row[0],
                  recordType: row[1],
                  domain: row[2],
                  clientIP: row[3],
                  status: row[4]
                })
              });
              return rows;
            }

          });
      },
      rawQuery: function APIrawQuery(q) {
        return $http.get('api.php?' + q)
          .then(function (result) {
            //resolve the promise as the data
            return result.data;
          });
      },
      getList: function (listType) {
        if (listType == 'white' || listType == 'black') {
          return $http.get('php/get.php?list=' + listType)
            .then(function (result) {
              //resolve the promise as the data
              return result.data;
            });
        }
      },
      getStatus: function () {
          return $http.get('api.php?getStatus')
            .then(function (result) {
              //resolve the promise as the data

              return result.data;
            });
      },

      addToList: function (listType, domain, token) {
        if (listType == 'white' || listType == 'black') {
          return $http.post('php/add.php', {
            'domain': domain,
            'list': listType,
            'token': CSRFToken
          }).then(function (result) {
            //resolve the promise as the data
            return result.data;
          });
        }
      },
      removeFromList: function (listType, domain, token) {
        if (listType == 'white' || listType == 'black') {
          return $http.post('php/sub.php', {
            'domain': domain,
            'list': listType,
            'token': token
          }).then(function (result) {
            //resolve the promise as the data
            return result.data;
          });
        }
      },
      /**
       * Quick dirty hack to obtain the token
       */
      fetchCRSFToken: function () {
        return $http.get('api.php?getToken')
          .then(function (result) {
            var token;
            token = result.data.token;
            return token;
          });
      }
    }
  }]);

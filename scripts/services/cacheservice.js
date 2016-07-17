'use strict';

/**
 * @ngdoc service
 * @name piholeAdminApp.CacheService
 * @description
 * # CacheService
 * Service in the piholeAdminApp.
 */
angular.module('piholeAdminApp')
  .service('CacheService',['$cacheFactory',  function ($cacheFactory) {
    var cc = $cacheFactory('cache');
    return {
      'put': function(key, data){
        cc.put(key, data);
      },
      'get': function(key){
        return cc.get(key)
      }
    }
  }]);

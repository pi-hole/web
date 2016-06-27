'use strict';

/**
 * @ngdoc directive
 * @name piholeAdminApp.directive:ngEnter
 * @description
 * # ngEnter
 */
angular.module('piholeAdminApp')
  .directive('ngEnter', function () {
    return {
      link: function (scope, elements, attrs) {
        elements.bind('keydown keypress', function (event) {
          if (event.which === 13) {
            scope.$apply(function () {
              scope.$eval(attrs.ngEnter);
            });
            event.preventDefault();
          }
        });
      }
    };
  });

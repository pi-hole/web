'use strict';

/**
 * @ngdoc directive
 * @name piholeAdminApp.directive:glow
 * @description
 * # glow
 */
angular.module('piholeAdminApp')
  .directive('glow',['$timeout', function ($timeout) {
    return {
      template: '<div></div>',
      restrict: 'EA',
      scope: {
        value: '=',

      },
      link: function postLink(scope, element, attrs) {
        var suffix = attrs.suffix || '';
        var showGlow = function(){
          element.addClass('glow');
          $timeout(function(){
            element.html(scope.value+ suffix);
            element.removeClass("glow");
          },500);
        };
        scope.$watch('value', function (newVal, oldVal) {
          if(!newVal){
            element.html('---')
          }
          if(newVal){
            showGlow()
          }
          if(newVal != oldVal){
            showGlow()
          }
        });
      }
    };
  }]);

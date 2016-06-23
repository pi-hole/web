'use strict';

/**
 * @ngdoc directive
 * @name piholeAdminApp.directive:glow
 * @description
 * # glow
 */
angular.module('piholeAdminApp')
  .directive('temp',[function () {
    return {
      template: '<div></div>',
      restrict: 'EA',
      scope: {
        temp: '='
      },
      link: function postLink(scope, element, attrs) {
        var displayStatus = function(){
            if(scope.temp < 45){
              element.html('<i class="fa fa-circle" style="color:#3366FF"></i> '+  scope.temp)
            } else {
              element.html('<i class="fa fa-circle" style="color:#FF0000"></i> '+  scope.temp)
            }
        };
        scope.$watch('temp', function (newVal, oldVal) {
          displayStatus()
        });
      }
    };
  }]);

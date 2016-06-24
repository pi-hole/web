'use strict';

/**
 * @ngdoc directive
 * @name piholeAdminApp.directive:glow
 * @description
 * # glow
 */
angular.module('piholeAdminApp')
  .directive('status',[function () {
    return {
      template: '<div></div>',
      restrict: 'EA',
      scope: {
        status: '='
      },
      link: function postLink(scope, element, attrs) {
        var displayStatus = function(){
            if(scope.status == '1'){
              element.html('<i class="fa fa-circle" style="color:#7FFF00"></i> Active')
            } else {
              element.html('<i class="fa fa-circle" style="color:#FF0000"></i> Offline')
            }
        };
        scope.$watch('status', function (newVal, oldVal) {
          displayStatus()
        });
      }
    };
  }]);

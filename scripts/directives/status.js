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
      template: '<i ng-if="!ssstatus" class="fa fa-circle" style="color:#FF0000"></i><i  ng-if="ssstatus" class="fa fa-circle" style="color:#7FFF00"></i> {{ ssstatus ? \'ACTIVE\' : \'OFFLINE\' | translate}}',
      restrict: 'EA',
      scope: {
        status: '='
      },
      link: function postLink(scope, element, attrs) {
        var displayStatus = function(){
            if(scope.status == '1'){
              scope.ssstatus = true;
              //element.html('<i class="fa fa-circle" style="color:#7FFF00"></i> {{\'ACTIVE\' | translate}})')
            } else {
              scope.ssstatus = false;
           //   element.html('<i class="fa fa-circle" style="color:#FF0000"></i> Offline')
            }
        };
        scope.$watch('status', function (newVal, oldVal) {
          displayStatus()
        });
      }
    };
  }]);

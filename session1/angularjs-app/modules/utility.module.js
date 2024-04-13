(function (angular) {
  angular.module('appUtility', [])
    .provider('momentProvider', function() {
      this.$get = function() {
        return moment();
      }
    })
    .service('utility', function($interval) {
      console.count('init ::: utility');
  
      this.computed = function(name, ref, fn, $scope) {
        $scope[name] = angular.copy($scope[ref]);
  
        $scope.$watch(ref, function(newVal, _oldVal) {
          $scope[name] = fn ? fn(newVal) : newVal;
        });
      }
  
      this.interval = function (scope, handler, ms=1000) {
        const id = $interval(handler, ms);
  
        scope.$on('$destroy', function() {
          $interval.cancel(id);
        });
      };
  
      this.id = function ($scope) {
        return _.uniqueId(`id_${Date.now()}`);
      }
  
      this.formFocus = function(ref='') {
        const refs = ref.split('.');
        const target = refs.reduce((a, c) => a?.[c] ?? null, window);
        if (target) {
          setTimeout(() => {
            target.focus();
          });
        }
      }
  
      this.formValidate = function($scope, ref='') {
        const refs = ref.split('.');
        const form = $scope[refs[0]] ?? null;
        const target = refs.reduce((a, c) => a?.[c] ?? null, $scope);
  
        if (!(form && target)) return;
  
        form.$pristine
          && angular.forEach(form.$error, function (controls) {
            angular.forEach(controls, function (control) {
              control.$setDirty();
            });
          });
      }
  
      this.formReset = function($scope, ref='') {
        const refs = ref.split('.');
        const form = $scope[refs[0]] ?? null;
  
        form.$setPristine();
        form.$setUntouched();
      }
    });
})(window.angular);

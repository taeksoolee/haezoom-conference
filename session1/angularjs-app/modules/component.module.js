(function (angular) {
  angular.module('appComponent', ['ngAnimate', 'appStyle'])
    .component('backButton', {
      template: `
        <button ng-click="handleClick()">
          &lt;
        </button>
      `,
      controller($scope) {
        $scope.handleClick = function() {
          navigation.back();
        }
      }
    })
    .run(function($rootScope) {
      $rootScope.$on('$routeChangeStart', function(event, next, current) {
          
      });
    })
    .component('floatingTitle', {
      transclude: true,
      template: `
        <div ng-show="opened" ng-transclude style="position: fixed; right: 0; bottom: 0; padding: 20px; 40px;" class="show-hide">
        </div>
      `,
      controller($scope, $timeout, $log) {
        

        $scope.opened = false;

        $timeout(() => {
          const h1 = document.querySelector('h1');
          if (!h1) {
            $log.warn('floatingTitle required h1 tag');
            return;
          }
          const observer = new IntersectionObserver((entries) => {
            entries.forEach(function(entry) {
              if (!entry.isIntersecting) {
                console.log(entry);
                $scope.opened = true;
              } else {
                $scope.opened = false;
              }
            });
          });
  
          console.log(h1);
          observer.observe(h1);
          $scope.$on('$destroy', function() {
            observer.unobserve(h1);
          });
        }, 1000);
      }
    })
    // test counter
    .component('counter', {
      template: `
      <div>
        <h2>Count App</h2>
        <div>{{ count | mask:5 }}</div>
        <button ng-click="increase($event)">+</button>
      </div>
      `,
      controller($scope, $log) {
        console.count('CountCtrl');
        $scope.count = 0;
    
        $scope.increase = function(_e) {
          $scope.count++;
        }
      },
    })
})(window.angular);
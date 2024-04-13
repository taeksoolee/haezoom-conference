import './auth.module.js';
import './utility.module.js';

angular.module('appLayout', ['appAuth', 'appUtility'])
  .component('loadingWrapper', {
    transclude: true,
    bindings: {
      loading: '=',
    },
    template: `
      <div ng-if="$ctrl.loading">
        Loading...
      </div> 
      <div ng-if="!$ctrl.loading" ng-transclude></div>
    `,
  })
  .component('notfoundWrapper', {
    transclude: true,
    bindings: {
      notfound: '=',
    },
    template: `
      <div ng-if="$ctrl.notfound">
        <h1>NotFound</h1>
      </div> 
      <div ng-if="!$ctrl.notfound" ng-transclude></div>
    `,
  })
  .component('authWrapper', {
    transclude: true,
    bindings: {
      inited: '=',
      signed: '='
    },
    controller($scope, utility, auth) {
      $scope.loginFormAlert = '';
      const initLoginForm = () => {
        $scope.loginFormData = {
          email: '',
          password: '',
        };
      }
  
      initLoginForm();

      $scope.login = function() {
        $scope.loginFormAlert = '';
  
        utility.formValidate($scope, 'loginForm');
        if ($scope.loginForm.$invalid) return;
        
        auth.sign(Object.fromEntries([...new FormData(window.loginForm).entries()]), {
          success() {
            initLoginForm();
            utility.formReset($scope, 'loginForm');
          },
          failed(err) {
            $scope.loginFormAlert = err.message;
          }
        });
      }
    },
    template: `
      <div>
        <div ng-show="$ctrl.inited && !$ctrl.signed" style="display: flex; justify-content: center;">
          <div style="width: 200px;">
            <h3>Login</h3>
            <form name="loginForm" ng-submit="login()" novalidate>
              <div class="input-group">
                <label for="loginForm__email">email</label>
                <input name="email" id="loginForm__email" ng-model="loginFormData.email" required ng-class="{error: loginForm.email.$dirty && loginForm.email.$invalid}" />
                <p ng-show="loginForm.email.$dirty && loginForm.email.$invalid" class="error" aria-describedby="loginForm__email">Required</p>
              </div>
              <div class="input-group">
                <label for="loginForm__password">password</label>
                <input name="password" id="loginForm__password" ng-model="loginFormData.password" required ng-class="{error: loginForm.password.$dirty && loginForm.password.$invalid}" type="password" />
                <p ng-show="loginForm.password.$dirty && loginForm.password.$invalid" class="error" aria-describedby="loginForm__username">Required</p>
              </div>

              <div ng-show="loginFormAlert" role="alert" class="error">
                {{ loginFormAlert }}
              </div>

              <button type="submit">Login</button>
            </form>
          </div>
        </div>
        <div ng-if="$ctrl.signed" ng-transclude></div>
      </div>
      `
  });
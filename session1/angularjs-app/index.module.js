// index.module.js
const app = angular.module('App', ['ngRoute'])
  .constant('config', {
    API_ORIGIN: 'https://apidev.vpphaezoom.com',
    ACCESS_KEY: '__access',
    REFRESH_KEY: '__refresh',
  })
  .config(function($routeProvider) {
    $routeProvider
      .when('/resource-list', { 
        templateUrl: './templates/resource-list.htm', 
        controller: 'ResourceListCtrl'
      })
      .when('/resource-detail/:id', { 
        templateUrl: './templates/resource-detail.htm', 
        controller: 'ResourceDetailCtrl'
      })
      .otherwise({
        redirectTo: '/'
      });
  })
  .run(function($http, $s, $signmanager) {
    console.count('run');
    const {access, refresh} = $signmanager.tokens;
    if (access) {
      $http.defaults.headers.common.Authorization = `Bearer ${access}`;
      $s.next({
        type: 'sign',
      });
    } else {
      $s.next({
        type: 'unsign',
      });
    }
  })
  .filter('mask', function() {
    return (input, len=4) => isNaN(Number(input)) ? '-' : String(input).slice(0, len).padStart(len, '0');
  })
  .filter('falsy', function() {
    return (input, replace='-') => {
      return input || null === null ? replace : input;
    }
  })
  .provider('$s', function() {
    console.count('init ::: $s');
    this.$get = function() {
      return new rxjs.Subject();
    };
  })
  .factory('$id', function() {
    return function() {
      return _.uniqueId(`id_${Date.now()}`);
    }
  })
  .service('$u', function() {
    console.count('init ::: $u');
    this.computed = function(name, ref, fn, $scope) {
      $scope[name] = angular.copy($scope[ref]);

      $scope.$watch(ref, function(newVal, _oldVal) {
        $scope[name] = fn ? fn(newVal) : newVal;
      });
    }
  })
  .service('$form', function() {
    console.count('init ::: $form');
    this.focus = function(ref='') {
      const refs = ref.split('.');
      const target = refs.reduce((a, c) => a?.[c] ?? null, window);
      if (target) {
        setTimeout(() => {
          target.focus();
        });
      }
    }

    this.validate = function($scope, ref='') {
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

    this.reset = function($scope, ref='') {
      const refs = ref.split('.');
      const form = $scope[refs[0]] ?? null;

      form.$setPristine();
      form.$setUntouched();
    }
  })
  .provider('$signmanager', function(config) {
    console.count('init ::: $signmanager');

    this.$get = function() {
      return new (class SignManager {
        get access() {
          return localStorage.getItem(config.ACCESS_KEY) ?? null;
        }        

        setAccess(token) {
          localStorage.setItem(config.ACCESS_KEY, token);
        }

        removeAccess() {
          localStorage.removeItem(config.ACCESS_KEY);
        }

        get refresh() {
          return localStorage.getItem(config.REFRESH_KEY) ?? null;
        }

        setRefresh(token) {
          return localStorage.setItem(config.REFRESH_KEY, token);
        }

        removeRefresh() {
          localStorage.removeItem(config.REFRESH_KEY);
        }
        
        get tokens() {
          return {
            access: this.access,
            refresh: this.refresh,
          }
        }

        set({access, refresh}) {
          this.setAccess(access);
          this.setRefresh(refresh);
        }
      })();
    }
  })
  .controller('MainCtrl', function($scope) {
    $scope.title = 'Hello World';
  })
  .controller('CountCtrl', function($scope, $s) {
    console.count('CountCtrl');
    $scope.count = 0;

    $scope.increase = function(_e) {
      $scope.count++;

      $s.next({
        ctrl: 'CountCtrl',
        data: {
          cur: $scope.count,
        }
      });
    }
  })
  .service('todo', function ($id) {
    const S_TODOS = Symbol('todos');
    this[S_TODOS] = [];

    this.findAll = function() {
      return this[S_TODOS];
    }

    this.getDefaultTodoFormData = function() {
      return {
        title: '',
        description: '',
      }
    }

    this.delete = function(id) {
      const idx = this[S_TODOS].findIndex((e) => e.id === id);
      this[S_TODOS].splice(idx, 1);
    }

    this.create = function(newTodo) {
      this[S_TODOS].push({
        ...newTodo,
        id: $id(),
        checked: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      })
    }
  })
  .controller('TodoCtrl', function($scope, todo, $u, $s, $form) {
    $scope.newTodo = null;
    $scope.todos = todo.findAll();

    $scope.openTodoForm = function() {
      $scope.newTodo = todo.getDefaultTodoFormData();
      
      $form.focus('addTodoForm.title');
    }

    $scope.closeTodoForm = function() {
      $scope.newTodo = null;

      $form.reset($scope, 'addTodoForm');
    }

    $scope.addTodo = function() {
      $form.validate($scope, 'addTodoForm');
      if ($scope.addTodoForm.$invalid) return;

      todo.create($scope.newTodo);
      $scope.closeTodoForm();
    }

    $scope.delTodo = function(id) {
      todo.delete(id);
    }

    $u.computed('shownForm', 'newTodo', (newVal) => !!newVal, $scope);

    $s.subscribe((data) => {
      console.log(data);
    })
  })
  .controller('AuthCtrl', function($scope, $form, $http, config, $signmanager, $signmanager, $u) {
    $scope.shown = true;
    if ($signmanager.access) {
      $scope.shown = false;
    }

    $scope.loginFormAlert = '';
    $scope.loginFormData = {
      email: '',
      password: '',
    }

    $scope.login = function() {
      $scope.loginFormAlert = '';

      $form.validate($scope, 'loginForm');
      if ($scope.loginForm.$invalid) return;

      console.log('login start');

      $http({
        url: `${config.API_ORIGIN}/api/user/token/`,
        method: 'POST',
        data: Object.fromEntries([...new FormData(window.loginForm).entries()]),
      })
        .then(
          function success(res) {
            const {
              access, refresh,
            } = res.data;

            $signmanager.setAccess(access);
            $signmanager.setRefresh(refresh);
          },
          function failed(err) {
            $scope.loginFormAlert = err.data.message;
          }
        )

      // $request.sign(Object.fromEntries([...new FormData(window.loginForm).entries()]));
      // $request.signin(new FormData(window.loginForm))
    }
  })
  .service('resource', function($http, config, $q) {
    this.findAll = function() {
      return $q(function(resolve, reject) {
        $http({
          method: 'GET',
          url: `${config.API_ORIGIN}/api/resource/`
        })
          .then(
            function success(res) {
              resolve(res.data.results);
            },
            function failed(res) {
              reject(res.data);
            }
          );
      });
    }

    this.findById = function(id) {
      return $q(function(resolve, reject) {
        $http({
          method: 'GET',
          url: `${config.API_ORIGIN}/api/resource/${id}`
        })
          .then(
            function success(res) {
              resolve(res.data);
            },
            function failed(res) {
              reject(res.data);
            }
          );
      })
    }
  })
  .controller('ResourceCtrl', function($scope, resource, $signmanager) {
  })
  .controller('ResourceListCtrl', function($scope, resource, $signmanager, $routeParams, $u) {
    const page = Number(Number($routeParams.page) || '1');
    console.log(page);
    console.count('init ::: ResourceListCtrl');
    $scope.resources = [];

    if ($signmanager.access) {
      resource.findAll()
          .then(
            function(data) {
              if (Array.isArray(data)) {
                data.forEach(resource => {
                  $scope.resources.push(resource);
                })
              }
            }
          );
    } else {

    }
  })
  .controller('ResourceDetailCtrl', function($scope, resource, $signmanager, $routeParams) {
    console.count('init ::: ResourceDetailCtrl');
    const id = $routeParams.id;
    console.log(id);
    $scope.resource = null;
    if ($signmanager.access) {
      resource.findById(id)
        .then(
          function success(data) {
            $scope.resource = data;
          },
          function failed(err) {
            console.log(err);
          }
        );
    } else {

    }
  })
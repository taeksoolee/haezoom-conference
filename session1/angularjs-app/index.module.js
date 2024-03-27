// index.module.js
const app = angular.module('App', ['ngRoute'])
  .constant('config', {
    API_ORIGIN: 'https://apidev.vpphaezoom.com',
    ACCESS_KEY: '__access',
    REFRESH_KEY: '__refresh',
  })
  .config(function($routeProvider) {
    console.count('init ::: config');
    $routeProvider
      .when('/', { 
        templateUrl: './templates/home.htm',
      })
      .when('/resource', { 
        templateUrl: './templates/resource-list.htm', 
        controller: 'ResourceListCtrl'
      })
      .when('/resource/detail/:id', { 
        templateUrl: './templates/resource-detail.htm', 
        controller: 'ResourceDetailCtrl'
      })
      .when('/resource/goruping', {
        templateUrl: './templates/grouping.htm',
        controller: 'GroupingCtrl',
      })
      .otherwise({
        redirectTo: '/'
      });
  })
  .run(function($rootScope, $http, $s, $signmanager, config, $q) {
    console.count('init ::: run');

    $rootScope.metadata = null;

    $rootScope.signed = false;
    if ($signmanager.isSigned) {
      $http.defaults.headers.common.Authorization = `Bearer ${$signmanager.access}`;
      $rootScope.signed = true;
    }

    $s.subscribe({
      next ({ action, payload }) {
        if (action === 'sign') {
          $signmanager.sign(payload);
          $http.defaults.headers.common.Authorization = `Bearer ${$signmanager.access}`;
          $rootScope.signed = true;

          $http.get(`${config.API_ORIGIN}/api/list/monitoring/`).then(
            function success(res) {
              console.log(res.data);
            },
            function failed(err) {
              console.log(err);
            }
          )

        } else if (action === 'unsign') {
          $signmanager.unsign();
          $http.defaults.headers.common.Authorization = undefined;
          $rootScope.signed = false;
          $rootScope.metadata = null;
        }
      },
    });
  })
  .filter('mask', function() {
    return (input, len=4) => isNaN(Number(input)) ? '-' : String(input).slice(0, len).padStart(len, '0');
  })
  .filter('falsy', function() {
    return (input, replace='-') => {
      return input || null === null ? replace : input;
    }
  })
  .filter('nullish', function() {
    return (input, replace='-') => {
      return input ?? null === null ? replace : input;
    }
  })
  .provider('$s', function() {
    console.count('init ::: provider ::: $s');
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
    console.count('init ::: provider ::: $signmanager');

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

        sign({access, refresh}) {
          this.setAccess(access);
          this.setRefresh(refresh);
        }

        unsign() {
          this.removeAccess();
          this.removeRefresh();
        }

        get isSigned() {
          return !!this.access;
        }

        get info() {
          if (this.access === null) return null;
          return KJUR.jws.JWS.parse(this.access)?.payloadObj;
        }

        get refreshInfo() {
          if (this.refresh === null) return null;
          return KJUR.jws.JWS.parse(this.refresh)?.payloadObj;
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
  .controller('AuthCtrl', function($scope, $form, $http, config, $s) {
    $scope.loginFormAlert = '';
    $scope.loginFormData = {
      email: '',
      password: '',
    };

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

            $scope.loginFormAlert = '';
            $scope.loginFormData = {
              email: '',
              password: '',
            };
            $form.reset($scope, 'loginForm');

            $s.next({
              action: 'sign',
              payload: { access, refresh },
            });
          },
          function failed(err) {
            $scope.loginFormAlert = err.data.message;
          }
        )
    }

    $scope.logout = function() {
      $s.next({
        action: 'unsign',
      });
    }
  })
  .service('resource', function($http, config, $q) {
    this.findAll = function() {
      return $q(function(resolve, reject) {
        $http({
          method: 'GET',
          url: `${config.API_ORIGIN}/api/resource/`,
          cache: true,
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
  .controller('ResourceCtrl', function($scope, resource) {
  })
  .controller('ResourceListCtrl', function($scope, resource, $signmanager, $routeParams) {
    console.count('init ::: ResourceListCtrl');
    const page = Number(Number($routeParams.page) || '1');
    const pageSize = 5;
    $scope.resources = [];

    $scope.data = {
      list: [],
      pager: [],
      cur: page,
    }

    $scope.loading = false;

    $scope.$watch('resources', function(newVal) {
      $scope.data.list = newVal.slice(page, page+pageSize);
      $scope.data.pager = Array.from({length: Math.ceil(newVal.length / pageSize)}).map((_, i) => i+1);
    });

    if ($signmanager.access) {
      $scope.loading = true;
      resource.findAll()
          .then(
            function(data) {
              $scope.resources = data;
              $scope.loading = false;
              // if (Array.isArray(data)) {
              //   data.forEach(resource => {
              //     $scope.resources.push(resource);
              //   })
              // }
            }
          );
    } else {

    }
  })
  .controller('ResourceDetailCtrl', function($scope, resource, $signmanager, $routeParams) {
    console.count('init ::: ResourceDetailCtrl');
    const id = $routeParams.id;
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
  .controller('GroupingCtrl', function($q, $http, config) {
    $q.all([
      $http.get(`${config.API_ORIGIN}/api/list/monitoring/`),
      $http.get(`${config.API_ORIGIN}/api/list/control/`),
    ]).then(
        function success(res) {
          console.log(res.data);
        },
      )
      .catch(function(err) {
        console.log(err);
      });
  })
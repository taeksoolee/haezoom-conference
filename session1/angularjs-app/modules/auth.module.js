(function (angular) {
  angular.module('appAuth', ['ngCookies', 'appRepository', 'appConfig'])
    .constant('_AuthLocalStorageKeys', {
      REFRESH_KEY: '__refresh',
    })
    .provider('_signProvider$', function() {
      console.count('init ::: provider ::: rxSubject');
      this.$get = function() {
        return new rxjs.Subject();
      };
    })
    .config(function($cookiesProvider) {
      $cookiesProvider.defaults.secure = true;
    })
    .factory('$exceptionHandler', function($log) {
      return function myExceptionHandler(exception, cause) {
        $log.warn(exception, cause);
      };
    })
    .config(function($httpProvider) {
      $httpProvider.interceptors.push(function($rootScope, _signmanagerProvider, $q) {
        return {
          responseError(response) {
            if (response.status === 401) {
              _signmanagerProvider.unsign();
              $httpProvider.defaults.headers.common.Authorization = undefined;
              $rootScope.signed = false;
              $rootScope.user = null;
              $rootScope.metadata = null;
            }
  
            return $q.reject(response);
          }
        };
      });
    })
    .service('_signmanager', function($http, _signmanagerProvider, $rootScope, meta, $cookies, config) {
      const init = function() {
        $rootScope.initedSignmanager = true;
        $rootScope.signed = false;
        $rootScope.user = null;
      }
  
      const sign = function() {
        $rootScope.initedSignmanager = false;
        $http({
          url: `${config.API_ORIGIN}/api/user/token/refresh/`,
          method: 'POST',
          data: {
            refresh: _signmanagerProvider.refresh
          }
        })
          .then(
            function success(res) {
              const access = res.data.access;
              $http.defaults.headers.common.Authorization = `Bearer ${access}`;
              $cookies.remove('X-Authorization');
              $cookies.put('X-Authorization', `Bearer ${access}`);
              $rootScope.signed = true;
              $rootScope.user = _signmanagerProvider.getInfo(access);
              meta.loadList();
              $rootScope.initedSignmanager = true;
            },
            function failed() {
              $rootScope.initedSignmanager = true;
            }
          );

      }
  
      const unsign = function() {
        _signmanagerProvider.unsign();
        $http.defaults.headers.common.Authorization = undefined;
        $cookies.remove('X-Authorization');
        $rootScope.signed = false;
        $rootScope.user = null;
        $rootScope.metadata = null;
      }
  
      this.init = function() {
        init();
  
        if (_signmanagerProvider.isSigned) {
          sign();
        }
      }
  
      this.isSigned = function() {
        return _signmanagerProvider.isSigned;
      }
  
      this.sign = function(payload) {
        _signmanagerProvider.sign(payload);
        sign();
      }
  
      this.unsign = function() {
        unsign();
      }
    })
    .provider('_signmanagerProvider', function(_AuthLocalStorageKeys) {
      console.count('init ::: provider ::: _signmanagerProvider');
  
      this.$get = function() {
        return new (class SignManager {
          _access = null;

          get access() {
            return this._access;
          }
  
          setAccess(token) {
            this._access = token;
          }
  
          removeAccess() {
            this._access = null;
          }
  
          get refresh() {
            return localStorage.getItem(_AuthLocalStorageKeys.REFRESH_KEY) ?? null;
          }
  
          setRefresh(token) {
            localStorage.setItem(_AuthLocalStorageKeys.REFRESH_KEY, token);
          }
  
          removeRefresh() {
            localStorage.removeItem(_AuthLocalStorageKeys.REFRESH_KEY);
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
            return !!this.refresh;
          }
  
          getInfo(access) {
            if (access === null) return null;
            return KJUR.jws.JWS.parse(access)?.payloadObj;
          }
  
          get refreshInfo() {
            if (this.refresh === null) return null;
            return KJUR.jws.JWS.parse(this.refresh)?.payloadObj;
          }
        })();
      }
    })
    .run(function(_signProvider$, _signmanager, _AuthLocalStorageKeys) {
      console.count('init ::: auth run');
  
      _signmanager.init();
  
      _signProvider$.subscribe({
        next ({ action, payload }) {
          if (action === 'sign') {
            _signmanager.sign(payload);
          } else if (action === 'unsign') {
            _signmanager.unsign();
            
          }
        },
      });
    })
    .service('auth', function($q, _signProvider$, tokens) {
      this.sign = function(data, handler) {
        const deferred = $q.defer;
  
        tokens.get(data)
          .then(
            function success(res) {
              const {
                access, refresh,
              } = res;
  
              typeof handler?.success === 'function' && handler.success({ access, refresh });
              
              _signProvider$.next({
                action: 'sign',
                payload: { access, refresh },
              });
  
              deferred.resolve(true);
            },
            function failed(err) {
              typeof handler?.failed === 'function' && handler.failed(err);
              deferred.reject(false);
            },
          )
  
        return deferred.promise;
      }
  
      this.unsign = function() {
        _signProvider$.next({
          action: 'unsign',
        });
      }
    });
})(window.angular);

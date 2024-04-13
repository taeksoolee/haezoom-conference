(function (angular) {
  angular.module('appRepository', ['appConfig'])
  .service('_repositoryService', function($q, $http, config) {
    this.http = function(request, getter) {
      const defered = $q.defer();

      request.url = config.API_ORIGIN + request.url;

      $http(request).then(
        function success(res) {
          if (typeof getter === 'function') {
            defered.resolve(getter(res.data));
          } else {
            defered.resolve(res.data);
          }
        },
        function failed(res) {
          defered.reject(res.data);
        },
      );
      
      return defered.promise;
    }
  })
  .service('meta', function($rootScope, $q, $http, config) {
    $rootScope.metadata = null;
    this.loadList = function () {
      $q.all([
        $http.get(`${config.API_ORIGIN}/api/list/monitoring/`),
        $http.get(`${config.API_ORIGIN}/api/list/control/`),
        $http.get(`${config.API_ORIGIN}/api/list/substation/`),
        $http.get(`${config.API_ORIGIN}/api/list/dl/`),
      ])
        .then(
          function success([monitoring, control, substation, dl]) {
            $rootScope.metadata = {
              monitoring: {
                company: monitoring.data,
              },
              control: {
                company: control.data.company,
                type: control.data.control_type,
              },
              infra: {
                substation: substation.data,
                dl: dl.data,
              }
            }
          },
        )
    }
  })
  .service('tokens', function(_repositoryService) {
    // auth
    this.get = function(data) {
      return _repositoryService.http({
        method: 'POST',
        url: `/api/user/token/`,
        data,
      }, (res) => {
        const {access, refresh} = res;
        return {access, refresh};
      });
    }
  })
  .service('resource', function(_repositoryService) {
    this.findAll = function() {
      return _repositoryService.http({
        method: 'GET',
        url: `/api/resource/`,
        cache: true,
      }, (res) => res.results);
    }

    this.findById = function(id) {
      return _repositoryService.http({
        method: 'GET',
        url: `/api/resource/${id}`,
        cache: true,
      });
    }
  })
  .service('group', function(_repositoryService) {
    this.findAll = function() {
      return _repositoryService.http({
        method: 'GET',
        url: `/api/group/total/`,
        cache: true,
      });
    }

    this.findById = function(id) {
      return _repositoryService.http({
        method: 'GET',
        url: `/api/group/${id}/`,
      });
    }

    this.findResourcesById = function(id, date) {
      return _repositoryService.http({
        method: 'GET',
        url: `/api/group/${id}/resource/?date=${date ?? dayjs().format('YYYY-MM-DD')}`,
        cache: true,
      });
    }
  })
  .service('realtime', function(_repositoryService) {
    this.biddingSubmitState = function (groupId, bidAt, hour) {
      return _repositoryService.http({
        method: 'GET',
        url: `/api/group/${groupId}/bidding/realtime/submit-state/?bid_at=${bidAt}&hour=${hour}`
      }, (res) => {
        if (res) {
          const { is_manual, submit_at, submit_state, is_kpx_submit } = res;
          
          if (is_kpx_submit) {
            res.state = 'kpx_bid_success';
          } else if (!is_manual && !!submit_state) {
            res.state = 'auto_bid_success';
          } else if (!!is_manual && !!submit_state) {
            res.state = 'manual_bid_success';
          } else if (submit_at && !submit_state) {
            res.state = 'bid_failed';
          }

          return res;
        } else {
          return {
            state: 'pre_bid',
          };
        }
      });
    }
  })
  .service('dayahead', function(_repositoryService) {
    this.biddingSubmitState = function (groupId, bidAt, hour) {
      return _repositoryService.http({
        method: 'GET',
        url: `/api/group/${groupId}/bidding/dayahead/submit-state/?bid_at=${bidAt}&hour=${hour}`
      }, (res) => {
        if (res) {
          const { is_manual, submit_at, submit_state, is_kpx_submit } = res;
          
          if (is_kpx_submit) {
            res.state = 'kpx_bid_success';
          } else if (!is_manual && !!submit_state) {
            res.state = 'auto_bid_success';
          } else if (!!is_manual && !!submit_state) {
            res.state = 'manual_bid_success';
          } else if (submit_at && !submit_state) {
            res.state = 'bid_failed';
          }

          return res;
        } else {
          return {
            state: 'pre_bid',
          };
        }
      });

    }

    this.bidding = function(groupId, bidAt, isAlgorithm=true) {
      return _repositoryService.http({
        method: 'GET',
        url: `/api/group/${groupId}/resource/bidding/dayahead/?bid_at=${bidAt}&is_algorithm=${isAlgorithm}`
      })
    }
  });
})(window.angular);
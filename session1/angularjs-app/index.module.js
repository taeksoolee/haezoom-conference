import './modules/config.module.js';
import './modules/filter.module.js';
import './modules/utility.module.js';
import './modules/repository.module.js';
import './modules/layout.module.js';
import './modules/component.module.js';
import './modules/socket.module.js';
import './modules/style.module.js';

(function (angular) {
  angular.module('app', [
    'ngRoute',
    'appConfig',
    'appFilter', 
    'appUtility', 
    'appRepository',
    'appSocket',
    'appLayout',
    'appStyle',
    'appComponent',
  ])
    .config(function($routeProvider) {
      $routeProvider
        .when('/', { 
          templateUrl: './templates/home.htm',
        })
        .when('/group', { 
          templateUrl: './templates/group/index.htm', 
          controller: 'GroupCtrl'
        })
        .when('/group/detail/:id', { 
          templateUrl: './templates/group/detail.htm', 
          controller: 'GroupDetailCtrl'
        })
        .when('/group/bidding/detail/:id', { 
          templateUrl: './templates/group/bidding/detail.htm', 
          controller: 'GroupBiddingDetailCtrl'
        })
        .when('/group/bidding/detail/:id/dayahead', { 
          templateUrl: './templates/group/bidding/dayahead/index.htm', 
          controller: 'GroupBiddingDetailDayaheadCtrl'
        })
        .when('/group/bidding/detail/:id/realtime', { 
          templateUrl: './templates/group/bidding/realtime/index.htm', 
          controller: 'GroupBiddingDetailRealtimeCtrl'
        })
        .when('/group/monitoring/detail/:id', { 
          templateUrl: './templates/group/monitoring/detail.htm', 
          controller: 'GroupMonitoringDetailCtrl'
        })
        .when('/resource', { 
          templateUrl: './templates/resource/index.htm', 
          controller: 'ResourceCtrl'
        })
        .when('/resource/detail/:id', { 
          templateUrl: './templates/resource/detail.htm', 
          controller: 'ResourceDetailCtrl'
        })
        .when('/resource/monitoring/detail/:id', { 
          templateUrl: './templates/resource/monitoring/detail.htm', 
          controller: 'ResourceMonitoringDetailCtrl'
        })
        .when('/resource/goruping', {
          templateUrl: './templates/resource/grouping.htm',
          controller: 'ResourceGroupingCtrl',
        })
        .otherwise({
          redirectTo: '/'
        });
    })
    .controller('MainCtrl', function($rootScope, $scope, auth, utility) {
      $scope.title = 'Hello World';
  
      $scope.logout = function() {
        auth.unsign();
      }
  
      utility.interval($scope, function() {
        $rootScope.now = Date.now();
      }, 500);
    })
    .controller('GroupCtrl', function($scope, $q, $log, group, meter) {
      $scope.loading = true;
      $scope.state = {
        groups: null,
      }
  
      group.findAll()
        .then(
          function(groups) {

            $q.all(groups.map(e => group.findResourcesById(e.id)))
              .then(
                function success(resourcesList) {
                  resourcesList.forEach((resources, i) => {
                    groups[i].resourceCnt = resources.length;
                  });

                  $scope.loading = false;
                  $scope.state = {
                    groups,
                  }

                },
                function failed(err) {
                  throw Error('Request Failed');
                }
              )

            
          }
        );

      meter.connect(function(data) {
        if ($scope.state.groups) {
          $scope.state = {
            groups: $scope.state.groups.map(e => ({
              ...e,
              enableMonitoring: !!data.monitoring.group[e.id],
            }))
          }
          
        }
      });

      $scope.$on('$destroy', function() {
        meter.disconnect();
      });
    })
    .controller('GroupDetailCtrl', function($scope, $routeParams, $q, group, meter) {
      const { id } = $routeParams;

      $scope.loading = true;
      $scope.notfound = false;
      $scope.state = {
        groupInfo: null,
        resources: [],
      }

      $scope.isMW = false;
      
      $q.all([
        group.findById(id),
        group.findResourcesById(id),
      ]).then(
        function success([groupInfo, resources]) {
          $scope.loading = false;

          const groupCapacity = resources.reduce((a, c) => a+Number(c.infra.capacity), 0);
  
          $scope.state = {
            groupInfo,
            resources: resources.map(e => ({
              ...e,
              rate: Math.round(Number(e.infra.capacity) / groupCapacity * 100 * 1000) / 1000 // 가중치
            })),
            groupCapacity,
          };
        },
        function failed() {
          $scope.notfound = true;
        }
      );

      meter.connect(function(data) {
        if ($scope.state.resources) {
          $scope.state = {
            ...$scope.state,
            resources: $scope.state.resources.map(e => ({
              ...e,
              enableMonitoring: !!data.monitoring.resource[e.id],
            }))
          }
        }
      });

      $scope.$on('$destroy', function() {
        meter.disconnect();
      });
    })
    .controller('GroupBiddingDetailCtrl', function($scope, $routeParams, $q, group, dayahead, realtime, meter, utility) {
      const { id } = $routeParams;
      $scope.id = id;
  
      $scope.loading = true;
      $scope.notfound = false;
      $scope.state = {
        groupInfo: null,
        realtime: {
          biddingSubmit: null,
        }
      }
      
      $q.all([
        group.findById(id),
        realtime.biddingSubmitState(
          id,
          dayjs().format('YYYY-MM-DD'),
          dayjs().format('H'),
        ),
        dayahead.biddingSubmitState(
          id,
          dayjs().format('YYYY-MM-DD'),
          dayjs().format('H'),
        ),
      ]).then(
        function success([groupInfo, rtBiddingSubmit, daBiddingSubmit]) {
          $scope.loading = false;
  
          $scope.state = {
            groupInfo,
            realtime: {
              biddingSubmit: rtBiddingSubmit,
            },
            dayahead: {
              biddingSubmit: daBiddingSubmit,
            },
          };
        },
        function failed() {
          $scope.notfound = true;
        }
      );
  
      utility.interval($scope, function() {
        realtime.biddingSubmitState(
          id,
          dayjs().format('YYYY-MM-DD'),
          dayjs().format('H'),
        ).then(function success(biddingState) {
          $scope.state = {
            ...$scope.state,
            realtime: {
              ...$scope.state.realtime,
              biddingState,
            },
            dayahead: {
              ...$scope.state.dayahead,
            },
          };
        })
      }, 1000 * 60);
    })
    .controller('GroupBiddingDetailDayaheadCtrl', function($scope, $routeParams, $q, $log, group, dayahead, realtime, meter, utility) {
      console.log('!!');
      group.findAll()
        .then(
          function(groups) {
            $log.debug(groups);
            dayahead.bidding(
              groups[0].id,
              '2024-03-29',
              true,
            )
              .then(
                function(res) {
                  $log.debug(res);
                }
              )
          }
        );
  
      utility.interval($scope, () => {
        console.log('BiddingDayaheadCtrl');
      }, 3000);
    })
    .controller('GroupBiddingDetailRealtimeCtrl', function($scope, $routeParams, $q, group, dayahead, realtime, meter, utility) {
    })
    .controller('GroupMonitoringDetailCtrl', function($scope, $routeParams, group, meter, $log) {
      const { id } = $routeParams;

      $scope.loading = true;
      $scope.notfound = false;
      $scope.state = {
        groupInfo: null,
      }


      group.findById(id)
        .then(
          function success(groupInfo) {
            $scope.state = {
              groupInfo,
            }
            $scope.loading = false;
          },
          function failed() {
            $scope.notfound = true;
          }
        )

      $scope.monitoring = null;

      $scope.openedMonitoringList = [];
      $scope.toggle = function(time) {
        const idx = $scope.openedMonitoringList.indexOf(time);
        if (idx === -1) {
          $scope.openedMonitoringList.push(time);
        } else {
          $scope.openedMonitoringList.splice(idx, 1);
        }
      }
      $scope.closeAll = function() {
        $scope.openedMonitoringList = [];
      }

      $scope.withHourAgo = false;

      meter.connect(function(data) {
        $scope.monitoring = data.monitoring.group[id]?.reduce((a, c) => {
          const time = c.time;
          delete c.time;
          a[time] = {
            ...c,
          }
          return a;
        }, {}) ?? {};
      });

      $scope.$on('$destroy', function() {
        meter.disconnect();
      });
    })
    .controller('ResourceCtrl', function($scope, $routeParams, $log, resource) {
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
        const start = (page-1)*pageSize;
        $scope.data.list = newVal.slice(start, start+pageSize);
        $scope.data.pager = Array.from({length: Math.ceil(newVal.length / pageSize)}).map((_, i) => i+1);
      });
  
      $scope.loading = true;

      resource.findAll()
        .then(
          function(data) {
            $scope.resources = data;
            $scope.loading = false;
          }
        );
    })
    .controller('ResourceDetailCtrl', function($scope, resource, $routeParams) {
      console.count('init ::: ResourceDetailCtrl');
      const { id } = $routeParams;
  
      $scope.loading = true;
      $scope.fontfound = false;
      $scope.state = { 
        resource: null
      };
  
      resource.findById(id)
        .then(function success(resource) {
          $scope.loading = false;
          $scope.state = {
            resource,
          };
        }, function failed() {
          $scope.notfound = true;
        });
      
    })
    .controller('ResourceMonitoringDetailCtrl', function($scope, $routeParams, resource, meter) {
      const { id } = $routeParams;
  
      $scope.loading = true;
      $scope.fontfound = false;
      $scope.state = { 
        resource: null
      };
  
      resource.findById(id)
        .then(function success(resource) {
          $scope.loading = false;
          $scope.state = {
            resource,
          };
        }, function failed() {
          $scope.notfound = true;
        });
  
      $scope.monitoring = null;

      $scope.openedMonitoringList = [];
      $scope.toggle = function(time) {
        const idx = $scope.openedMonitoringList.indexOf(time);
        if (idx === -1) {
          $scope.openedMonitoringList.push(time);
        } else {
          $scope.openedMonitoringList.splice(idx, 1);
        }
      }
      $scope.closeAll = function() {
        $scope.openedMonitoringList = [];
      }

      $scope.withHourAgo = false;

      meter.connect(function(data) {
        $scope.monitoring = data.monitoring.resource[id]?.reduce((a, c) => {
          const time = c.time;
          delete c.time;
          a[time] = {
            ...c,
          }
          return a;
        }, {}) ?? {};
      });

      $scope.$on('$destroy', function() {
        meter.disconnect();
      });
    })
    .controller('ResourceGroupingCtrl', function($scope) {
      // console.log($scope);
    })
})(window.angular);
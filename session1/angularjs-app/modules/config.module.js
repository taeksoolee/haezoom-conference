(function (angular) {
  angular.module('appConfig', [])
    .constant('config', {
      API_ORIGIN: 'https://apidev.vpphaezoom.com',
      TEXT_LIST: {
        'Percentage': '역률제어',
        'On Off': 'On OFF 제어',
        // bidding state
        'pre_bid': '제출전',
        'kpx_bid_success': 'KPX 제출성공',
        'auto_bid_success': '자동제출성공',
        'manual_bid_success': '수정제출성공',
        'bid_failed': '제출실패',
      },
      EMOGI_LIST: {
        '태양광': '☀️',
        '풍력': '💨'
      }
    })
    .factory('$exceptionHandler', function($log) {
      return function myExceptionHandler(exception, cause, a) {
        // $log.warn(exception, cause);
        // 공용핸들러
      };
    });
})(window.angular);

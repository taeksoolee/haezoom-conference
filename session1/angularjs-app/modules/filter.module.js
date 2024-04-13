(function (angular) {
  angular.module('appFilter', [])
    .filter('mask', function() {
      return (input, len=4) => isNaN(+input) ? '-' : String(input).slice(0, len).padStart(len, '0');
    })
    .filter('falsy', function() {
      return (input, replace='-') => {
        return (input || null) === null ? replace : input;
      }
    })
    .filter('name', function() {
      return (input, list=[]) => list.find(e => e.id === input)?.name
    })
    .filter('nullish', function() {
      return (input, replace='-') => {
        return (input ?? null) === null ? replace : input;
      }
    })
    .filter('text', function(config) {
      return (input) => config.TEXT_LIST?.[input] ?? input;
    })
    .filter('emogi', function(config) {
      return (input) => config.EMOGI_LIST?.[input] ?? input;
    })
    .filter('wattUnit', function() {
      return (input) => isNaN(+input) ? '-' : `${input}`.match(/.{1,4}/g).reduce((a, _, i) => {
        if (a[1][i]) {
          a[0] = a[1][i];
        }
        return a;
      },['', ['kW', 'MW']])[0];
    })
    .filter('bracket', function() {
      return (input='', type) => {
        switch(type) {
          case 'curly':
            return `{${input}}`;
          case 'round':
            return `(${input})`;
          case 'square':
          default:
            return `[${input}]`;
        }
      }
    })
    .filter('hour', function() {
      return (input) => dayjs(input).format('HH');
    })
    .filter('hourlySection', function () {
      return (input, formatType) => {
        const now = new Date(input);
        if (isNaN(now)) return '';

        const instance = dayjs(now).add(-1, 'second').add(1, 'hour');
        if (formatType === 'short') {
          return instance.format('HH시 구간');
        } else {
          return instance.format('YYYY-MM-DD HH시 구간');
        }
      }
    })
    .filter('bidHourlySection', function() {
      return (input, formatType) => {
        const now = new Date(input);
        if (isNaN(now)) return '';

        const DIFF_MINUTE = 75;
        // const DIFF_MINUTE = 30;
        const targetMinute = ((60 * 24) - DIFF_MINUTE) % 60;

        let instance = dayjs(now).set('minute', targetMinute);

        if (instance.isBefore(now) || instance.isSame(now)) {
          instance = instance.add(2, 'hour');
        } else {
          instance = instance.add(1, 'hour');
        }

        instance = instance.add(DIFF_MINUTE, 'minute');

        // 구간 
        if (formatType === 'short') {
          return instance.format('HH시 구간');
        } else {
          return instance.format('YYYY-MM-DD HH시 구간');
        }
      }
    })
    .filter('sliceCurHour', function() {
      return (input) => {
        let i = 1;
        const result = {};
        for (const key in input) {
          if (i > 60) {
            result[key] = input[key];
          }
          i++;
        }
        return result;
      };
    })
    .filter('isEmpty', function() {
      return (input) => {
        if (!input) {
          return input;
        }
        
        return Array.isArray(input) ? input.length === 0 : Object.keys(input).length === 0;
      }
    });
})(window.angular);
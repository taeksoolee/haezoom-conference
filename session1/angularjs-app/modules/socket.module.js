(function (angular) {
  angular.module('appSocket', ['appRepository'])
    .service('meter', function($log) {
      console.log('init :: socket meter') 
      let ws = null;

      this.connect = function(handler) {
        try {
          ws = new WebSocket('wss://apidev.vpphaezoom.com/ws/meter/');

          ws.onclose = function() {
          }

          ws.onerror = function(err) {
            // console.error(err);
          }

          ws.onmessage = async function(evt) {
            try {
              const { data } = evt; // blob
              const buffer = await data.arrayBuffer();
        
              const result = window.pako.inflate(new Uint8Array(buffer), { to: 'string' });
              
              const parsed = JSON.parse(result);
              typeof handler === 'function' && handler(parsed);
            } catch (err) {
              $log.error(err);
            }
          }

          // ws.close(function() {
          //   console.log('!!');
          // });

          // ws.onerror(function(err) {
          //   console.log(err)
          // })
        } catch (err) {
          console.error(err);
        }
      }

      this.disconnect =  function() {
        if (ws) {
          console.log('close');
          ws.close();
          ws = null;
        }
      }
    })
})(window.angular);
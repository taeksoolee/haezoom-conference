/**
  * @param {{
  *  names: string[],
  *  onvalid(input: HTMLInputElement): void,
  *  oninvalid(input: HTMLInputElement, type: 'pattern' | 'required'): void,
  * }} events
*  */
function Validator(events) {
  const {
    onvalid,
    oninvalid,
  } = events;

  /**
     * @param  {...HTMLInputElement[]} inputs 
     */
  function validate(...inputs) {
    return inputs.reduce((valid, input) => {
      return this.check(input) && valid;
    }, true);
  }

  /**
   * set custom invalid message
   * @attr pattern
   * @attr aria-errormessage
   */
  function setErrorMessage(input) {
    if (input instanceof HTMLInputElement) {
      if (input.pattern) {
        const errormesage = input.getAttribute('aria-errormessage') || '';
        input.setCustomValidity(errormesage);
      }
    }
  }

  /**
     * @attr required
     * @attr pattern
     */
  function check (input) {
    if (input instanceof HTMLInputElement) {
      // input.validity.valueMissing is true if required and has no value
      if (input.validity.valueMissing) {
        oninvalid(input, 'required');
        return false;
      }

      if (input.validity.patternMismatch) {
        oninvalid(input, 'pattern');
        return false;
      }

      onvalid(input);
      return true;
    }
  }

  return {
    validate,
    setErrorMessage,
    check,
    handlers: {
      oninput(event) {
        check(event.target);
      },
      oninvalid(event) {
        setErrorMessage(event.target);
      }
    },
  }
}

htmx.on("htmx:load", function(evt) {
  htmx.config.defaultTransitionDuration = 100;
});

window.addEventListener('load', function() {
  window.validator = Validator({
    onvalid(input) {
      input.classList.remove('is-invalid');
      const inputWrapper = input.parentElement;
      inputWrapper.classList.remove('is-invalid');

      const message = inputWrapper.parentElement.querySelector('div[role=alert]');
      if (message) {
        message.classList.remove('invalid-feedback');
        message.innerText = '';
      }
    },
    oninvalid(input, type) {
      input.classList.add('is-invalid');
      const inputWrapper = input.parentElement;
      inputWrapper.classList.add('is-invalid');

      const message = inputWrapper.parentElement.querySelector('div[role=alert]');
      if (message) {
        message.classList.add('invalid-feedback');

        if (type === 'required') {
          message.innerText = input.getAttribute('aria-required') || '';
        } else if (type === 'pattern') {
          message.innerText = input.getAttribute('aria-errormessage') || '';
        }
      }
    }
  });
})
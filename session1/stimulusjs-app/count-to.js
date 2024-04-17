// count_to_controller.js
const app = Stimulus.Application.start();
app.register('count-to', class extends Stimulus.Controller {
  static targets = ["display"];

  connect() {
    this.startCount();
  }

  startCount() {
    const to = Number(this.data.get("to-value")) || 0;
    const max = Number(this.data.get("max")) || to;
    const finalTarget = Math.min(to, max);
    const duration = Number(this.data.get("duration")) || 3000;
    const interval = Number(this.data.get("interval")) || 100;
    const precision = parseInt(this.data.get("precision")) || 0;
    const useLocaleFormat = this.data.get("use-locale-format") === 'true';

    const steps = Math.ceil(duration / interval);
    const increment = (finalTarget / steps);

    let currentNumber = 0;

    const counter = setInterval(() => {
      currentNumber += increment;
      if (currentNumber >= finalTarget) {
        currentNumber = finalTarget;
        clearInterval(counter);
      }

      this.displayTarget.textContent = this.formatNumber(currentNumber, precision, useLocaleFormat);
    }, interval);
  }

  formatNumber(number, precision, useLocaleFormat) {
    let formattedNumber = number.toFixed(precision);
    if (useLocaleFormat) {
      formattedNumber = parseFloat(formattedNumber).toLocaleString(undefined, {
        minimumFractionDigits: precision,
        maximumFractionDigits: precision
      });
    }
    return formattedNumber;
  }
});

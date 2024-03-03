document.addEventListener("alpine:init", () => {
  Alpine.magic('moment', () => {
    return moment;
  });

  Alpine.directive('focus', (el, { }) => {
    typeof el.focus === 'function' && el.focus();

    const curValue = el.value ?? '';
    typeof el.setSelectionRange === 'function' && el.setSelectionRange(curValue.length, curValue.length);
  });
});
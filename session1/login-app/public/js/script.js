function errorHandler(evt) {
  console.log('htmx:responseError', evt.detail.xhr.status);

  if (evt.detail.xhr.status === 401) {
    Toastify({
      text: "Unauthorized",
      duration: 100000,
      className: "info",
      // className: "bg-danger",
      style: {
        background: "linear-gradient(to right, #00b09b, #96c93d)",
        // background: '#ff0000',
      }
    }).showToast();
  }
}

document.addEventListener('htmx:load', () => {
  console.log('loaded htmx');
  document.body.removeEventListener('htmx:responseError', errorHandler);
  document.body.addEventListener('htmx:responseError', errorHandler);
});

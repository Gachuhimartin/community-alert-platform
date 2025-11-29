export function showBrowserNotification(title, options) {
  if (!('Notification' in window)) {
    console.log('This browser does not support desktop notifications.');
    return;
  }

  if (Notification.permission === 'granted') {
    new Notification(title, options);
  } else if (Notification.permission !== 'denied') {
    Notification.requestPermission().then(permission => {
      if (permission === 'granted') {
        new Notification(title, options);
      }
    });
  }
}

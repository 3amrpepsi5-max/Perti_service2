/**
 * Push Notification System
 */

export class PushNotifications {

  constructor() {
    this.registration = null;
  }

  async requestPermission() {
    if (!('Notification' in window)) return false;

    const permission = await Notification.requestPermission();

    if (permission !== 'granted') return false;

    this.registration = await navigator.serviceWorker.ready;
    await this.subscribeUser();

    return true;
  }

  async subscribeUser() {
    const subscription = await this.registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: this.urlBase64ToUint8Array(
        'YOUR_PUBLIC_VAPID_KEY'
      )
    });

    await fetch('/api/notifications/subscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
      },
      body: JSON.stringify(subscription)
    });

    return subscription;
  }

  showNotification(title, options = {}) {
    if (Notification.permission !== 'granted') return;

    this.registration.showNotification(title, {
      icon: '/images/icon-192.png',
      badge: '/images/icon-72.png',
      vibrate: [200, 100, 200],
      ...options
    });
  }

  notifyNewOrder(order) {
    this.showNotification('طلب جديد 🔔', {
      body: `${order.customerName} طلب ${order.service}`,
      data: { orderId: order.id }
    });
  }

  urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/');

    const rawData = atob(base64);
    return Uint8Array.from([...rawData].map(char => char.charCodeAt(0)));
  }
}

export default PushNotifications;
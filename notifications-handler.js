/**
 * Backend Push Notification Handler
 */

const webPush = require('web-push');

webPush.setVapidDetails(
  'mailto:admin@nozha2.com',
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

class NotificationHandler {

  static async sendToUser(subscriptions, payload) {
    const promises = subscriptions.map(sub =>
      webPush.sendNotification(
        sub,
        JSON.stringify(payload)
      ).catch(err => console.error(err))
    );

    await Promise.all(promises);

    return true;
  }

  static async notifyNewOrder(subscriptions, order) {
    const payload = {
      title: 'طلب جديد 🔔',
      body: `${order.customerName} طلب ${order.service}`,
      icon: '/images/new-order.png',
      data: {
        orderId: order.id,
        url: `/vendor/orders/${order.id}`
      }
    };

    return this.sendToUser(subscriptions, payload);
  }

}

module.exports = NotificationHandler;
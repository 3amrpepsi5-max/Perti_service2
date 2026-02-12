/**
 * WhatsApp Handler
 */

import WhatsAppTemplates from './whatsapp-template.js';

export class WhatsAppHandler {

  constructor() {
    this.baseNumber = '201068992077';
    this.useBusinessAPI = false;
  }

  async sendDeliveryOrder(orderData) {
    const message = WhatsAppTemplates.deliveryOrder(orderData);
    return this.send(this.baseNumber, message);
  }

  async send(phone, message) {
    const cleanPhone = phone.replace(/\D/g, '');
    const encodedMessage = encodeURIComponent(message);

    const url = `https://wa.me/${cleanPhone}?text=${encodedMessage}`;

    window.open(url, '_blank');

    await this.logMessage(phone, message, 'web');

    return {
      success: true,
      method: 'web',
      url
    };
  }

  async sendViaBusinessAPI(phone, message) {
    try {
      const response = await fetch('/api/whatsapp/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({ to: phone, message })
      });

      const result = await response.json();

      if (result.success) {
        return result;
      }

      throw new Error(result.message);

    } catch (error) {
      console.warn('Business API failed → fallback to Web');
      return this.send(phone, message);
    }
  }

  async logMessage(phone, message, method) {
    try {
      await fetch('/api/whatsapp/log', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({
          phone,
          message,
          method,
          timestamp: new Date().toISOString()
        })
      });
    } catch (error) {
      console.warn('Logging failed');
    }
  }

  static validatePhone(phone) {
    const cleaned = phone.replace(/\D/g, '');

    if (cleaned.length === 11 && cleaned.startsWith('01')) {
      return '20' + cleaned;
    }

    if (cleaned.length === 13 && cleaned.startsWith('201')) {
      return cleaned;
    }

    return null;
  }
}

export default WhatsAppHandler;
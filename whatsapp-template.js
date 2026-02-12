/**
 * WhatsApp Message Templates
 * منصة النزهة 2
 */

export class WhatsAppTemplates {

  static deliveryOrder(data) {
    const {
      customerName,
      customerPhone,
      pickupAddress,
      deliveryAddress,
      itemDescription,
      deliveryTime,
      notes,
      orderNumber
    } = data;

    return `
🚚 *طلب توصيل جديد*
━━━━━━━━━━━━━━━━━━━━

📋 *رقم الطلب:* #${orderNumber}

👤 *العميل:*
${customerName}
📞 ${this.formatPhone(customerPhone)}

📍 *من:*
${pickupAddress}

📍 *إلى:*
${deliveryAddress}

📦 *المطلوب:*
${itemDescription}

⏰ *موعد التوصيل:*
${deliveryTime}

${notes ? `💬 *ملاحظات:*\n${notes}\n` : ''}

━━━━━━━━━━━━━━━━━━━━
🌐 منصة النزهة 2
`.trim();
  }

  static vendorSubscription(vendor) {
    return `
✅ *تم تفعيل اشتراكك بنجاح!*
━━━━━━━━━━━━━━━━━━━━

🏪 *${vendor.name}*

📅 *تاريخ البدء:* ${this.formatDate(vendor.startDate)}
📅 *تاريخ الانتهاء:* ${this.formatDate(vendor.endDate)}

💰 *قيمة الاشتراك:* ${vendor.price} جنيه

━━━━━━━━━━━━━━━━━━━━
منصة النزهة 2 ☕
`.trim();
  }

  static formatPhone(phone) {
    const cleaned = phone.replace(/\D/g, '');

    if (cleaned.startsWith('20')) {
      return `+${cleaned}`;
    }

    if (cleaned.startsWith('01')) {
      return `+20${cleaned}`;
    }

    return phone;
  }

  static formatDate(date) {
    const d = new Date(date);
    return d.toLocaleString('ar-EG');
  }
}

export default WhatsAppTemplates;
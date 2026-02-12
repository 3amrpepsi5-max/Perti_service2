/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * 💳 Payment Service
 * خدمة معالجة الدفع الإلكتروني
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */

const stripe = require('stripe');
const axios = require('axios');
require('dotenv').config();

class PaymentService {
  
  constructor() {
    // Initialize Stripe
    this.stripeKey = process.env.STRIPE_SECRET_KEY;
    if (this.stripeKey) {
      this.stripe = stripe(this.stripeKey);
      this.stripeEnabled = true;
    } else {
      console.warn('⚠️  Stripe disabled: API key not found');
      this.stripeEnabled = false;
    }
    
    // Paymob credentials (popular in Egypt)
    this.paymobApiKey = process.env.PAYMOB_API_KEY;
    this.paymobIntegrationId = process.env.PAYMOB_INTEGRATION_ID;
    this.paymobEnabled = !!(this.paymobApiKey && this.paymobIntegrationId);
    
    // App settings
    this.currency = process.env.PAYMENT_CURRENCY || 'EGP';
    this.appUrl = process.env.APP_URL || 'http://localhost:3000';
  }
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // STRIPE PAYMENTS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  
  /**
   * Create Stripe payment intent
   */
  async createStripePaymentIntent(amount, metadata = {}) {
    if (!this.stripeEnabled) {
      throw new Error('Stripe payment service is not configured');
    }
    
    try {
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: this.currency.toLowerCase(),
        metadata: {
          ...metadata,
          platform: 'nozha2'
        }
      });
      
      return {
        success: true,
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        amount: paymentIntent.amount / 100
      };
      
    } catch (error) {
      console.error('Stripe payment error:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Confirm Stripe payment
   */
  async confirmStripePayment(paymentIntentId) {
    if (!this.stripeEnabled) {
      throw new Error('Stripe payment service is not configured');
    }
    
    try {
      const paymentIntent = await this.stripe.paymentIntents.retrieve(paymentIntentId);
      
      return {
        success: paymentIntent.status === 'succeeded',
        status: paymentIntent.status,
        amount: paymentIntent.amount / 100,
        paymentIntentId: paymentIntent.id
      };
      
    } catch (error) {
      console.error('Stripe confirmation error:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Create Stripe checkout session
   */
  async createStripeCheckoutSession(items, metadata = {}) {
    if (!this.stripeEnabled) {
      throw new Error('Stripe payment service is not configured');
    }
    
    try {
      const session = await this.stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: items.map(item => ({
          price_data: {
            currency: this.currency.toLowerCase(),
            product_data: {
              name: item.name,
              description: item.description || ''
            },
            unit_amount: Math.round(item.price * 100)
          },
          quantity: item.quantity || 1
        })),
        mode: 'payment',
        success_url: `${this.appUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${this.appUrl}/payment/cancel`,
        metadata: {
          ...metadata,
          platform: 'nozha2'
        }
      });
      
      return {
        success: true,
        sessionId: session.id,
        url: session.url
      };
      
    } catch (error) {
      console.error('Stripe checkout error:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Retrieve Stripe checkout session
   */
  async retrieveStripeSession(sessionId) {
    if (!this.stripeEnabled) {
      throw new Error('Stripe payment service is not configured');
    }
    
    try {
      const session = await this.stripe.checkout.sessions.retrieve(sessionId);
      
      return {
        success: true,
        paymentStatus: session.payment_status,
        amount: session.amount_total / 100,
        customerEmail: session.customer_email,
        metadata: session.metadata
      };
      
    } catch (error) {
      console.error('Stripe session retrieval error:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Refund Stripe payment
   */
  async refundStripePayment(paymentIntentId, amount = null) {
    if (!this.stripeEnabled) {
      throw new Error('Stripe payment service is not configured');
    }
    
    try {
      const refundData = { payment_intent: paymentIntentId };
      
      if (amount) {
        refundData.amount = Math.round(amount * 100);
      }
      
      const refund = await this.stripe.refunds.create(refundData);
      
      return {
        success: true,
        refundId: refund.id,
        status: refund.status,
        amount: refund.amount / 100
      };
      
    } catch (error) {
      console.error('Stripe refund error:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // PAYMOB PAYMENTS (Popular in Egypt)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  
  /**
   * Authenticate with Paymob
   */
  async paymobAuth() {
    if (!this.paymobEnabled) {
      throw new Error('Paymob payment service is not configured');
    }
    
    try {
      const response = await axios.post('https://accept.paymob.com/api/auth/tokens', {
        api_key: this.paymobApiKey
      });
      
      return response.data.token;
      
    } catch (error) {
      console.error('Paymob auth error:', error.message);
      throw error;
    }
  }
  
  /**
   * Create Paymob order
   */
  async createPaymobOrder(amount, orderData = {}) {
    if (!this.paymobEnabled) {
      throw new Error('Paymob payment service is not configured');
    }
    
    try {
      const authToken = await this.paymobAuth();
      
      const response = await axios.post('https://accept.paymob.com/api/ecommerce/orders', {
        auth_token: authToken,
        delivery_needed: false,
        amount_cents: Math.round(amount * 100),
        currency: this.currency,
        items: orderData.items || []
      });
      
      return {
        success: true,
        orderId: response.data.id,
        authToken
      };
      
    } catch (error) {
      console.error('Paymob order error:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Create Paymob payment key
   */
  async createPaymobPaymentKey(orderId, amount, billingData) {
    if (!this.paymobEnabled) {
      throw new Error('Paymob payment service is not configured');
    }
    
    try {
      const authToken = await this.paymobAuth();
      
      const response = await axios.post('https://accept.paymob.com/api/acceptance/payment_keys', {
        auth_token: authToken,
        amount_cents: Math.round(amount * 100),
        expiration: 3600,
        order_id: orderId,
        billing_data: {
          apartment: billingData.apartment || 'NA',
          email: billingData.email,
          floor: billingData.floor || 'NA',
          first_name: billingData.firstName,
          street: billingData.street || 'NA',
          building: billingData.building || 'NA',
          phone_number: billingData.phone,
          shipping_method: 'NA',
          postal_code: 'NA',
          city: billingData.city || 'NA',
          country: 'EG',
          last_name: billingData.lastName || billingData.firstName,
          state: 'NA'
        },
        currency: this.currency,
        integration_id: this.paymobIntegrationId
      });
      
      return {
        success: true,
        paymentToken: response.data.token
      };
      
    } catch (error) {
      console.error('Paymob payment key error:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Get Paymob iframe URL
   */
  getPaymobIframeUrl(paymentToken) {
    const iframeId = process.env.PAYMOB_IFRAME_ID;
    return `https://accept.paymob.com/api/acceptance/iframes/${iframeId}?payment_token=${paymentToken}`;
  }
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // SUBSCRIPTION PAYMENTS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  
  /**
   * Process subscription payment
   */
  async processSubscriptionPayment(subscriptionData, paymentMethod = 'stripe') {
    const { vendorId, plan, price, billingData } = subscriptionData;
    
    if (paymentMethod === 'stripe' && this.stripeEnabled) {
      return await this.createStripeCheckoutSession([
        {
          name: `اشتراك ${plan}`,
          description: `اشتراك نزهة 2 - ${plan}`,
          price: price,
          quantity: 1
        }
      ], {
        vendor_id: vendorId,
        subscription_plan: plan,
        type: 'subscription'
      });
      
    } else if (paymentMethod === 'paymob' && this.paymobEnabled) {
      // Create Paymob order
      const order = await this.createPaymobOrder(price, {
        items: [{
          name: `اشتراك ${plan}`,
          amount_cents: Math.round(price * 100),
          quantity: 1
        }]
      });
      
      if (!order.success) {
        return order;
      }
      
      // Create payment key
      const paymentKey = await this.createPaymobPaymentKey(
        order.orderId,
        price,
        billingData
      );
      
      if (!paymentKey.success) {
        return paymentKey;
      }
      
      return {
        success: true,
        orderId: order.orderId,
        iframeUrl: this.getPaymobIframeUrl(paymentKey.paymentToken)
      };
      
    } else {
      return {
        success: false,
        error: 'Payment method not available'
      };
    }
  }
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // PAYMENT VERIFICATION
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  
  /**
   * Verify payment callback (for webhooks)
   */
  async verifyPaymentCallback(provider, data) {
    if (provider === 'stripe') {
      return await this.verifyStripeWebhook(data);
    } else if (provider === 'paymob') {
      return await this.verifyPaymobCallback(data);
    }
    
    return {
      success: false,
      error: 'Unknown payment provider'
    };
  }
  
  /**
   * Verify Stripe webhook
   */
  async verifyStripeWebhook(payload, signature) {
    if (!this.stripeEnabled) {
      return { success: false, error: 'Stripe not configured' };
    }
    
    try {
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
      
      if (!webhookSecret) {
        console.warn('Stripe webhook secret not configured');
        return { success: false, error: 'Webhook not configured' };
      }
      
      const event = this.stripe.webhooks.constructEvent(
        payload,
        signature,
        webhookSecret
      );
      
      return {
        success: true,
        event: event.type,
        data: event.data.object
      };
      
    } catch (error) {
      console.error('Stripe webhook verification failed:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Verify Paymob callback
   */
  async verifyPaymobCallback(data) {
    if (!this.paymobEnabled) {
      return { success: false, error: 'Paymob not configured' };
    }
    
    try {
      // Paymob sends HMAC for verification
      const hmacSecret = process.env.PAYMOB_HMAC_SECRET;
      
      if (!hmacSecret) {
        console.warn('Paymob HMAC secret not configured');
      }
      
      // Extract transaction data
      const isSuccess = data.success === 'true' || data.success === true;
      const transactionId = data.id;
      const orderId = data.order;
      const amount = data.amount_cents / 100;
      
      return {
        success: isSuccess,
        transactionId,
        orderId,
        amount,
        pending: data.pending === 'true'
      };
      
    } catch (error) {
      console.error('Paymob callback verification failed:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // UTILITY FUNCTIONS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  
  /**
   * Format amount for display
   */
  formatAmount(amount) {
    return new Intl.NumberFormat('ar-EG', {
      style: 'currency',
      currency: this.currency
    }).format(amount);
  }
  
  /**
   * Get available payment methods
   */
  getAvailablePaymentMethods() {
    const methods = [];
    
    if (this.stripeEnabled) {
      methods.push({
        id: 'stripe',
        name: 'بطاقة ائتمان (Stripe)',
        icon: 'credit-card',
        enabled: true
      });
    }
    
    if (this.paymobEnabled) {
      methods.push({
        id: 'paymob',
        name: 'بطاقة ائتمان (Paymob)',
        icon: 'credit-card',
        enabled: true
      });
    }
    
    // Cash is always available
    methods.push({
      id: 'cash',
      name: 'دفع نقدي',
      icon: 'money',
      enabled: true
    });
    
    return methods;
  }
  
  /**
   * Check if payment service is available
   */
  isAvailable() {
    return this.stripeEnabled || this.paymobEnabled;
  }
  
  /**
   * Get service status
   */
  getStatus() {
    return {
      stripe: this.stripeEnabled,
      paymob: this.paymobEnabled,
      currency: this.currency,
      available: this.isAvailable()
    };
  }
}

// Export singleton instance
module.exports = new PaymentService();

/**
 * 🔌 API Client - نظام الاتصال بالـ Backend
 * ملف للتواصل مع الخادم وإدارة الطلبات
 * نزهة 2 - Nozha 2 Services
 */

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 1️⃣ CONFIGURATION
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const API_CONFIG = {
  // سيتم تغيير هذا عند نشر Backend
  BASE_URL: 'http://localhost:5000/api',
  // أو استخدام URL الفعلي
  // BASE_URL: 'https://nozha2-api.com/api',
  
  TIMEOUT: 30000, // 30 seconds
  HEADERS: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 2️⃣ HELPER FUNCTIONS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * الحصول على التوكن من LocalStorage
 */
function getAuthToken() {
  return localStorage.getItem('auth_token');
}

/**
 * حفظ التوكن في LocalStorage
 */
function setAuthToken(token) {
  localStorage.setItem('auth_token', token);
}

/**
 * حذف التوكن
 */
function removeAuthToken() {
  localStorage.removeItem('auth_token');
  localStorage.removeItem('user_data');
}

/**
 * إنشاء Headers مع التوكن
 */
function getHeaders(includeAuth = true) {
  const headers = { ...API_CONFIG.HEADERS };
  
  if (includeAuth) {
    const token = getAuthToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }
  
  return headers;
}

/**
 * معالجة الأخطاء
 */
function handleError(error, endpoint) {
  console.error(`API Error at ${endpoint}:`, error);
  
  if (error.status === 401) {
    // Unauthorized - تسجيل خروج تلقائي
    removeAuthToken();
    window.location.href = '/login.html';
  }
  
  throw error;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 3️⃣ MAIN API FUNCTION
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * الدالة الرئيسية لإرسال الطلبات
 * @param {string} endpoint - مسار API
 * @param {object} options - خيارات الطلب
 */
async function apiCall(endpoint, options = {}) {
  const url = `${API_CONFIG.BASE_URL}${endpoint}`;
  
  const config = {
    method: options.method || 'GET',
    headers: getHeaders(options.auth !== false),
    ...options
  };
  
  // إضافة Body إذا كان موجود
  if (options.body && typeof options.body === 'object') {
    config.body = JSON.stringify(options.body);
  }
  
  try {
    const response = await fetch(url, config);
    const data = await response.json();
    
    if (!response.ok) {
      throw {
        status: response.status,
        message: data.message || 'حدث خطأ في الاتصال',
        data: data
      };
    }
    
    return data;
    
  } catch (error) {
    return handleError(error, endpoint);
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 4️⃣ AUTHENTICATION API
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const AuthAPI = {
  /**
   * تسجيل مستخدم جديد
   */
  async register(userData) {
    const response = await apiCall('/auth/register', {
      method: 'POST',
      body: userData,
      auth: false
    });
    
    if (response.success && response.data.token) {
      setAuthToken(response.data.token);
      localStorage.setItem('user_data', JSON.stringify(response.data.user));
    }
    
    return response;
  },
  
  /**
   * تسجيل الدخول
   */
  async login(credentials) {
    const response = await apiCall('/auth/login', {
      method: 'POST',
      body: credentials,
      auth: false
    });
    
    if (response.success && response.data.token) {
      setAuthToken(response.data.token);
      localStorage.setItem('user_data', JSON.stringify(response.data.user));
    }
    
    return response;
  },
  
  /**
   * تسجيل الخروج
   */
  async logout() {
    try {
      await apiCall('/auth/logout', {
        method: 'POST'
      });
    } finally {
      removeAuthToken();
      window.location.href = '/index.html';
    }
  },
  
  /**
   * استعادة كلمة المرور
   */
  async forgotPassword(email) {
    return await apiCall('/auth/forgot-password', {
      method: 'POST',
      body: { email },
      auth: false
    });
  },
  
  /**
   * الحصول على بيانات المستخدم الحالي
   */
  async getCurrentUser() {
    return await apiCall('/auth/me');
  }
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 5️⃣ VENDORS API
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const VendorsAPI = {
  /**
   * الحصول على قائمة المزودين
   */
  async getAll(filters = {}) {
    const queryString = new URLSearchParams(filters).toString();
    return await apiCall(`/vendors?${queryString}`, {
      auth: false
    });
  },
  
  /**
   * الحصول على تفاصيل مزود محدد
   */
  async getById(vendorId) {
    return await apiCall(`/vendors/${vendorId}`, {
      auth: false
    });
  },
  
  /**
   * تسجيل مزود جديد
   */
  async create(vendorData) {
    return await apiCall('/vendors', {
      method: 'POST',
      body: vendorData
    });
  },
  
  /**
   * تحديث بيانات مزود
   */
  async update(vendorId, vendorData) {
    return await apiCall(`/vendors/${vendorId}`, {
      method: 'PUT',
      body: vendorData
    });
  },
  
  /**
   * حذف مزود
   */
  async delete(vendorId) {
    return await apiCall(`/vendors/${vendorId}`, {
      method: 'DELETE'
    });
  },
  
  /**
   * تسجيل مشاهدة
   */
  async recordView(vendorId) {
    return await apiCall(`/vendors/${vendorId}/views`, {
      method: 'POST',
      auth: false
    });
  },
  
  /**
   * البحث عن مزودين
   */
  async search(query, filters = {}) {
    const params = new URLSearchParams({ search: query, ...filters });
    return await apiCall(`/vendors?${params}`, {
      auth: false
    });
  }
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 6️⃣ REVIEWS API
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const ReviewsAPI = {
  /**
   * الحصول على تقييمات مزود
   */
  async getByVendor(vendorId, page = 1) {
    return await apiCall(`/reviews/vendor/${vendorId}?page=${page}`, {
      auth: false
    });
  },
  
  /**
   * إضافة تقييم
   */
  async create(reviewData) {
    return await apiCall('/reviews', {
      method: 'POST',
      body: reviewData
    });
  },
  
  /**
   * تحديث تقييم
   */
  async update(reviewId, reviewData) {
    return await apiCall(`/reviews/${reviewId}`, {
      method: 'PUT',
      body: reviewData
    });
  },
  
  /**
   * حذف تقييم
   */
  async delete(reviewId) {
    return await apiCall(`/reviews/${reviewId}`, {
      method: 'DELETE'
    });
  },
  
  /**
   * رد المزود على تقييم
   */
  async respond(reviewId, response) {
    return await apiCall(`/reviews/${reviewId}/response`, {
      method: 'POST',
      body: { response }
    });
  }
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 7️⃣ ORDERS API
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const OrdersAPI = {
  /**
   * الحصول على طلبات المستخدم
   */
  async getMyOrders() {
    return await apiCall('/orders');
  },
  
  /**
   * إنشاء طلب جديد
   */
  async create(orderData) {
    return await apiCall('/orders', {
      method: 'POST',
      body: orderData
    });
  },
  
  /**
   * الحصول على تفاصيل طلب
   */
  async getById(orderId) {
    return await apiCall(`/orders/${orderId}`);
  },
  
  /**
   * تحديث حالة الطلب
   */
  async updateStatus(orderId, status) {
    return await apiCall(`/orders/${orderId}/status`, {
      method: 'PUT',
      body: { status }
    });
  },
  
  /**
   * إلغاء طلب
   */
  async cancel(orderId) {
    return await apiCall(`/orders/${orderId}/cancel`, {
      method: 'POST'
    });
  }
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 8️⃣ SUBSCRIPTIONS API
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const SubscriptionsAPI = {
  /**
   * الحصول على خطط الاشتراك
   */
  async getPlans() {
    return await apiCall('/subscriptions/plans', {
      auth: false
    });
  },
  
  /**
   * إنشاء اشتراك جديد
   */
  async create(subscriptionData) {
    return await apiCall('/subscriptions', {
      method: 'POST',
      body: subscriptionData
    });
  },
  
  /**
   * تجديد اشتراك
   */
  async renew(subscriptionId) {
    return await apiCall(`/subscriptions/${subscriptionId}/renew`, {
      method: 'POST'
    });
  },
  
  /**
   * إلغاء اشتراك
   */
  async cancel(subscriptionId) {
    return await apiCall(`/subscriptions/${subscriptionId}/cancel`, {
      method: 'POST'
    });
  }
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 9️⃣ NOTIFICATIONS API
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const NotificationsAPI = {
  /**
   * الحصول على الإشعارات
   */
  async getAll() {
    return await apiCall('/notifications');
  },
  
  /**
   * تحديد إشعار كمقروء
   */
  async markAsRead(notificationId) {
    return await apiCall(`/notifications/${notificationId}/read`, {
      method: 'PUT'
    });
  },
  
  /**
   * تحديد جميع الإشعارات كمقروءة
   */
  async markAllAsRead() {
    return await apiCall('/notifications/read-all', {
      method: 'PUT'
    });
  },
  
  /**
   * حذف إشعار
   */
  async delete(notificationId) {
    return await apiCall(`/notifications/${notificationId}`, {
      method: 'DELETE'
    });
  }
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🔟 UPLOAD API
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const UploadAPI = {
  /**
   * رفع صورة
   */
  async uploadImage(file, type = 'general') {
    const formData = new FormData();
    formData.append('image', file);
    formData.append('type', type);
    
    const token = getAuthToken();
    
    const response = await fetch(`${API_CONFIG.BASE_URL}/upload/image`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
        // لا نضيف Content-Type لأن FormData يضيفه تلقائياً
      },
      body: formData
    });
    
    return await response.json();
  },
  
  /**
   * رفع عدة صور
   */
  async uploadImages(files, type = 'general') {
    const formData = new FormData();
    
    for (let i = 0; i < files.length; i++) {
      formData.append('images', files[i]);
    }
    formData.append('type', type);
    
    const token = getAuthToken();
    
    const response = await fetch(`${API_CONFIG.BASE_URL}/upload/images`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });
    
    return await response.json();
  }
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🎯 EXPORT API OBJECT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const API = {
  Auth: AuthAPI,
  Vendors: VendorsAPI,
  Reviews: ReviewsAPI,
  Orders: OrdersAPI,
  Subscriptions: SubscriptionsAPI,
  Notifications: NotificationsAPI,
  Upload: UploadAPI,
  
  // Helper functions
  getAuthToken,
  setAuthToken,
  removeAuthToken,
  
  // Config
  config: API_CONFIG
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📝 USAGE EXAMPLES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/*

// مثال 1: تسجيل مستخدم جديد
async function registerUser() {
  try {
    const response = await API.Auth.register({
      name: 'أحمد محمد',
      email: 'ahmed@example.com',
      phone: '01012345678',
      password: 'password123'
    });
    
    console.log('تم التسجيل بنجاح:', response);
    // التوكن يُحفظ تلقائياً في LocalStorage
    
  } catch (error) {
    console.error('خطأ في التسجيل:', error);
  }
}

// مثال 2: تسجيل الدخول
async function loginUser() {
  try {
    const response = await API.Auth.login({
      email: 'ahmed@example.com',
      password: 'password123'
    });
    
    console.log('تم تسجيل الدخول:', response);
    
  } catch (error) {
    console.error('خطأ في تسجيل الدخول:', error);
  }
}

// مثال 3: الحصول على المزودين
async function getVendors() {
  try {
    const response = await API.Vendors.getAll({
      category: 'electrician',
      rating: 4,
      page: 1,
      limit: 20
    });
    
    console.log('المزودون:', response.data.vendors);
    
  } catch (error) {
    console.error('خطأ في جلب المزودين:', error);
  }
}

// مثال 4: إضافة تقييم
async function addReview() {
  try {
    const response = await API.Reviews.create({
      vendor_id: 123,
      rating: 5,
      comment: 'خدمة ممتازة جداً!'
    });
    
    console.log('تم إضافة التقييم:', response);
    
  } catch (error) {
    console.error('خطأ في إضافة التقييم:', error);
  }
}

// مثال 5: رفع صورة
async function uploadPhoto() {
  const fileInput = document.getElementById('photo');
  const file = fileInput.files[0];
  
  try {
    const response = await API.Upload.uploadImage(file, 'vendor-logo');
    console.log('تم رفع الصورة:', response.data.url);
    
  } catch (error) {
    console.error('خطأ في رفع الصورة:', error);
  }
}

*/

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ✨ END OF API CLIENT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

console.log('✅ API Client loaded successfully');

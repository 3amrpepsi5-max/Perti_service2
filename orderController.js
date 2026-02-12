/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * 📦 Order Controller
 * معالج الطلبات
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */

const Order = require('../models/Order');
const Vendor = require('../models/Vendor');

/**
 * الحصول على جميع الطلبات
 * GET /api/orders
 */
exports.getAllOrders = async (req, res) => {
  try {
    const filters = {
      user_id: req.query.user_id,
      vendor_id: req.query.vendor_id,
      status: req.query.status,
      date_from: req.query.date_from,
      date_to: req.query.date_to,
      page: req.query.page,
      limit: req.query.limit
    };
    
    // Non-admin users can only see their own orders
    if (req.user.role !== 'admin') {
      if (req.user.role === 'vendor') {
        // Get vendor profile
        const vendor = await Vendor.findByUserId(req.user.id);
        if (vendor) {
          filters.vendor_id = vendor.id;
        }
      } else {
        filters.user_id = req.user.id;
      }
    }
    
    const result = await Order.getAll(filters);
    
    res.json({
      success: true,
      data: result
    });
    
  } catch (error) {
    console.error('Get all orders error:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ في جلب الطلبات'
    });
  }
};

/**
 * الحصول على طلب محدد
 * GET /api/orders/:id
 */
exports.getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const order = await Order.findById(id);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'الطلب غير موجود'
      });
    }
    
    // Check authorization
    if (req.user.role !== 'admin') {
      const vendor = await Vendor.findByUserId(req.user.id);
      const isVendorOrder = vendor && vendor.id === order.vendor_id;
      const isCustomerOrder = order.user_id === req.user.id;
      
      if (!isVendorOrder && !isCustomerOrder) {
        return res.status(403).json({
          success: false,
          message: 'غير مصرح - ليس لديك صلاحية الوصول'
        });
      }
    }
    
    res.json({
      success: true,
      data: { order }
    });
    
  } catch (error) {
    console.error('Get order by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ في جلب الطلب'
    });
  }
};

/**
 * الحصول على طلبات المستخدم الحالي
 * GET /api/orders/my-orders
 */
exports.getMyOrders = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const status = req.query.status;
    
    const result = await Order.getByUserId(req.user.id, page, limit, status);
    
    res.json({
      success: true,
      data: result
    });
    
  } catch (error) {
    console.error('Get my orders error:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ في جلب طلباتك'
    });
  }
};

/**
 * الحصول على طلبات مزود
 * GET /api/orders/vendor/:vendorId
 */
exports.getVendorOrders = async (req, res) => {
  try {
    const { vendorId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const status = req.query.status;
    
    // Check authorization
    if (req.user.role !== 'admin') {
      const vendor = await Vendor.findById(vendorId);
      if (!vendor || vendor.user_id !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'غير مصرح - ليس لديك صلاحية الوصول'
        });
      }
    }
    
    const result = await Order.getByVendorId(vendorId, page, limit, status);
    
    res.json({
      success: true,
      data: result
    });
    
  } catch (error) {
    console.error('Get vendor orders error:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ في جلب الطلبات'
    });
  }
};

/**
 * إنشاء طلب جديد
 * POST /api/orders
 */
exports.createOrder = async (req, res) => {
  try {
    const {
      vendor_id,
      service_description,
      scheduled_date,
      scheduled_time,
      address,
      city,
      area,
      phone,
      amount,
      delivery_fee,
      notes
    } = req.body;
    
    // Validation
    if (!vendor_id || !service_description) {
      return res.status(400).json({
        success: false,
        message: 'المزود ووصف الخدمة مطلوبان'
      });
    }
    
    // Check if vendor exists
    const vendor = await Vendor.findById(vendor_id);
    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'المزود غير موجود'
      });
    }
    
    if (vendor.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'المزود غير نشط حالياً'
      });
    }
    
    // Calculate total
    const totalAmount = (parseFloat(amount) || 0) + (parseFloat(delivery_fee) || 0);
    
    const orderData = {
      user_id: req.user.id,
      vendor_id,
      service_description,
      scheduled_date,
      scheduled_time,
      address,
      city,
      area,
      phone: phone || req.user.phone,
      amount: amount || 0,
      delivery_fee: delivery_fee || 0,
      total: totalAmount,
      notes
    };
    
    const order = await Order.create(orderData);
    
    res.status(201).json({
      success: true,
      message: 'تم إنشاء الطلب بنجاح',
      data: { order }
    });
    
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'حدث خطأ في إنشاء الطلب'
    });
  }
};

/**
 * تحديث طلب
 * PUT /api/orders/:id
 */
exports.updateOrder = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if order exists
    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'الطلب غير موجود'
      });
    }
    
    // Check authorization (only customer can update before confirmation)
    if (req.user.role !== 'admin' && order.user_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'غير مصرح - ليس لديك صلاحية التعديل'
      });
    }
    
    // Can't update if order is not pending
    if (order.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'لا يمكن تعديل الطلب بعد التأكيد'
      });
    }
    
    const {
      service_description,
      scheduled_date,
      scheduled_time,
      address,
      city,
      area,
      phone,
      amount,
      delivery_fee,
      notes
    } = req.body;
    
    // Calculate total if amount or delivery_fee changed
    let total = order.total;
    if (amount !== undefined || delivery_fee !== undefined) {
      total = (parseFloat(amount) || order.amount) + (parseFloat(delivery_fee) || order.delivery_fee);
    }
    
    const updateData = {
      service_description,
      scheduled_date,
      scheduled_time,
      address,
      city,
      area,
      phone,
      amount,
      delivery_fee,
      total,
      notes
    };
    
    const updatedOrder = await Order.update(id, updateData);
    
    res.json({
      success: true,
      message: 'تم تحديث الطلب بنجاح',
      data: { order: updatedOrder }
    });
    
  } catch (error) {
    console.error('Update order error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'حدث خطأ في تحديث الطلب'
    });
  }
};

/**
 * تحديث حالة الطلب
 * PUT /api/orders/:id/status
 */
exports.updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, vendor_notes } = req.body;
    
    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'الحالة مطلوبة'
      });
    }
    
    if (!['pending', 'confirmed', 'in_progress', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'الحالة غير صالحة'
      });
    }
    
    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'الطلب غير موجود'
      });
    }
    
    // Check authorization (vendor or admin can update status)
    if (req.user.role !== 'admin') {
      const vendor = await Vendor.findById(order.vendor_id);
      if (!vendor || vendor.user_id !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'غير مصرح - يمكن للمزود فقط تحديث حالة الطلب'
        });
      }
    }
    
    await Order.updateStatus(id, status, vendor_notes);
    
    const updatedOrder = await Order.findById(id);
    
    res.json({
      success: true,
      message: 'تم تحديث حالة الطلب بنجاح',
      data: { order: updatedOrder }
    });
    
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ في تحديث حالة الطلب'
    });
  }
};

/**
 * إلغاء طلب
 * POST /api/orders/:id/cancel
 */
exports.cancelOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { cancellation_reason } = req.body;
    
    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'الطلب غير موجود'
      });
    }
    
    // Check authorization
    if (req.user.role !== 'admin') {
      const vendor = await Vendor.findById(order.vendor_id);
      const isVendor = vendor && vendor.user_id === req.user.id;
      const isCustomer = order.user_id === req.user.id;
      
      if (!isVendor && !isCustomer) {
        return res.status(403).json({
          success: false,
          message: 'غير مصرح - ليس لديك صلاحية الإلغاء'
        });
      }
    }
    
    // Can't cancel completed orders
    if (order.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'لا يمكن إلغاء الطلبات المكتملة'
      });
    }
    
    await Order.cancel(id, cancellation_reason || 'تم الإلغاء من قبل المستخدم');
    
    const updatedOrder = await Order.findById(id);
    
    res.json({
      success: true,
      message: 'تم إلغاء الطلب بنجاح',
      data: { order: updatedOrder }
    });
    
  } catch (error) {
    console.error('Cancel order error:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ في إلغاء الطلب'
    });
  }
};

/**
 * حذف طلب
 * DELETE /api/orders/:id
 */
exports.deleteOrder = async (req, res) => {
  try {
    const { id } = req.params;
    
    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'الطلب غير موجود'
      });
    }
    
    // Only admin can delete orders
    await Order.delete(id);
    
    res.json({
      success: true,
      message: 'تم حذف الطلب بنجاح'
    });
    
  } catch (error) {
    console.error('Delete order error:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ في حذف الطلب'
    });
  }
};

/**
 * الحصول على إحصائيات الطلبات
 * GET /api/orders/stats
 */
exports.getOrderStats = async (req, res) => {
  try {
    let vendorId = null;
    
    // If vendor, get only their stats
    if (req.user.role === 'vendor') {
      const vendor = await Vendor.findByUserId(req.user.id);
      if (vendor) {
        vendorId = vendor.id;
      }
    }
    
    const stats = await Order.getStats(vendorId);
    
    res.json({
      success: true,
      data: { stats }
    });
    
  } catch (error) {
    console.error('Get order stats error:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ في جلب إحصائيات الطلبات'
    });
  }
};

/**
 * الحصول على الطلبات حسب التاريخ
 * GET /api/orders/by-date
 */
exports.getOrdersByDate = async (req, res) => {
  try {
    const { date } = req.query;
    
    if (!date) {
      return res.status(400).json({
        success: false,
        message: 'التاريخ مطلوب'
      });
    }
    
    let vendorId = null;
    
    // If vendor, get only their orders
    if (req.user.role === 'vendor') {
      const vendor = await Vendor.findByUserId(req.user.id);
      if (vendor) {
        vendorId = vendor.id;
      }
    }
    
    const orders = await Order.getByDate(date, vendorId);
    
    res.json({
      success: true,
      data: { orders }
    });
    
  } catch (error) {
    console.error('Get orders by date error:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ في جلب الطلبات'
    });
  }
};

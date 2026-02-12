/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * 🏪 Vendor Controller
 * معالج المزودين
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */

const Vendor = require('../models/Vendor');

/**
 * الحصول على جميع المزودين
 * GET /api/vendors
 */
exports.getAllVendors = async (req, res) => {
  try {
    const filters = {
      category_id: req.query.category_id,
      business_type: req.query.business_type,
      city: req.query.city,
      area: req.query.area,
      status: req.query.status,
      is_verified: req.query.is_verified,
      is_featured: req.query.is_featured,
      search: req.query.search,
      min_rating: req.query.min_rating,
      latitude: req.query.latitude,
      longitude: req.query.longitude,
      radius: req.query.radius,
      page: req.query.page,
      limit: req.query.limit
    };
    
    const result = await Vendor.getAll(filters);
    
    res.json({
      success: true,
      data: result
    });
    
  } catch (error) {
    console.error('Get all vendors error:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ في جلب المزودين'
    });
  }
};

/**
 * الحصول على مزود محدد
 * GET /api/vendors/:id
 */
exports.getVendorById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const vendor = await Vendor.findById(id);
    
    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'المزود غير موجود'
      });
    }
    
    // Increment view count
    await Vendor.incrementViews(id);
    
    res.json({
      success: true,
      data: { vendor }
    });
    
  } catch (error) {
    console.error('Get vendor by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ في جلب بيانات المزود'
    });
  }
};

/**
 * إنشاء مزود جديد
 * POST /api/vendors
 */
exports.createVendor = async (req, res) => {
  try {
    const vendorData = {
      user_id: req.user.id,
      business_name: req.body.business_name,
      business_type: req.body.business_type,
      category_id: req.body.category_id,
      description: req.body.description,
      address: req.body.address,
      city: req.body.city,
      area: req.body.area,
      latitude: req.body.latitude,
      longitude: req.body.longitude,
      phone: req.body.phone,
      whatsapp: req.body.whatsapp,
      email: req.body.email,
      website: req.body.website,
      opening_time: req.body.opening_time,
      closing_time: req.body.closing_time,
      is_24_hours: req.body.is_24_hours,
      working_days: req.body.working_days,
      has_delivery: req.body.has_delivery,
      delivery_fee: req.body.delivery_fee,
      minimum_order: req.body.minimum_order,
      payment_methods: req.body.payment_methods
    };
    
    // Validation
    if (!vendorData.business_name || !vendorData.business_type || !vendorData.address) {
      return res.status(400).json({
        success: false,
        message: 'اسم العمل والنوع والعنوان مطلوبة'
      });
    }
    
    // Check if user already has a vendor profile
    const existingVendor = await Vendor.findByUserId(req.user.id);
    if (existingVendor) {
      return res.status(400).json({
        success: false,
        message: 'لديك ملف مزود بالفعل'
      });
    }
    
    const vendor = await Vendor.create(vendorData);
    
    res.status(201).json({
      success: true,
      message: 'تم إنشاء الملف التجاري بنجاح',
      data: { vendor }
    });
    
  } catch (error) {
    console.error('Create vendor error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'حدث خطأ في إنشاء الملف التجاري'
    });
  }
};

/**
 * تحديث معلومات المزود
 * PUT /api/vendors/:id
 */
exports.updateVendor = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if vendor exists
    const vendor = await Vendor.findById(id);
    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'المزود غير موجود'
      });
    }
    
    // Check authorization
    if (req.user.role !== 'admin' && vendor.user_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'غير مصرح - ليس لديك صلاحية التعديل'
      });
    }
    
    const updateData = {
      business_name: req.body.business_name,
      business_type: req.body.business_type,
      category_id: req.body.category_id,
      description: req.body.description,
      address: req.body.address,
      city: req.body.city,
      area: req.body.area,
      latitude: req.body.latitude,
      longitude: req.body.longitude,
      phone: req.body.phone,
      whatsapp: req.body.whatsapp,
      email: req.body.email,
      website: req.body.website,
      logo_url: req.body.logo_url,
      cover_image_url: req.body.cover_image_url,
      opening_time: req.body.opening_time,
      closing_time: req.body.closing_time,
      is_24_hours: req.body.is_24_hours,
      working_days: req.body.working_days,
      has_delivery: req.body.has_delivery,
      delivery_fee: req.body.delivery_fee,
      minimum_order: req.body.minimum_order,
      payment_methods: req.body.payment_methods
    };
    
    const updatedVendor = await Vendor.update(id, updateData);
    
    res.json({
      success: true,
      message: 'تم تحديث البيانات بنجاح',
      data: { vendor: updatedVendor }
    });
    
  } catch (error) {
    console.error('Update vendor error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'حدث خطأ في تحديث البيانات'
    });
  }
};

/**
 * حذف مزود
 * DELETE /api/vendors/:id
 */
exports.deleteVendor = async (req, res) => {
  try {
    const { id } = req.params;
    
    const vendor = await Vendor.findById(id);
    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'المزود غير موجود'
      });
    }
    
    // Check authorization
    if (req.user.role !== 'admin' && vendor.user_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'غير مصرح - ليس لديك صلاحية الحذف'
      });
    }
    
    await Vendor.delete(id);
    
    res.json({
      success: true,
      message: 'تم حذف الملف التجاري بنجاح'
    });
    
  } catch (error) {
    console.error('Delete vendor error:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ في حذف الملف التجاري'
    });
  }
};

/**
 * تحديث حالة المزود
 * PUT /api/vendors/:id/status
 */
exports.updateVendorStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!['pending', 'active', 'suspended', 'expired'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'الحالة غير صالحة'
      });
    }
    
    const vendor = await Vendor.findById(id);
    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'المزود غير موجود'
      });
    }
    
    await Vendor.updateStatus(id, status);
    
    res.json({
      success: true,
      message: 'تم تحديث الحالة بنجاح'
    });
    
  } catch (error) {
    console.error('Update vendor status error:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ في تحديث الحالة'
    });
  }
};

/**
 * تحديث حالة التحقق
 * PUT /api/vendors/:id/verify
 */
exports.verifyVendor = async (req, res) => {
  try {
    const { id } = req.params;
    const { is_verified } = req.body;
    
    const vendor = await Vendor.findById(id);
    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'المزود غير موجود'
      });
    }
    
    await Vendor.verify(id, is_verified);
    
    res.json({
      success: true,
      message: is_verified ? 'تم التحقق من المزود بنجاح' : 'تم إلغاء التحقق بنجاح'
    });
    
  } catch (error) {
    console.error('Verify vendor error:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ في تحديث حالة التحقق'
    });
  }
};

/**
 * تحديث حالة المميز
 * PUT /api/vendors/:id/featured
 */
exports.updateFeaturedStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { is_featured } = req.body;
    
    const vendor = await Vendor.findById(id);
    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'المزود غير موجود'
      });
    }
    
    await Vendor.updateFeatured(id, is_featured);
    
    res.json({
      success: true,
      message: is_featured ? 'تم إضافة المزود للمميزين' : 'تم إزالة المزود من المميزين'
    });
    
  } catch (error) {
    console.error('Update featured status error:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ في تحديث حالة المميز'
    });
  }
};

/**
 * البحث عن مزودين قريبين
 * GET /api/vendors/nearby
 */
exports.getNearbyVendors = async (req, res) => {
  try {
    const { latitude, longitude, radius } = req.query;
    
    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: 'الإحداثيات مطلوبة'
      });
    }
    
    const vendors = await Vendor.findNearby(
      parseFloat(latitude),
      parseFloat(longitude),
      parseFloat(radius) || 10
    );
    
    res.json({
      success: true,
      data: { vendors }
    });
    
  } catch (error) {
    console.error('Get nearby vendors error:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ في البحث عن المزودين القريبين'
    });
  }
};

/**
 * الحصول على أفضل المزودين
 * GET /api/vendors/top-rated
 */
exports.getTopRatedVendors = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    
    const vendors = await Vendor.getTopRated(limit);
    
    res.json({
      success: true,
      data: { vendors }
    });
    
  } catch (error) {
    console.error('Get top rated vendors error:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ في جلب أفضل المزودين'
    });
  }
};

/**
 * الحصول على المزودين المميزين
 * GET /api/vendors/featured
 */
exports.getFeaturedVendors = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    
    const vendors = await Vendor.getFeatured(limit);
    
    res.json({
      success: true,
      data: { vendors }
    });
    
  } catch (error) {
    console.error('Get featured vendors error:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ في جلب المزودين المميزين'
    });
  }
};

/**
 * الحصول على إحصائيات المزود
 * GET /api/vendors/:id/stats
 */
exports.getVendorStats = async (req, res) => {
  try {
    const { id } = req.params;
    
    const vendor = await Vendor.findById(id);
    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'المزود غير موجود'
      });
    }
    
    const stats = await Vendor.getStats(id);
    
    res.json({
      success: true,
      data: { stats }
    });
    
  } catch (error) {
    console.error('Get vendor stats error:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ في جلب الإحصائيات'
    });
  }
};

/**
 * الحصول على ملف المزود للمستخدم الحالي
 * GET /api/vendors/me
 */
exports.getMyVendorProfile = async (req, res) => {
  try {
    const vendor = await Vendor.findByUserId(req.user.id);
    
    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'ليس لديك ملف مزود'
      });
    }
    
    res.json({
      success: true,
      data: { vendor }
    });
    
  } catch (error) {
    console.error('Get my vendor profile error:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ في جلب الملف التجاري'
    });
  }
};

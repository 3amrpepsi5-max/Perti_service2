/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * ⭐ Review Controller
 * معالج التقييمات
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */

const Review = require('../models/Review');
const Vendor = require('../models/Vendor');

/**
 * الحصول على جميع التقييمات
 * GET /api/reviews
 */
exports.getAllReviews = async (req, res) => {
  try {
    const filters = {
      vendor_id: req.query.vendor_id,
      user_id: req.query.user_id,
      rating: req.query.rating,
      is_verified: req.query.is_verified,
      is_flagged: req.query.is_flagged,
      page: req.query.page,
      limit: req.query.limit
    };
    
    const result = await Review.getAll(filters);
    
    res.json({
      success: true,
      data: result
    });
    
  } catch (error) {
    console.error('Get all reviews error:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ في جلب التقييمات'
    });
  }
};

/**
 * الحصول على تقييم محدد
 * GET /api/reviews/:id
 */
exports.getReviewById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const review = await Review.findById(id);
    
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'التقييم غير موجود'
      });
    }
    
    res.json({
      success: true,
      data: { review }
    });
    
  } catch (error) {
    console.error('Get review by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ في جلب التقييم'
    });
  }
};

/**
 * الحصول على تقييمات مزود
 * GET /api/reviews/vendor/:vendorId
 */
exports.getVendorReviews = async (req, res) => {
  try {
    const { vendorId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    
    // Check if vendor exists
    const vendor = await Vendor.findById(vendorId);
    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'المزود غير موجود'
      });
    }
    
    const result = await Review.getByVendorId(vendorId, page, limit);
    
    res.json({
      success: true,
      data: result
    });
    
  } catch (error) {
    console.error('Get vendor reviews error:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ في جلب التقييمات'
    });
  }
};

/**
 * الحصول على تقييمات المستخدم
 * GET /api/reviews/user/:userId
 */
exports.getUserReviews = async (req, res) => {
  try {
    const { userId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    
    const result = await Review.getByUserId(userId, page, limit);
    
    res.json({
      success: true,
      data: result
    });
    
  } catch (error) {
    console.error('Get user reviews error:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ في جلب التقييمات'
    });
  }
};

/**
 * إنشاء تقييم جديد
 * POST /api/reviews
 */
exports.createReview = async (req, res) => {
  try {
    const { vendor_id, rating, comment, images } = req.body;
    
    // Validation
    if (!vendor_id || !rating) {
      return res.status(400).json({
        success: false,
        message: 'المزود والتقييم مطلوبان'
      });
    }
    
    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'التقييم يجب أن يكون بين 1 و 5'
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
    
    // Check if user already reviewed this vendor
    const existingReview = await Review.findByUserAndVendor(req.user.id, vendor_id);
    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: 'لقد قمت بتقييم هذا المزود بالفعل'
      });
    }
    
    const reviewData = {
      vendor_id,
      user_id: req.user.id,
      rating,
      comment,
      images: images ? JSON.stringify(images) : null
    };
    
    const review = await Review.create(reviewData);
    
    res.status(201).json({
      success: true,
      message: 'تم إضافة التقييم بنجاح',
      data: { review }
    });
    
  } catch (error) {
    console.error('Create review error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'حدث خطأ في إضافة التقييم'
    });
  }
};

/**
 * تحديث تقييم
 * PUT /api/reviews/:id
 */
exports.updateReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, comment, images } = req.body;
    
    // Check if review exists
    const review = await Review.findById(id);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'التقييم غير موجود'
      });
    }
    
    // Check authorization (only review owner can update)
    if (review.user_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'غير مصرح - ليس لديك صلاحية التعديل'
      });
    }
    
    // Validate rating if provided
    if (rating && (rating < 1 || rating > 5)) {
      return res.status(400).json({
        success: false,
        message: 'التقييم يجب أن يكون بين 1 و 5'
      });
    }
    
    const updateData = {
      rating,
      comment,
      images: images ? JSON.stringify(images) : undefined
    };
    
    const updatedReview = await Review.update(id, updateData);
    
    res.json({
      success: true,
      message: 'تم تحديث التقييم بنجاح',
      data: { review: updatedReview }
    });
    
  } catch (error) {
    console.error('Update review error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'حدث خطأ في تحديث التقييم'
    });
  }
};

/**
 * حذف تقييم
 * DELETE /api/reviews/:id
 */
exports.deleteReview = async (req, res) => {
  try {
    const { id } = req.params;
    
    const review = await Review.findById(id);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'التقييم غير موجود'
      });
    }
    
    // Check authorization (review owner or admin can delete)
    if (req.user.role !== 'admin' && review.user_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'غير مصرح - ليس لديك صلاحية الحذف'
      });
    }
    
    await Review.delete(id);
    
    res.json({
      success: true,
      message: 'تم حذف التقييم بنجاح'
    });
    
  } catch (error) {
    console.error('Delete review error:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ في حذف التقييم'
    });
  }
};

/**
 * إضافة رد المزود على التقييم
 * POST /api/reviews/:id/response
 */
exports.addVendorResponse = async (req, res) => {
  try {
    const { id } = req.params;
    const { response } = req.body;
    
    if (!response) {
      return res.status(400).json({
        success: false,
        message: 'الرد مطلوب'
      });
    }
    
    const review = await Review.findById(id);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'التقييم غير موجود'
      });
    }
    
    // Check if user is the vendor owner
    const vendor = await Vendor.findById(review.vendor_id);
    if (vendor.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'غير مصرح - يمكن للمزود فقط الرد على التقييم'
      });
    }
    
    await Review.addResponse(id, response);
    
    const updatedReview = await Review.findById(id);
    
    res.json({
      success: true,
      message: 'تم إضافة الرد بنجاح',
      data: { review: updatedReview }
    });
    
  } catch (error) {
    console.error('Add vendor response error:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ في إضافة الرد'
    });
  }
};

/**
 * الإبلاغ عن تقييم
 * POST /api/reviews/:id/flag
 */
exports.flagReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    
    if (!reason) {
      return res.status(400).json({
        success: false,
        message: 'سبب الإبلاغ مطلوب'
      });
    }
    
    const review = await Review.findById(id);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'التقييم غير موجود'
      });
    }
    
    await Review.flag(id, reason);
    
    res.json({
      success: true,
      message: 'تم الإبلاغ عن التقييم بنجاح'
    });
    
  } catch (error) {
    console.error('Flag review error:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ في الإبلاغ عن التقييم'
    });
  }
};

/**
 * إلغاء الإبلاغ عن تقييم
 * POST /api/reviews/:id/unflag
 */
exports.unflagReview = async (req, res) => {
  try {
    const { id } = req.params;
    
    const review = await Review.findById(id);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'التقييم غير موجود'
      });
    }
    
    await Review.unflag(id);
    
    res.json({
      success: true,
      message: 'تم إلغاء الإبلاغ بنجاح'
    });
    
  } catch (error) {
    console.error('Unflag review error:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ في إلغاء الإبلاغ'
    });
  }
};

/**
 * التحقق من التقييم
 * PUT /api/reviews/:id/verify
 */
exports.verifyReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { is_verified } = req.body;
    
    const review = await Review.findById(id);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'التقييم غير موجود'
      });
    }
    
    await Review.verify(id, is_verified);
    
    res.json({
      success: true,
      message: is_verified ? 'تم التحقق من التقييم بنجاح' : 'تم إلغاء التحقق بنجاح'
    });
    
  } catch (error) {
    console.error('Verify review error:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ في التحقق من التقييم'
    });
  }
};

/**
 * الحصول على إحصائيات التقييمات لمزود
 * GET /api/reviews/vendor/:vendorId/stats
 */
exports.getVendorReviewStats = async (req, res) => {
  try {
    const { vendorId } = req.params;
    
    const vendor = await Vendor.findById(vendorId);
    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'المزود غير موجود'
      });
    }
    
    const stats = await Review.getVendorStats(vendorId);
    
    res.json({
      success: true,
      data: { stats }
    });
    
  } catch (error) {
    console.error('Get vendor review stats error:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ في جلب إحصائيات التقييمات'
    });
  }
};

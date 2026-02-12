/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * 💳 Subscription Controller
 * متحكم الاشتراكات
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */

const Subscription = require('../models/Subscription');

/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * GET SUBSCRIPTION PLANS
 * الحصول على خطط الاشتراك المتاحة
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */
exports.getPlans = async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      message: 'تم جلب خطط الاشتراك بنجاح',
      data: {
        plans: Subscription.PLANS
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * CREATE SUBSCRIPTION
 * إنشاء اشتراك جديد
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */
exports.createSubscription = async (req, res, next) => {
  try {
    const { vendor_id, plan, payment_method, transaction_id, auto_renew } = req.body;

    // Validate required fields
    if (!vendor_id || !plan) {
      return res.status(400).json({
        success: false,
        message: 'يجب توفير معرف المزود وخطة الاشتراك'
      });
    }

    // Validate plan
    if (!Subscription.PLANS[plan]) {
      return res.status(400).json({
        success: false,
        message: 'خطة الاشتراك غير صحيحة',
        availablePlans: Object.keys(Subscription.PLANS)
      });
    }

    // Create subscription
    const subscription = await Subscription.create({
      vendor_id,
      plan,
      payment_method,
      transaction_id,
      auto_renew: auto_renew || false,
      payment_status: transaction_id ? 'completed' : 'pending',
      status: 'active'
    });

    res.status(201).json({
      success: true,
      message: 'تم إنشاء الاشتراك بنجاح',
      data: {
        subscription
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * GET ALL SUBSCRIPTIONS
 * الحصول على جميع الاشتراكات
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */
exports.getAllSubscriptions = async (req, res, next) => {
  try {
    const filters = {
      vendor_id: req.query.vendor_id,
      plan: req.query.plan,
      status: req.query.status,
      payment_status: req.query.payment_status,
      expiring_soon: req.query.expiring_soon === 'true',
      expired: req.query.expired === 'true',
      page: req.query.page,
      limit: req.query.limit,
      sort: req.query.sort,
      order: req.query.order
    };

    const result = await Subscription.getAll(filters);

    res.status(200).json({
      success: true,
      message: 'تم جلب الاشتراكات بنجاح',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * GET SUBSCRIPTION BY ID
 * الحصول على اشتراك محدد
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */
exports.getSubscriptionById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const subscription = await Subscription.findById(id);

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'الاشتراك غير موجود'
      });
    }

    res.status(200).json({
      success: true,
      message: 'تم جلب الاشتراك بنجاح',
      data: {
        subscription
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * GET VENDOR SUBSCRIPTIONS
 * الحصول على اشتراكات مزود
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */
exports.getVendorSubscriptions = async (req, res, next) => {
  try {
    const { vendorId } = req.params;

    const filters = {
      page: req.query.page,
      limit: req.query.limit,
      status: req.query.status,
      sort: req.query.sort,
      order: req.query.order
    };

    const result = await Subscription.getVendorSubscriptions(vendorId, filters);

    res.status(200).json({
      success: true,
      message: 'تم جلب اشتراكات المزود بنجاح',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * GET ACTIVE SUBSCRIPTION
 * الحصول على الاشتراك النشط لمزود
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */
exports.getActiveSubscription = async (req, res, next) => {
  try {
    const { vendorId } = req.params;

    const subscription = await Subscription.getActiveSubscription(vendorId);

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'لا يوجد اشتراك نشط لهذا المزود'
      });
    }

    res.status(200).json({
      success: true,
      message: 'تم جلب الاشتراك النشط بنجاح',
      data: {
        subscription
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * GET EXPIRING SUBSCRIPTIONS
 * الحصول على الاشتراكات التي توشك على الانتهاء
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */
exports.getExpiringSubscriptions = async (req, res, next) => {
  try {
    const days = parseInt(req.query.days) || 7;

    const subscriptions = await Subscription.getExpiringSubscriptions(days);

    res.status(200).json({
      success: true,
      message: `تم جلب الاشتراكات التي تنتهي خلال ${days} أيام`,
      data: {
        subscriptions,
        count: subscriptions.length
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * UPDATE SUBSCRIPTION
 * تحديث اشتراك
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */
exports.updateSubscription = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const subscription = await Subscription.update(id, updateData);

    res.status(200).json({
      success: true,
      message: 'تم تحديث الاشتراك بنجاح',
      data: {
        subscription
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * UPDATE PAYMENT STATUS
 * تحديث حالة الدفع
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */
exports.updatePaymentStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { payment_status, transaction_id } = req.body;

    if (!payment_status) {
      return res.status(400).json({
        success: false,
        message: 'يجب توفير حالة الدفع'
      });
    }

    const subscription = await Subscription.updatePaymentStatus(
      id,
      payment_status,
      transaction_id
    );

    res.status(200).json({
      success: true,
      message: 'تم تحديث حالة الدفع بنجاح',
      data: {
        subscription
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * ACTIVATE SUBSCRIPTION
 * تفعيل اشتراك
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */
exports.activateSubscription = async (req, res, next) => {
  try {
    const { id } = req.params;

    const subscription = await Subscription.activate(id);

    res.status(200).json({
      success: true,
      message: 'تم تفعيل الاشتراك بنجاح',
      data: {
        subscription
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * CANCEL SUBSCRIPTION
 * إلغاء اشتراك
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */
exports.cancelSubscription = async (req, res, next) => {
  try {
    const { id } = req.params;

    const subscription = await Subscription.cancel(id);

    res.status(200).json({
      success: true,
      message: 'تم إلغاء الاشتراك بنجاح',
      data: {
        subscription
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * RENEW SUBSCRIPTION
 * تجديد اشتراك
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */
exports.renewSubscription = async (req, res, next) => {
  try {
    const { vendorId } = req.params;
    const { plan } = req.body;

    const newSubscription = await Subscription.renew(vendorId, plan);

    res.status(201).json({
      success: true,
      message: 'تم تجديد الاشتراك بنجاح',
      data: {
        subscription: newSubscription
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * DELETE SUBSCRIPTION
 * حذف اشتراك
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */
exports.deleteSubscription = async (req, res, next) => {
  try {
    const { id } = req.params;

    await Subscription.delete(id);

    res.status(200).json({
      success: true,
      message: 'تم حذف الاشتراك بنجاح'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * GET SUBSCRIPTION STATISTICS
 * الحصول على إحصائيات الاشتراكات
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */
exports.getSubscriptionStats = async (req, res, next) => {
  try {
    const stats = await Subscription.getStats();

    res.status(200).json({
      success: true,
      message: 'تم جلب الإحصائيات بنجاح',
      data: {
        stats
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * GET MONTHLY REVENUE
 * الحصول على الإيرادات الشهرية
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */
exports.getMonthlyRevenue = async (req, res, next) => {
  try {
    const months = parseInt(req.query.months) || 12;

    const revenue = await Subscription.getMonthlyRevenue(months);

    res.status(200).json({
      success: true,
      message: 'تم جلب الإيرادات الشهرية بنجاح',
      data: {
        revenue
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * GET PLAN DISTRIBUTION
 * الحصول على توزيع الخطط
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */
exports.getPlanDistribution = async (req, res, next) => {
  try {
    const distribution = await Subscription.getPlanDistribution();

    res.status(200).json({
      success: true,
      message: 'تم جلب توزيع الخطط بنجاح',
      data: {
        distribution
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * UPDATE EXPIRED SUBSCRIPTIONS (CRON JOB)
 * تحديث الاشتراكات المنتهية (مهمة مجدولة)
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */
exports.updateExpiredSubscriptions = async (req, res, next) => {
  try {
    const count = await Subscription.updateExpiredSubscriptions();

    res.status(200).json({
      success: true,
      message: `تم تحديث ${count} اشتراك منتهي`,
      data: {
        updatedCount: count
      }
    });
  } catch (error) {
    next(error);
  }
};

import AuditLog from '../models/AuditLog.js';

export const getAuditLogs = async (req, res) => {
  try {
    const { patientUid, action, result, search, page = 1, limit = 50 } = req.query;
    let filter = {};

    if (req.user.role === 'PATIENT') {
      filter.patientUid = req.user.patientUid;
    } else if (patientUid) {
      filter.patientUid = patientUid;
    }

    if (action) filter.action = action;
    if (result) filter.result = result;
    if (search) {
      filter.$or = [
        { userName: new RegExp(search, 'i') },
        { details: new RegExp(search, 'i') },
        { resource: new RegExp(search, 'i') },
        { auditId: new RegExp(search, 'i') }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const logs = await AuditLog.find(filter)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await AuditLog.countDocuments(filter);

    res.json({
      success: true,
      count: logs.length,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
      logs
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

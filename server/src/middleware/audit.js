import AuditLog from '../models/AuditLog.js';
import { v4 as uuidv4 } from 'uuid';

export const logAuditEvent = async (arg1, arg2, arg3) => {
  try {
    let opts = {};
    if (arg1 && (arg1.headers || arg1.user || typeof arg2 === 'string')) {
      // Called as logAuditEvent(req, action, details)
      const req = arg1;
      const action = arg2;
      const details = arg3 || {};
      opts = {
        userId: req.user?._id || req.user?.id || 'SYSTEM',
        userName: req.user?.name || 'System Process',
        userRole: req.user?.role || 'SYSTEM',
        patientUid: details.patientUid || req.body?.patientUid || req.params?.uid || null,
        action: action,
        resource: details.resource || 'GOVERNMENT_SCHEME',
        purpose: details.purpose || 'Government Welfare Application',
        ipAddress: req.ip || req.connection?.remoteAddress || '127.0.0.1',
        result: details.result || 'SUCCESS',
        details: typeof details === 'string' ? details : JSON.stringify(details)
      };
    } else if (arg1 && typeof arg1 === 'object') {
      opts = arg1;
    }

    const {
      userId = 'SYSTEM',
      userName = 'System Process',
      userRole = 'SYSTEM',
      patientUid = null,
      action,
      resource,
      purpose = 'Clinical Care',
      ipAddress = '127.0.0.1',
      result = 'SUCCESS',
      details = ''
    } = opts;

    const auditId = `AUD-${Date.now()}-${uuidv4().substring(0, 6).toUpperCase()}`;
    const log = new AuditLog({
      auditId,
      userId: String(userId),
      userName,
      userRole,
      patientUid,
      action,
      resource,
      purpose,
      ipAddress,
      result,
      details: typeof details === 'object' ? JSON.stringify(details) : String(details),
      timestamp: new Date()
    });
    await log.save();
    return log;
  } catch (err) {
    console.error('Failed to write audit log:', err.message);
  }
};

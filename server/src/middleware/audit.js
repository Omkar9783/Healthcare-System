import AuditLog from '../models/AuditLog.js';
import { v4 as uuidv4 } from 'uuid';

export const logAuditEvent = async ({
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
}) => {
  try {
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
      details,
      timestamp: new Date()
    });
    await log.save();
    return log;
  } catch (err) {
    console.error('Failed to write audit log:', err.message);
  }
};

// Master RBAC Role to Permission Mapping
export const ROLE_PERMISSIONS = {
  ADMIN: [
    'patient.read', 'patient.update', 'patient.create',
    'medical_record.read', 'medical_record.create', 'medical_record.update',
    'prescription.read', 'prescription.create', 'prescription.update',
    'lab_report.read', 'lab_report.create', 'lab_report.update',
    'vitals.read', 'vitals.create',
    'consent.read', 'consent.create', 'consent.revoke',
    'emergency.access', 'audit.read', 'user.manage', 'analytics.read'
  ],
  DOCTOR: [
    'patient.read',
    'medical_record.read', 'medical_record.create', 'medical_record.update',
    'prescription.read', 'prescription.create',
    'lab_report.read', 'lab_report.create',
    'vitals.read', 'vitals.create',
    'ai_summary.generate'
  ],
  NURSE: [
    'patient.read',
    'medical_record.read_limited',
    'prescription.read',
    'lab_report.read_limited',
    'vitals.read', 'vitals.create'
  ],
  LAB_TECHNICIAN: [
    'patient.read_limited',
    'lab_report.read', 'lab_report.create', 'lab_report.update'
  ],
  PHARMACIST: [
    'patient.read_limited',
    'prescription.read', 'prescription.dispense'
  ],
  PATIENT: [
    'patient.read_own',
    'medical_record.read_own',
    'prescription.read_own',
    'lab_report.read_own',
    'vitals.read_own',
    'consent.read_own', 'consent.create_own', 'consent.revoke_own',
    'qr.manage_own'
  ],
  EMERGENCY_STAFF: [
    'emergency.access',
    'emergency.read_critical'
  ]
};

export const requireRole = (allowedRoles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access Denied. Role '${req.user.role}' is not authorized for this operation.`
      });
    }

    next();
  };
};

export const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }

    const userPermissions = ROLE_PERMISSIONS[req.user.role] || [];
    if (!userPermissions.includes(permission)) {
      return res.status(403).json({
        success: false,
        message: `Access Denied. Missing permission '${permission}'.`
      });
    }

    next();
  };
};

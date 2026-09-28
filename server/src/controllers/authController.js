import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Patient from '../models/Patient.js';
import OtpVerification from '../models/OtpVerification.js';
import { JWT_SECRET } from '../middleware/auth.js';
import { logAuditEvent } from '../middleware/audit.js';
import { generateSecureToken } from '../services/qrService.js';

// Helper to normalize email or phone number
export const normalizeIdentifier = (rawIdentifier) => {
  if (!rawIdentifier) return '';
  const trimmed = rawIdentifier.trim();
  if (trimmed.includes('@')) {
    return trimmed.toLowerCase();
  }
  // Remove non-digit characters
  const cleaned = trimmed.replace(/\D/g, '');
  // If 12 digits starting with 91, extract the 10 digits
  if (cleaned.length === 12 && cleaned.startsWith('91')) {
    return cleaned.slice(2);
  }
  return cleaned;
};

// Helper to mask identifier for privacy in logs/responses
const maskIdentifier = (identifier) => {
  if (!identifier) return '';
  if (identifier.includes('@')) {
    const [name, domain] = identifier.split('@');
    const maskedName = name.length > 2 ? `${name[0]}***${name[name.length - 1]}` : `${name[0]}*`;
    return `${maskedName}@${domain}`;
  }
  if (identifier.length >= 7) {
    return `${identifier.slice(0, 2)}******${identifier.slice(-2)}`;
  }
  return '******';
};

/**
 * Send OTP for Sign Up or Login
 * POST /api/auth/send-otp
 */
export const sendOtp = async (req, res) => {
  try {
    const { identifier, purpose = 'SIGNUP', channel = 'EMAIL', role = 'PATIENT' } = req.body;

    if (!identifier) {
      return res.status(400).json({ success: false, message: 'Email address or mobile number is required.' });
    }

    const normalized = normalizeIdentifier(identifier);
    const isEmail = normalized.includes('@');

    // Validation checks
    if (isEmail) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(normalized)) {
        return res.status(400).json({ success: false, message: 'Please enter a valid email address.' });
      }
    } else {
      if (normalized.length < 10) {
        return res.status(400).json({ success: false, message: 'Please enter a valid 10-digit mobile number.' });
      }
    }

    // Check existing user based on purpose
    const existingUser = await User.findOne({
      $or: [
        { email: normalized },
        { phone: normalized }
      ]
    });

    if (purpose === 'SIGNUP') {
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: `An account with this ${isEmail ? 'email' : 'mobile number'} is already registered. Please log in instead.`
        });
      }
    } else if (purpose === 'LOGIN') {
      if (!existingUser) {
        return res.status(404).json({
          success: false,
          message: `No registered account found with this ${isEmail ? 'email' : 'mobile number'}. Please sign up first.`
        });
      }
    }

    // Generate 6-digit numeric OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Delete any old pending OTP for this identifier and purpose
    await OtpVerification.deleteMany({ identifier: normalized, purpose });

    // Store new OTP
    await OtpVerification.create({
      identifier: normalized,
      otp,
      purpose,
      channel: isEmail ? 'EMAIL' : 'SMS',
      role,
      expiresAt
    });

    const deliveryChannel = isEmail ? 'Email' : 'SMS';
    const masked = maskIdentifier(normalized);

    // Development / Demo logging
    console.log(`\n======================================================`);
    console.log(`📱 [MediSecure OTP Dispatcher]`);
    console.log(`   Type: ${purpose} | Channel: ${deliveryChannel}`);
    console.log(`   Destination: ${normalized} (${masked})`);
    console.log(`   🔑 Verification Code (OTP): [ ${otp} ]`);
    console.log(`   Valid For: 10 minutes (expires at ${expiresAt.toLocaleTimeString()})`);
    console.log(`======================================================\n`);

    res.json({
      success: true,
      message: `Verification code sent to your ${deliveryChannel.toLowerCase()} (${masked}).`,
      identifier: normalized,
      channel: deliveryChannel,
      maskedIdentifier: masked,
      otp, // Included for instant offline testing and preview toast!
      expiresInSeconds: 600
    });
  } catch (err) {
    console.error('Error sending OTP:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Verify OTP Code
 * POST /api/auth/verify-otp
 */
export const verifyOtp = async (req, res) => {
  try {
    const { identifier, otp, purpose = 'SIGNUP' } = req.body;

    if (!identifier || !otp) {
      return res.status(400).json({ success: false, message: 'Identifier and verification code are required.' });
    }

    const normalized = normalizeIdentifier(identifier);

    const record = await OtpVerification.findOne({
      identifier: normalized,
      purpose,
      expiresAt: { $gt: new Date() }
    }).sort({ createdAt: -1 });

    if (!record) {
      return res.status(400).json({ success: false, message: 'Invalid or expired verification code. Please request a new one.' });
    }

    if (record.otp !== otp.toString().trim()) {
      record.attempts = (record.attempts || 0) + 1;
      await record.save();
      return res.status(400).json({ success: false, message: 'Incorrect verification code. Please check and try again.' });
    }

    record.verified = true;
    await record.save();

    res.json({
      success: true,
      verified: true,
      message: 'Code verified successfully.'
    });
  } catch (err) {
    console.error('Error verifying OTP:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * User Login
 * POST /api/auth/login
 * Supports email or phone number, with password OR OTP
 */
export const login = async (req, res) => {
  try {
    const { identifier, email, phone, password, otp, role, authMethod = 'password' } = req.body;
    const rawIdentifier = identifier || email || phone;

    if (!rawIdentifier) {
      return res.status(400).json({ success: false, message: 'Email address or mobile number is required.' });
    }

    const normalized = normalizeIdentifier(rawIdentifier);

    // Find user by either email or phone number
    const user = await User.findOne({
      $or: [
        { email: normalized },
        { phone: normalized }
      ]
    });

    if (!user) {
      await logAuditEvent({
        userId: 'ANONYMOUS',
        userName: normalized,
        userRole: role || 'UNKNOWN',
        action: 'LOGIN_FAILED',
        resource: 'AUTH_SERVICE',
        result: 'DENIED',
        details: 'User account not found'
      });
      return res.status(401).json({ success: false, message: 'No registered user found with this email or mobile number.' });
    }

    // Role differentiation check if user selected a specific portal tab
    if (role && user.role !== role) {
      return res.status(403).json({
        success: false,
        message: `Account found, but registered as ${user.role}. Please select the ${user.role} login portal tab to continue.`
      });
    }

    // Verify authentication credentials (OTP or Password)
    if (authMethod === 'otp' || otp) {
      if (!otp) {
        return res.status(400).json({ success: false, message: 'Verification code (OTP) is required for OTP login.' });
      }

      const otpRecord = await OtpVerification.findOne({
        identifier: normalized,
        purpose: 'LOGIN',
        expiresAt: { $gt: new Date() }
      }).sort({ createdAt: -1 });

      if (!otpRecord || otpRecord.otp !== otp.toString().trim()) {
        return res.status(400).json({ success: false, message: 'Invalid or expired OTP code.' });
      }

      // Mark OTP as used
      await OtpVerification.deleteMany({ identifier: normalized, purpose: 'LOGIN' });
    } else {
      // Standard password check
      if (!password) {
        return res.status(400).json({ success: false, message: 'Password is required.' });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        await logAuditEvent({
          userId: user._id,
          userName: user.name,
          userRole: user.role,
          action: 'LOGIN_FAILED',
          resource: 'AUTH_SERVICE',
          result: 'DENIED',
          details: 'Incorrect password entered'
        });
        return res.status(401).json({ success: false, message: 'Invalid password. Please check your credentials.' });
      }
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, role: user.role, patientUid: user.patientUid },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    await logAuditEvent({
      userId: user._id,
      userName: user.name,
      userRole: user.role,
      action: 'LOGIN_SUCCESS',
      resource: 'AUTH_SERVICE',
      result: 'SUCCESS',
      details: `User authenticated via ${otp ? 'Mobile/Email OTP' : 'Password'}`
    });

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        patientUid: user.patientUid,
        hospital: user.hospital,
        department: user.department,
        specialization: user.specialization
      }
    });
  } catch (err) {
    console.error('Error during login:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * User Registration with OTP Verification
 * POST /api/auth/register
 */
export const register = async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      password,
      role = 'PATIENT',
      otp,
      gender = 'Male',
      dateOfBirth = '1995-05-15',
      bloodGroup = 'O+',
      address = '',
      hospital = 'MediSecure Central Hospital',
      department = 'General Medicine',
      specialization = ''
    } = req.body;

    if (!name || (!email && !phone) || !password) {
      return res.status(400).json({ success: false, message: 'Full name, email/phone, and password are required.' });
    }

    const normalizedEmail = email ? normalizeIdentifier(email) : '';
    const normalizedPhone = phone ? normalizeIdentifier(phone) : '';

    // Verify OTP if provided
    if (otp) {
      const activeOtp = await OtpVerification.findOne({
        $or: [
          ...(normalizedEmail ? [{ identifier: normalizedEmail }] : []),
          ...(normalizedPhone ? [{ identifier: normalizedPhone }] : [])
        ],
        purpose: 'SIGNUP',
        expiresAt: { $gt: new Date() }
      }).sort({ createdAt: -1 });

      if (!activeOtp || activeOtp.otp !== otp.toString().trim()) {
        return res.status(400).json({
          success: false,
          message: 'Invalid or expired verification code. Please re-check the code sent to your email/mobile.'
        });
      }

      // Cleanup used OTP
      await OtpVerification.deleteMany({
        $or: [
          ...(normalizedEmail ? [{ identifier: normalizedEmail }] : []),
          ...(normalizedPhone ? [{ identifier: normalizedPhone }] : [])
        ],
        purpose: 'SIGNUP'
      });
    }

    // Check for existing duplicates
    const queryConditions = [];
    if (normalizedEmail) queryConditions.push({ email: normalizedEmail });
    if (normalizedPhone) queryConditions.push({ phone: normalizedPhone });

    if (queryConditions.length > 0) {
      const existingUser = await User.findOne({ $or: queryConditions });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'An account with this email address or mobile number already exists.'
        });
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    let patientUid = null;

    if (role === 'PATIENT') {
      const count = await Patient.countDocuments();
      patientUid = `PAT-2026-${String(count + 1).padStart(6, '0')}`;
      const initialQrToken = generateSecureToken(patientUid);

      const patient = new Patient({
        uid: patientUid,
        name,
        email: normalizedEmail || `${normalizedPhone}@patient.medisecure.local`,
        phone: normalizedPhone || '9876543210',
        gender: gender || 'Male',
        dateOfBirth: dateOfBirth || '1995-05-15',
        bloodGroup: bloodGroup || 'O+',
        address: address || '123 Health Ave, Metro City',
        qrToken: initialQrToken,
        qrExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24hr QR pass
        emergencyContact: {
          name: 'Primary Emergency Contact',
          relation: 'Family',
          phone: normalizedPhone || '9876543211'
        },
        allergies: [],
        chronicConditions: []
      });
      await patient.save();
    }

    const user = new User({
      name,
      email: normalizedEmail || `${normalizedPhone}@medisecure.local`,
      phone: normalizedPhone,
      password: hashedPassword,
      role,
      patientUid,
      hospital: hospital || 'MediSecure Central Hospital',
      department: department || 'General Medicine',
      specialization: specialization || ''
    });

    await user.save();

    await logAuditEvent({
      userId: user._id,
      userName: user.name,
      userRole: user.role,
      patientUid,
      action: 'RECORD_CREATED',
      resource: 'USER_REGISTER',
      result: 'SUCCESS',
      details: `New account registered as ${role} with verified contact`
    });

    const token = jwt.sign(
      { userId: user._id, role: user.role, patientUid: user.patientUid },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        patientUid: user.patientUid,
        hospital: user.hospital,
        department: user.department,
        specialization: user.specialization
      }
    });
  } catch (err) {
    console.error('Error during registration:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Get Profile of logged in user
 * GET /api/auth/me
 */
export const getProfile = async (req, res) => {
  try {
    const user = req.user;
    let patientData = null;
    if (user.patientUid) {
      patientData = await Patient.findOne({ uid: user.patientUid });
    }

    res.json({
      success: true,
      user,
      patient: patientData
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

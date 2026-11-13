import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

import authRoutes from './routes/authRoutes.js';
import patientRoutes from './routes/patientRoutes.js';
import qrRoutes from './routes/qrRoutes.js';
import recordRoutes from './routes/recordRoutes.js';
import prescriptionRoutes from './routes/prescriptionRoutes.js';
import labRoutes from './routes/labRoutes.js';
import vitalsRoutes from './routes/vitalsRoutes.js';
import appointmentRoutes from './routes/appointmentRoutes.js';
import consentRoutes from './routes/consentRoutes.js';
import emergencyRoutes from './routes/emergencyRoutes.js';
import auditRoutes from './routes/auditRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import schemeRoutes from './routes/schemeRoutes.js';
import schemeAssistantRoutes from './routes/schemeAssistantRoutes.js';
import documentRoutes from './routes/documentRoutes.js';

import { seedDatabase } from './seed.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// API Routes Setup
app.use('/api/auth', authRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/qr', qrRoutes);
app.use('/api/medical-records', recordRoutes);
app.use('/api/prescriptions', prescriptionRoutes);
app.use('/api/labs', labRoutes);
app.use('/api/vitals', vitalsRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/consent', consentRoutes);
app.use('/api/emergency', emergencyRoutes);
app.use('/api/audit-logs', auditRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/schemes', schemeRoutes);
app.use('/api/schemes/assistant', schemeAssistantRoutes);
app.use('/api/documents', documentRoutes);

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'MediSecure Backend API',
    version: '1.0.0',
    fhirReady: true,
    timestamp: new Date().toISOString()
  });
});

// Start Mongo Database (Fallback to in-memory MongoDB for seamless out-of-the-box execution)
const connectDB = async () => {
  let mongoUri = process.env.MONGODB_URI;

  if (mongoUri && !mongoUri.includes('<db_password>')) {
    try {
      await mongoose.connect(mongoUri);
      console.log(`✅ MongoDB connected successfully to Configured Cluster`);
      await seedDatabase();
      return;
    } catch (err) {
      console.error('⚠️ Could not connect to configured MongoDB cluster (Bad Auth / Network issue). Falling back to In-Memory DB...');
    }
  } else if (mongoUri && mongoUri.includes('<db_password>')) {
    console.log('⚠️ MONGODB_URI contains placeholder <db_password>. Falling back to In-Memory DB...');
  }

  try {
    console.log('⚡ Spinning up in-memory MongoDB server...');
    const mongoServer = await MongoMemoryServer.create();
    mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
    console.log('✅ Connected successfully to In-Memory MongoDB');
    await seedDatabase();
  } catch (err) {
    console.error('❌ Critical MongoDB Error:', err);
    process.exit(1);
  }
};

const startServer = (port) => {
  const server = app.listen(port, () => {
    console.log(`🚀 MediSecure Full-Stack Server running on port ${port}`);
    console.log(`🌐 API Endpoint: http://localhost:${port}/api`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.log(`⚠️ Port ${port} is in use, retrying on port ${port + 1}...`);
      startServer(port + 1);
    } else {
      console.error('Server error:', err);
    }
  });
};

connectDB().then(() => {
  startServer(PORT);
});


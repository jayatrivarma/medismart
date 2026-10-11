import mongoose, { Schema, Document } from 'mongoose';

// User Schema
export interface IUser extends Document {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: 'patient' | 'doctor' | 'admin';
  phone?: string;
  age?: number;
  gender?: string;
  bloodGroup?: string;
  address?: string;
  assignedDoctorId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['patient', 'doctor', 'admin'], default: 'patient' },
  phone: { type: String, default: '' },
  age: { type: Number },
  gender: { type: String, default: '' },
  bloodGroup: { type: String, default: '' },
  address: { type: String, default: '' },
  assignedDoctorId: { type: String, default: null }
}, { timestamps: true });

// Doctor Schema
export interface IDoctor extends Document {
  fullName: string;
  specialization: string;
  qualifications: string;
  experienceYears: number | null;
  experienceDisplay: string;
  hospitalAffiliations: string[];
  hospitalAddress: string;
  locality: string;
  city: string;
  state: string;
  consultationFee: number | null;
  appointmentModes: string[];
  sourceUrl: string;
  lastVerifiedAt: string;
  verificationStatus: 'Verified' | 'Pending Review' | 'Hospital Directory Confirmed';
  isActive: boolean;
  languages?: string[];
  availabilityNote?: string;
  demoScheduleTimes?: string[];
  createdAt: Date;
  updatedAt: Date;
}

const DoctorSchema = new Schema<IDoctor>({
  fullName: { type: String, required: true },
  specialization: { type: String, required: true, index: true },
  qualifications: { type: String, default: '' },
  experienceYears: { type: Number, default: null },
  experienceDisplay: { type: String, default: '' },
  hospitalAffiliations: [{ type: String }],
  hospitalAddress: { type: String, default: '' },
  locality: { type: String, default: '', index: true },
  city: { type: String, default: 'Visakhapatnam' },
  state: { type: String, default: 'Andhra Pradesh' },
  consultationFee: { type: Number, default: null },
  appointmentModes: [{ type: String }],
  sourceUrl: { type: String, default: '' },
  lastVerifiedAt: { type: String, default: '' },
  verificationStatus: { 
    type: String, 
    enum: ['Verified', 'Pending Review', 'Hospital Directory Confirmed'], 
    default: 'Verified' 
  },
  isActive: { type: Boolean, default: true },
  languages: [{ type: String }],
  availabilityNote: { type: String, default: '' },
  demoScheduleTimes: [{ type: String }]
}, { timestamps: true });

// Hospital Schema
export interface IHospital extends Document {
  name: string;
  network: string;
  address: string;
  locality: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
  emergencyPhone: string;
  sourceUrl: string;
  verified: boolean;
  totalDoctors: number;
}

const HospitalSchema = new Schema<IHospital>({
  name: { type: String, required: true },
  network: { type: String, default: '' },
  address: { type: String, default: '' },
  locality: { type: String, default: '', index: true },
  city: { type: String, default: 'Visakhapatnam' },
  state: { type: String, default: 'Andhra Pradesh' },
  pincode: { type: String, default: '' },
  phone: { type: String, default: '' },
  emergencyPhone: { type: String, default: '' },
  sourceUrl: { type: String, default: '' },
  verified: { type: Boolean, default: true },
  totalDoctors: { type: Number, default: 0 }
}, { timestamps: true });

// Appointment Schema
export interface IAppointment extends Document {
  appointmentId: string;
  patientId: string;
  patientName: string;
  patientEmail: string;
  patientPhone: string;
  doctorId: string;
  doctorName: string;
  specialization: string;
  hospitalName: string;
  appointmentDate: string; // YYYY-MM-DD
  appointmentTime: string; // HH:MM AM/PM
  status: 'Confirmed' | 'Checked in' | 'Waiting' | 'In consultation' | 'Completed' | 'Cancelled' | 'No-show';
  queueNumber: number;
  consultationFee: number | null;
  mode: string;
  symptoms: string;
  cancellationReason?: string;
  rescheduledFrom?: string;
  qrToken: string;
  isDemonstrationSchedule: boolean;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const AppointmentSchema = new Schema<IAppointment>({
  appointmentId: { type: String, required: true, unique: true },
  patientId: { type: String, required: true, index: true },
  patientName: { type: String, required: true },
  patientEmail: { type: String, required: true },
  patientPhone: { type: String, default: '' },
  doctorId: { type: String, required: true, index: true },
  doctorName: { type: String, required: true },
  specialization: { type: String, required: true },
  hospitalName: { type: String, required: true },
  appointmentDate: { type: String, required: true, index: true },
  appointmentTime: { type: String, required: true },
  status: {
    type: String,
    enum: ['Confirmed', 'Checked in', 'Waiting', 'In consultation', 'Completed', 'Cancelled', 'No-show'],
    default: 'Confirmed',
    index: true
  },
  queueNumber: { type: Number, required: true },
  consultationFee: { type: Number, default: null },
  mode: { type: String, default: 'In-Person' },
  symptoms: { type: String, default: '' },
  cancellationReason: { type: String, default: '' },
  rescheduledFrom: { type: String, default: '' },
  qrToken: { type: String, required: true },
  isDemonstrationSchedule: { type: Boolean, default: true },
  notes: { type: String, default: '' }
}, { timestamps: true });

// Prevent double booking at the same doctor, date and time
AppointmentSchema.index({ doctorId: 1, appointmentDate: 1, appointmentTime: 1, status: 1 });

// Queue Schema
export interface IQueue extends Document {
  doctorId: string;
  doctorName: string;
  date: string;
  currentServingNumber: number;
  activeStatus: 'Active' | 'Paused' | 'Closed';
  averageConsultationMinutes: number;
  lastCalledAt?: Date;
  updatedAt: Date;
}

const QueueSchema = new Schema<IQueue>({
  doctorId: { type: String, required: true, index: true },
  doctorName: { type: String, required: true },
  date: { type: String, required: true, index: true },
  currentServingNumber: { type: Number, default: 0 },
  activeStatus: { type: String, enum: ['Active', 'Paused', 'Closed'], default: 'Active' },
  averageConsultationMinutes: { type: Number, default: 12 },
  lastCalledAt: { type: Date }
}, { timestamps: true });

// Notification Schema
export interface INotification extends Document {
  recipientId: string;
  recipientRole: string;
  title: string;
  message: string;
  type: 'appointment_created' | 'status_changed' | 'queue_call' | 'reminder' | 'cancelled' | 'system';
  referenceId?: string;
  isRead: boolean;
  createdAt: Date;
}

const NotificationSchema = new Schema<INotification>({
  recipientId: { type: String, required: true, index: true },
  recipientRole: { type: String, default: 'patient' },
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: {
    type: String,
    enum: ['appointment_created', 'status_changed', 'queue_call', 'reminder', 'cancelled', 'system'],
    default: 'system'
  },
  referenceId: { type: String, default: '' },
  isRead: { type: Boolean, default: false }
}, { timestamps: true });

// Audit Log Schema
export interface IAuditLog extends Document {
  userId?: string;
  userName?: string;
  userRole?: string;
  action: string;
  details: string;
  ipAddress?: string;
  createdAt: Date;
}

const AuditLogSchema = new Schema<IAuditLog>({
  userId: { type: String, default: 'system' },
  userName: { type: String, default: 'System' },
  userRole: { type: String, default: 'system' },
  action: { type: String, required: true },
  details: { type: String, required: true },
  ipAddress: { type: String, default: '127.0.0.1' }
}, { timestamps: true });

export const UserModel = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
export const DoctorModel = mongoose.models.Doctor || mongoose.model<IDoctor>('Doctor', DoctorSchema);
export const HospitalModel = mongoose.models.Hospital || mongoose.model<IHospital>('Hospital', HospitalSchema);
export const AppointmentModel = mongoose.models.Appointment || mongoose.model<IAppointment>('Appointment', AppointmentSchema);
export const QueueModel = mongoose.models.Queue || mongoose.model<IQueue>('Queue', QueueSchema);
export const NotificationModel = mongoose.models.Notification || mongoose.model<INotification>('Notification', NotificationSchema);
export const AuditLogModel = mongoose.models.AuditLog || mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);

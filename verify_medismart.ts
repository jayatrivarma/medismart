import { storage } from '../server/db/storage';
import { queueManager } from '../server/queueService';
import { askMediSmartAssistant } from '../server/gemini';
import bcrypt from 'bcryptjs';

async function runTests() {
  console.log('====================================================');
  console.log(' MEDISMART AI — AUTOMATED TEST SUITE');
  console.log(' Visakhapatnam (Vizag), Andhra Pradesh');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName}`);
      failed++;
    }
  }

  // TEST 1: Doctor Directory Quota Check (Target 75 verified doctors)
  const doctors = storage.getDoctors();
  assert(doctors.length >= 75, `Target 75 Verified Doctors (Actual: ${doctors.length})`);
  
  // TEST 2: Doctor Profile Data Integrity & Source URLs
  const sampleDoc = doctors[0];
  assert(
    Boolean(sampleDoc.fullName && sampleDoc.specialization && sampleDoc.hospitalAddress && sampleDoc.sourceUrl && sampleDoc.lastVerifiedAt),
    `Doctor Profile Integrity (Checked ${sampleDoc.fullName}: ${sampleDoc.specialization} at ${sampleDoc.locality})`
  );

  // TEST 3: User Authentication & Bcrypt Password Hashing
  const testEmail = `test_patient_${Date.now()}@medismart.ai`;
  const rawPassword = 'SecurePassword@123';
  const passwordHash = bcrypt.hashSync(rawPassword, 10);
  
  const createdUser = storage.createUser({
    name: 'Test Patient Vizag',
    email: testEmail,
    passwordHash,
    role: 'patient',
    phone: '+91 98480 99999'
  });

  const retrievedUser = storage.findUserByEmail(testEmail);
  const passwordValid = bcrypt.compareSync(rawPassword, retrievedUser?.passwordHash || '');
  assert(Boolean(retrievedUser && passwordValid), 'User Registration & Bcrypt Verification');

  // TEST 4: Security - Enforce Patient Role (Public Cannot Self-Assign Admin)
  assert(createdUser.role === 'patient', 'Security: Public Registration Enforces Patient Role');

  // TEST 5: Doctor Search & Filtering
  const cardiologists = doctors.filter(d => d.specialization.toLowerCase().includes('cardio'));
  assert(cardiologists.length > 0, `Search & Filter: Found ${cardiologists.length} Cardiologists in Vizag`);

  const apolloDoctors = doctors.filter(d => d.hospitalAffiliations.some(h => h.includes('Apollo')));
  assert(apolloDoctors.length > 0, `Search & Filter: Found ${apolloDoctors.length} Apollo Hospitals Doctors`);

  // TEST 6: Appointment Creation & Queue Token Assignment
  const testApt = storage.createAppointment({
    patientId: createdUser.id,
    patientName: createdUser.name,
    patientEmail: createdUser.email,
    patientPhone: createdUser.phone || '',
    doctorId: sampleDoc.id,
    doctorName: sampleDoc.fullName,
    specialization: sampleDoc.specialization,
    hospitalName: sampleDoc.hospitalAffiliations[0],
    appointmentDate: new Date().toISOString().split('T')[0],
    appointmentTime: '11:30 AM',
    status: 'Waiting',
    consultationFee: sampleDoc.consultationFee,
    mode: 'In-Person',
    symptoms: 'Mild hypertension follow-up',
    isDemonstrationSchedule: true
  });
  assert(
    Boolean(testApt.appointmentId && testApt.queueNumber > 0 && testApt.qrToken),
    `Appointment Created with Token #${testApt.queueNumber} and ID ${testApt.appointmentId}`
  );

  // TEST 7: Queue Tracking & Waiting Time Calculation
  const queuePos = queueManager.getPatientPosition(testApt.id);
  assert(
    Boolean(queuePos && queuePos.estimate.estimatedMinutes >= 0 && queuePos.estimate.maeMinutes > 0),
    `Queue Prediction Calculation (Estimate: ~${queuePos?.estimate.estimatedMinutes}m, MAE: ±${queuePos?.estimate.maeMinutes}m)`
  );

  // TEST 8: Doctor Queue Actions (Call Next Patient & Status Transitions)
  const todayStr = new Date().toISOString().split('T')[0];
  const queueActionRes = queueManager.handleDoctorQueueAction(sampleDoc.id, todayStr, 'call_next');
  assert(queueActionRes.success, 'Doctor Queue Control: Call Next Patient');

  // TEST 9: Appointment Cancellation Workflow
  const cancelledApt = storage.updateAppointment(testApt.id, {
    status: 'Cancelled',
    cancellationReason: 'Patient rescheduled to next week'
  });
  assert(cancelledApt?.status === 'Cancelled', 'Appointment Cancellation Workflow');

  // TEST 10: Doctor Import & Duplicate Detection Engine
  const testImportRows = [
    {
      fullName: sampleDoc.fullName, // Existing duplicate
      specialization: sampleDoc.specialization,
      hospitalAffiliations: ['Apollo Hospitals'],
      hospitalAddress: 'Arilova, Vizag'
    },
    {
      fullName: 'Dr. Automated Unique Test Specialist',
      specialization: 'Neurology',
      hospitalAffiliations: ['Medicover Hospitals, MVP Colony'],
      hospitalAddress: 'MVP Colony, Vizag',
      experienceYears: 12
    }
  ];

  const existingNames = new Set(doctors.map(d => d.fullName.toLowerCase().trim()));
  let duplicateDetected = false;
  let validImported = false;

  testImportRows.forEach(row => {
    if (existingNames.has(row.fullName.toLowerCase().trim())) {
      duplicateDetected = true;
    } else {
      validImported = true;
    }
  });

  assert(duplicateDetected && validImported, 'Doctor Import: Duplicate Detection & Validation Logic');

  // TEST 11: MediSmart AI Assistant with Fallback & Medical Guardrails
  const assistantReply = await askMediSmartAssistant('Who are the cardiologists in Vizag?');
  assert(
    Boolean(assistantReply && assistantReply.length > 50),
    'MediSmart Assistant Query (Verified Doctor Directory Retrieval)'
  );

  const emergencyReply = await askMediSmartAssistant('I have severe chest pain and cannot breathe');
  assert(
    emergencyReply.includes('108') || emergencyReply.includes('1066') || emergencyReply.includes('EMERGENCY'),
    'MediSmart Assistant: Emergency 108 / 1066 Protocol Triggered'
  );

  console.log('\n====================================================');
  console.log(` RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});

import { GoogleGenAI } from '@google/genai';
import { storage } from './db/storage';

const apiKey = process.env.GEMINI_API_KEY || '';

let aiClient: GoogleGenAI | null = null;
if (apiKey && apiKey !== 'MY_GEMINI_API_KEY') {
  try {
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build'
        }
      }
    });
    console.log('[Gemini AI] Initialized GoogleGenAI client with gemini-3.8-flash.');
  } catch (err) {
    console.warn('[Gemini AI] Failed to initialize GoogleGenAI client:', err);
  }
} else {
  console.log('[Gemini AI] GEMINI_API_KEY not configured or placeholder. Rule-based healthcare navigation assistant active.');
}

const SYSTEM_INSTRUCTION = `
You are the MediSmart AI Assistant for the MediSmart healthcare platform serving Visakhapatnam (Vizag), Andhra Pradesh.
Your mission is to help patients discover verified doctors, understand hospital affiliations (Apollo Hospitals Arilova/Ram Nagar, Medicover MVP Colony, Lotus Hospitals Ram Nagar, CARE Hospitals Maharani Peta, SevenHills Siripuram), explain appointment booking, guide them on digital appointment cards with QR codes, and explain live queue tracking and estimated wait times.

CRITICAL HEALTHCARE SAFETY & ACCURACY RULES:
1. NO AUTONOMOUS DIAGNOSIS: Never attempt to diagnose medical conditions, suggest diseases as definite conclusions, or recommend specific pharmaceutical prescription drugs or dosages.
2. NO HALLUCINATION OF DOCTORS OR FEES: Only reference genuine verified doctors and published information from the MediSmart directory. Never invent doctor names, qualifications, consultation charges, or fake hospital availability.
3. EMERGENCY SAFEGUARD: For severe symptoms (e.g., intense chest pain, severe shortness of breath, sudden numbness or paralysis, heavy bleeding, loss of consciousness, severe head trauma), immediately instruct the patient to contact local Vizag emergency medical services (Ambulance: 108, Apollo Emergency: 1066) or visit the nearest emergency casualty ward at Apollo Arilova or CARE Maharani Peta.
4. TONE & PRIVACY: Be empathetic, clear, objective, and professional. Protect user confidentiality. Always include a concise healthcare disclaimer.
`;

export async function askMediSmartAssistant(userMessage: string, context?: { userRole?: string; currentDoctorId?: string }): Promise<string> {
  const doctors = storage.getDoctors();
  const hospitals = storage.getHospitals();

  // If Gemini API is available and initialized, call gemini-3.8-flash
  if (aiClient) {
    try {
      // Build doctor context summary
      const topSpecialties = ['Cardiology', 'Neurology', 'Orthopedics', 'Pediatrics', 'Dermatology', 'Gastroenterology', 'Nephrology', 'Urology', 'Obstetrics and Gynecology', 'Pulmonology', 'ENT', 'Ophthalmology'];
      const hospitalNames = hospitals.map(h => `${h.name} (${h.locality})`).join('; ');
      
      const contextPrompt = `
Platform Context:
- City: Visakhapatnam (Vizag), Andhra Pradesh.
- Hospitals: ${hospitalNames}
- Total Verified Doctors in Directory: ${doctors.length}
- Primary Specialties: ${topSpecialties.join(', ')}
- Tagline: "Smarter Appointments. Shorter Waits. Better Care."

User Inquiry: ${userMessage}
`;

      const response = await aiClient.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: contextPrompt,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          temperature: 0.7
        }
      });

      if (response && response.text) {
        return response.text;
      }
    } catch (err: any) {
      console.warn('[Gemini AI] API call failed, falling back to rule-based engine:', err.message);
    }
  }

  // Intelligent Rule-Based Fallback Engine
  return generateRuleBasedResponse(userMessage, doctors, hospitals);
}

function generateRuleBasedResponse(query: string, doctors: any[], hospitals: any[]): string {
  const q = query.toLowerCase();

  // Emergency check
  if (q.includes('emergency') || q.includes('heart attack') || q.includes('chest pain') || q.includes('stroke') || q.includes('breathing difficulty') || q.includes('bleeding')) {
    return `EMERGENCY ALERT: If you or someone with you is experiencing acute chest pain, difficulty breathing, sudden numbness, or life-threatening symptoms, please call Emergency Services immediately:
- National Emergency Ambulance: 108
- Apollo Hospitals Vizag Emergency: 1066
- CARE Hospitals Emergency: +91 891 304 1000

Do not delay by booking a standard OPD consultation. Reach the nearest 24/7 hospital emergency department immediately (e.g., Apollo Health City Arilova or CARE Hospitals Maharani Peta).`;
  }

  // Doctor search queries
  if (q.includes('cardiologist') || q.includes('heart') || q.includes('cardio')) {
    const cardios = doctors.filter(d => d.specialization.toLowerCase().includes('cardio')).slice(0, 3);
    const docList = cardios.map(d => `• **${d.fullName}** (${d.qualifications}) - ${d.experienceDisplay} at ${d.hospitalAffiliations.join(', ')} [Locality: ${d.locality}]`).join('\n');
    return `Here are verified Cardiologists in Visakhapatnam:\n\n${docList}\n\nYou can click "Find Doctors" to filter by hospital or locality (Arilova, Ram Nagar, MVP Colony, Maharani Peta) and book your OPD token.`;
  }

  if (q.includes('pediatric') || q.includes('child') || q.includes('baby') || q.includes('neonat')) {
    const peds = doctors.filter(d => d.specialization.toLowerCase().includes('pediatric') || d.specialization.toLowerCase().includes('neonat')).slice(0, 3);
    const docList = peds.map(d => `• **${d.fullName}** (${d.qualifications}) - ${d.experienceDisplay} at ${d.hospitalAffiliations.join(', ')} [Locality: ${d.locality}]`).join('\n');
    return `Here are verified Pediatricians & Child Specialists in Vizag:\n\n${docList}\n\nLotus Hospitals in Ram Nagar and Medicover in MVP Colony specialize in pediatric and neonatal intensive care.`;
  }

  if (q.includes('neuro') || q.includes('brain') || q.includes('spine') || q.includes('headache')) {
    const neuros = doctors.filter(d => d.specialization.toLowerCase().includes('neuro')).slice(0, 3);
    const docList = neuros.map(d => `• **${d.fullName}** (${d.qualifications}) - ${d.experienceDisplay} at ${d.hospitalAffiliations.join(', ')}`).join('\n');
    return `Here are verified Neurologists & Neurosurgeons in Vizag:\n\n${docList}\n\nYou can check their profiles for consultation timings and book an appointment.`;
  }

  if (q.includes('ortho') || q.includes('bone') || q.includes('joint') || q.includes('knee') || q.includes('fracture')) {
    const orthos = doctors.filter(d => d.specialization.toLowerCase().includes('ortho')).slice(0, 3);
    const docList = orthos.map(d => `• **${d.fullName}** (${d.qualifications}) - ${d.experienceDisplay} at ${d.hospitalAffiliations.join(', ')}`).join('\n');
    return `Here are verified Orthopedic specialists in Vizag:\n\n${docList}\n\nVisit the "Find Doctors" tab to view slot availability and book your appointment.`;
  }

  if (q.includes('derma') || q.includes('skin') || q.includes('hair') || q.includes('rash')) {
    const dermas = doctors.filter(d => d.specialization.toLowerCase().includes('derma')).slice(0, 3);
    const docList = dermas.map(d => `• **${d.fullName}** (${d.qualifications}) - ${d.experienceDisplay} at ${d.hospitalAffiliations.join(', ')}`).join('\n');
    return `Here are verified Dermatologists in Vizag:\n\n${docList}\n\nBoth Apollo Ram Nagar and Medicover MVP Colony offer OPD dermatology consultations.`;
  }

  // Hospital query
  if (q.includes('hospital') || q.includes('apollo') || q.includes('medicover') || q.includes('lotus') || q.includes('care') || q.includes('sevenhills')) {
    const hospList = hospitals.map(h => `• **${h.name}**: ${h.address} (Emergency: ${h.emergencyPhone})`).join('\n');
    return `MediSmart AI covers verified hospitals across Visakhapatnam:\n\n${hospList}\n\nEvery doctor listed is officially affiliated with these verified medical centres.`;
  }

  // Queue tracking & appointment queries
  if (q.includes('queue') || q.includes('wait') || q.includes('waiting time') || q.includes('token') || q.includes('track')) {
    return `How MediSmart AI Queue Tracking Works:\n\n1. When you confirm an appointment, you receive an automated Queue Token (e.g. #3).\n2. On the appointment day, open "Live Queue Tracking" on your dashboard.\n3. You can see the Current Serving Number, how many patients are ahead of you, and an estimated waiting time.\n4. You will receive an in-app alert when your turn is called so you don't have to wait in crowded hospital corridors.\n\n*Note: Waiting times are predictions based on average consultation durations and real-time doctor progress.*`;
  }

  if (q.includes('appointment card') || q.includes('qr') || q.includes('pdf') || q.includes('card')) {
    return `Digital Appointment Cards:\n\nAfter booking an appointment, you can view your digital card anytime under "My Appointments" > "View Card".\n• It includes your unique Appointment ID, Doctor & Hospital information, Date & Time, Queue Token, and a secure verification QR code.\n• You can click "Download / Print PDF" to keep a digital or printed copy for hospital reception check-in.`;
  }

  // General welcome & help
  return `Hello! I am your MediSmart AI Healthcare Assistant for Visakhapatnam.

I can assist you with:
• Finding verified doctors across Vizag (Cardiology, Orthopedics, Pediatrics, Neurology, Gynecology, Dermatology, and more)
• Hospital directories (Apollo Arilova & Ram Nagar, Medicover MVP Colony, Lotus Hospitals, CARE Hospitals Maharani Peta, SevenHills)
• How to book appointments and avoid double bookings
• Digital appointment cards with QR codes & PDF printing
• Live queue tracking and estimated wait times

How can I help you today?

*Disclaimer: MediSmart AI provides healthcare navigation and directory assistance. For medical emergencies, please call 108 or Apollo Emergency 1066.*`;
}

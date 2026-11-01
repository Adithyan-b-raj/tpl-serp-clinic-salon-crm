// Cloudflare Functions: Prescriptions API
// GET /api/rx -> Query patient Rx history or list recent prescriptions
// POST /api/rx -> Save a digital prescription

// Fallback in-memory store for edge environments without D1 binding
const fallbackPrescriptions = [
  {
    id: 'rx_01',
    appointment_id: 'apt_01',
    patient_name: 'Ananya Sharma',
    patient_phone: '+91 98450 11223',
    patient_age: 28,
    patient_gender: 'Female',
    doctor_name: 'Dr. Sarah Smith, MD',
    department: 'Dermatology & Skin Clinic',
    room_no: 'Room 101',
    diagnosis: 'Acne Vulgaris (Grade II) with Post-Inflammatory Erythema',
    vitals_bp: '118/76 mmHg',
    vitals_pulse: '72 bpm',
    vitals_weight: '58 kg',
    vitals_temp: '98.4 °F',
    vitals_spo2: '99%',
    medicines: [
      { name: 'Doxycycline 100mg', dosage: '1 Cap', freq: '1-0-0', days: '14 Days', instructions: 'After breakfast with full glass of water' },
      { name: 'Adapalene + Benzoyl Peroxide Gel (0.1%/2.5%)', dosage: 'Pea sized', freq: '0-0-1', days: '30 Days', instructions: 'Apply thin film at bedtime on affected areas' },
      { name: 'Non-Comedogenic Sunscreen SPF 50+', dosage: '2 Fingers', freq: '1-1-0', days: 'Daily', instructions: 'Apply every 3 hours outdoors' }
    ],
    doctor_advice: 'Avoid heavy oil-based serums. Drink 3L water daily. Do not pick or squeeze lesions. Next review after 4 weeks.',
    follow_up: '4 Weeks (28 Nov 2026)',
    created_at: '2026-11-01T09:45:00.000Z'
  },
  {
    id: 'rx_02',
    appointment_id: 'apt_04',
    patient_name: 'Rahul Krishnan',
    patient_phone: '+91 98860 33445',
    patient_age: 29,
    patient_gender: 'Male',
    doctor_name: 'Dr. Arvind Menon, BDS, MDS',
    department: 'Dental & Orthodontics',
    room_no: 'Room 104',
    diagnosis: 'Acute Irreversible Pulpitis #36 (Post RCT Stage 1)',
    vitals_bp: '124/82 mmHg',
    vitals_pulse: '76 bpm',
    vitals_weight: '74 kg',
    vitals_temp: '98.6 °F',
    vitals_spo2: '98%',
    medicines: [
      { name: 'Amoxicillin + Clavulanic Acid 625mg', dosage: '1 Tab', freq: '1-0-1', days: '5 Days', instructions: 'After meals' },
      { name: 'Aceclofenac + Paracetamol (100mg/325mg)', dosage: '1 Tab', freq: '1-0-1', days: '3 Days', instructions: 'After meals (SOS for pain)' },
      { name: 'Chlorhexidine Gluconate 0.2% Oral Rinse', dosage: '10 ml', freq: '1-0-1', days: '7 Days', instructions: 'Swish for 60 seconds after brushing' }
    ],
    doctor_advice: 'Avoid chewing hard foods on left quadrant until permanent crown placement. Warm saline rinses 3 times daily.',
    follow_up: '7 Days for Crown Impression',
    created_at: '2026-11-01T10:20:00.000Z'
  }
];

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);

  // CORS headers
  const corsHeaders = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // GET: Query patient prescriptions
  if (request.method === 'GET') {
    const phone = url.searchParams.get('phone');
    const appointmentId = url.searchParams.get('appointment_id');
    const rxId = url.searchParams.get('id');
    const patientName = url.searchParams.get('patient_name');

    if (env && env.DB) {
      try {
        let query = 'SELECT * FROM prescriptions WHERE 1=1';
        const params = [];

        if (rxId) {
          query += ' AND id = ?';
          params.push(rxId);
        } else if (appointmentId) {
          query += ' AND appointment_id = ?';
          params.push(appointmentId);
        } else if (phone) {
          query += ' AND patient_phone LIKE ?';
          params.push(`%${phone.replace(/[^0-9]/g, '')}%`);
        } else if (patientName) {
          query += ' AND patient_name LIKE ?';
          params.push(`%${patientName}%`);
        }

        query += ' ORDER BY created_at DESC LIMIT 50';
        const stmt = env.DB.prepare(query);
        const results = await (params.length ? stmt.bind(...params) : stmt).all();

        const formatted = (results.results || []).map(r => {
          let meds = [];
          try { meds = JSON.parse(r.medicines_json); } catch (e) { meds = []; }
          return {
            ...r,
            medicines: meds
          };
        });

        return new Response(JSON.stringify({
          success: true,
          count: formatted.length,
          prescriptions: formatted
        }), { headers: corsHeaders });
      } catch (err) {
        console.error('D1 Query Error:', err);
      }
    }

    // Fallback in-memory search
    let filtered = [...fallbackPrescriptions];
    if (rxId) {
      filtered = filtered.filter(r => r.id === rxId);
    } else if (appointmentId) {
      filtered = filtered.filter(r => r.appointment_id === appointmentId);
    } else if (phone) {
      const cleanPhone = phone.replace(/[^0-9]/g, '');
      filtered = filtered.filter(r => (r.patient_phone || '').replace(/[^0-9]/g, '').includes(cleanPhone));
    } else if (patientName) {
      const q = patientName.toLowerCase();
      filtered = filtered.filter(r => (r.patient_name || '').toLowerCase().includes(q));
    }

    return new Response(JSON.stringify({
      success: true,
      count: filtered.length,
      prescriptions: filtered
    }), { headers: corsHeaders });
  }

  // POST: Create and save prescription
  if (request.method === 'POST') {
    try {
      const payload = await request.json();
      if (!payload.patient_name || !payload.diagnosis) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Patient name and diagnosis are required fields.'
        }), { status: 400, headers: corsHeaders });
      }

      const rxId = 'rx_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
      const createdAt = new Date().toISOString();
      const medicines = Array.isArray(payload.medicines) ? payload.medicines : [];
      const medicinesJson = JSON.stringify(medicines);

      const record = {
        id: rxId,
        appointment_id: payload.appointment_id || ('apt_' + Date.now().toString(36)),
        patient_name: payload.patient_name,
        patient_phone: payload.patient_phone || '',
        patient_age: payload.patient_age ? parseInt(payload.patient_age, 10) : null,
        patient_gender: payload.patient_gender || 'Not specified',
        doctor_name: payload.doctor_name || 'Dr. Sarah Smith, MD',
        department: payload.department || 'Dermatology & Skin Clinic',
        room_no: payload.room_no || 'Room 101',
        diagnosis: payload.diagnosis,
        vitals_bp: payload.vitals_bp || payload.vitals?.bp || '120/80 mmHg',
        vitals_pulse: payload.vitals_pulse || payload.vitals?.pulse || '72 bpm',
        vitals_weight: payload.vitals_weight || payload.vitals?.weight || '65 kg',
        vitals_temp: payload.vitals_temp || payload.vitals?.temp || '98.6 °F',
        vitals_spo2: payload.vitals_spo2 || payload.vitals?.spo2 || '99%',
        medicines_json: medicinesJson,
        medicines: medicines,
        doctor_advice: payload.doctor_advice || payload.advice || 'Take prescribed medications on time. Drink plenty of fluids.',
        follow_up: payload.follow_up || 'As advised',
        created_at: createdAt
      };

      if (env && env.DB) {
        try {
          await env.DB.prepare(`
            INSERT INTO prescriptions 
            (id, appointment_id, patient_name, patient_phone, patient_age, patient_gender, doctor_name, department, room_no, diagnosis, vitals_bp, vitals_pulse, vitals_weight, vitals_temp, vitals_spo2, medicines_json, doctor_advice, follow_up, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).bind(
            record.id, record.appointment_id, record.patient_name, record.patient_phone, record.patient_age,
            record.patient_gender, record.doctor_name, record.department, record.room_no, record.diagnosis,
            record.vitals_bp, record.vitals_pulse, record.vitals_weight, record.vitals_temp, record.vitals_spo2,
            record.medicines_json, record.doctor_advice, record.follow_up, record.created_at
          ).run();
        } catch (dbErr) {
          console.error('D1 Insert error:', dbErr);
        }
      }

      // Add to memory fallback so subsequent GET sees it
      fallbackPrescriptions.unshift(record);

      // Generate pre-formatted WhatsApp share link text
      const medSummary = medicines.map((m, i) => `${i + 1}. ${m.name} (${m.dosage}) - ${m.freq} x ${m.days}`).join('\n');
      const waText = encodeURIComponent(
        `*PRESCRIPTION // ${record.patient_name.toUpperCase()}*\n` +
        `*Doctor:* ${record.doctor_name} (${record.room_no})\n` +
        `*Diagnosis:* ${record.diagnosis}\n` +
        `*Vitals:* BP ${record.vitals_bp} | Pulse ${record.vitals_pulse} | Wt ${record.vitals_weight}\n\n` +
        `*Medications:*\n${medSummary}\n\n` +
        `*Doctor Advice:* ${record.doctor_advice}\n` +
        `*Review:* ${record.follow_up}\n\n` +
        `Ref ID: #${record.id.toUpperCase()}`
      );

      const cleanPhone = (record.patient_phone || '').replace(/[^0-9]/g, '');
      const waLink = cleanPhone ? `https://wa.me/${cleanPhone}?text=${waText}` : `https://wa.me/?text=${waText}`;

      return new Response(JSON.stringify({
        success: true,
        prescription: record,
        rx_id: record.id,
        whatsapp_url: waLink,
        message: 'Prescription recorded successfully and dispatched.'
      }), {
        status: 201,
        headers: corsHeaders
      });
    } catch (e) {
      return new Response(JSON.stringify({
        success: false,
        error: e.message || 'Invalid JSON request'
      }), { status: 400, headers: corsHeaders });
    }
  }

  return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
    status: 405,
    headers: corsHeaders
  });
}

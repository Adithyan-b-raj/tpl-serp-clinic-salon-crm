// Cloudflare Functions: Live Token Queue & Cabin Management API
// GET /api/queue -> Live status, currently serving, next in queue, doctors
// POST /api/queue -> Actions: call_next, recall, complete, skip, add_walkin

const state = {
  practitioners: [
    {
      id: 'doc_01',
      name: 'Dr. Sarah Smith, MD',
      title: 'Chief Dermatologist & Cosmetologist',
      department: 'Dermatology & Skin Clinic',
      room_no: 'Room 101',
      cabin_id: '1',
      status: 'AVAILABLE',
      avg_consult_min: 15,
      current_token: 'A-14',
      current_patient: 'Vikramaditya Roy',
      current_service: 'Cryotherapy for Viral Wart Removal',
      consult_started_at: new Date(Date.now() - 11 * 60000).toISOString()
    },
    {
      id: 'doc_02',
      name: 'Dr. Arvind Menon, BDS, MDS',
      title: 'Senior Dental Surgeon & Implantologist',
      department: 'Dental & Orthodontics',
      room_no: 'Room 104',
      cabin_id: '2',
      status: 'AVAILABLE',
      avg_consult_min: 20,
      current_token: 'B-04',
      current_patient: 'Rahul Krishnan',
      current_service: 'Root Canal Treatment (Stage 2) & Crown Fit',
      consult_started_at: new Date(Date.now() - 3 * 60000).toISOString()
    },
    {
      id: 'doc_03',
      name: 'Dr. Shalini Ray, MBBS, DNB',
      title: 'Consultant Pediatrician & Family Health',
      department: 'General & Preventive Care',
      room_no: 'Room 108',
      cabin_id: '3',
      status: 'AVAILABLE',
      avg_consult_min: 12,
      current_token: 'C-08',
      current_patient: 'Master Aarav Patel',
      current_service: 'Seasonal Asthma & Nebulization Followup',
      consult_started_at: new Date(Date.now() - 1 * 60000).toISOString()
    }
  ],
  queue: [
    {
      id: 'apt_03',
      token_no: 'A-15',
      patient_name: 'Meera Venkatesh',
      patient_phone: '+91 97402 77889',
      patient_age: 42,
      patient_gender: 'Female',
      practitioner_id: 'doc_01',
      doctor_name: 'Dr. Sarah Smith, MD',
      department: 'Dermatology & Skin Clinic',
      room_no: 'Room 101',
      service_name: 'Pigmentation & Melasma Review',
      slot_time: '11:00 AM',
      token_status: 'WAITING',
      est_wait_min: 8
    },
    {
      id: 'apt_05',
      token_no: 'B-05',
      patient_name: 'Kavita Sundaram',
      patient_phone: '+91 98455 66778',
      patient_age: 52,
      patient_gender: 'Female',
      practitioner_id: 'doc_02',
      doctor_name: 'Dr. Arvind Menon, BDS, MDS',
      department: 'Dental & Orthodontics',
      room_no: 'Room 104',
      service_name: 'Ultrasonic Scaling & Polishing',
      slot_time: '11:00 AM',
      token_status: 'WAITING',
      est_wait_min: 16
    },
    {
      id: 'apt_07',
      token_no: 'A-16',
      patient_name: 'Divya Nambiar',
      patient_phone: '+91 98950 12345',
      patient_age: 26,
      patient_gender: 'Female',
      practitioner_id: 'doc_01',
      doctor_name: 'Dr. Sarah Smith, MD',
      department: 'Dermatology & Skin Clinic',
      room_no: 'Room 101',
      service_name: 'Chemical Peel & Glow Facial',
      slot_time: '11:30 AM',
      token_status: 'WAITING',
      est_wait_min: 24
    },
    {
      id: 'apt_08',
      token_no: 'C-09',
      patient_name: 'Rohan Desai',
      patient_phone: '+91 99123 45678',
      patient_age: 8,
      patient_gender: 'Male',
      practitioner_id: 'doc_03',
      doctor_name: 'Dr. Shalini Ray, MBBS, DNB',
      department: 'General & Preventive Care',
      room_no: 'Room 108',
      service_name: 'Pediatric Growth & Vaccine Review',
      slot_time: '11:15 AM',
      token_status: 'WAITING',
      est_wait_min: 14
    }
  ],
  completed: [
    { token_no: 'A-12', patient_name: 'Ananya Sharma', doctor_name: 'Dr. Sarah Smith, MD', completed_at: '10:18 AM' },
    { token_no: 'B-03', patient_name: 'Girish Prabhu', doctor_name: 'Dr. Arvind Menon, BDS', completed_at: '10:05 AM' }
  ],
  stats: {
    total_today: 48,
    waiting: 4,
    completed: 42,
    avg_wait_min: 14
  }
};

export async function onRequest(context) {
  const { request, env } = context;
  const corsHeaders = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // GET: Live queue & TV board state
  if (request.method === 'GET') {
    if (env && env.DB) {
      try {
        const docs = await env.DB.prepare('SELECT * FROM practitioners').all();
        const active = await env.DB.prepare(
          'SELECT a.*, p.name as doctor_name, p.department, p.room_no FROM appointments a JOIN practitioners p ON a.practitioner_id = p.id WHERE a.token_status IN ("SERVING", "WAITING") ORDER BY a.created_at ASC'
        ).all();

        return new Response(JSON.stringify({
          success: true,
          practitioners: docs.results || state.practitioners,
          queue: active.results || state.queue,
          stats: {
            total_today: 48,
            waiting: (active.results || []).filter(x => x.token_status === 'WAITING').length,
            completed: 42,
            avg_wait_min: 14
          }
        }), { headers: corsHeaders });
      } catch (e) {
        // Fallback to memory state
      }
    }

    return new Response(JSON.stringify({
      success: true,
      practitioners: state.practitioners,
      queue: state.queue,
      completed: state.completed,
      stats: {
        total_today: state.stats.total_today,
        waiting: state.queue.length,
        completed: state.completed.length + 38,
        avg_wait_min: state.stats.avg_wait_min
      },
      last_updated: new Date().toISOString()
    }), { headers: corsHeaders });
  }

  // POST: Actions: call_next, recall, complete, skip, add_walkin
  if (request.method === 'POST') {
    try {
      const body = await request.json();
      const action = body.action || 'call_next';
      const docId = body.practitioner_id || body.doctor_id || 'doc_01';
      const doctor = state.practitioners.find(d => d.id === docId) || state.practitioners[0];

      if (action === 'call_next') {
        // Find next waiting for this doctor or next in queue
        const nextIdx = state.queue.findIndex(q => q.practitioner_id === docId || !body.practitioner_id);
        let called = null;

        if (nextIdx !== -1) {
          called = state.queue.splice(nextIdx, 1)[0];
          // Previous serving goes to completed
          if (doctor.current_token) {
            state.completed.unshift({
              token_no: doctor.current_token,
              patient_name: doctor.current_patient,
              doctor_name: doctor.name,
              completed_at: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            });
          }
          // Update doctor current token
          doctor.current_token = called.token_no;
          doctor.current_patient = called.patient_name;
          doctor.current_service = called.service_name;
          doctor.consult_started_at = new Date().toISOString();
        }

        return new Response(JSON.stringify({
          success: true,
          action: 'call_next',
          called_token: called ? called.token_no : doctor.current_token,
          patient_name: called ? called.patient_name : doctor.current_patient,
          doctor_name: doctor.name,
          room_no: doctor.room_no,
          message: called 
            ? `Token ${called.token_no} (${called.patient_name}) called to ${doctor.room_no}` 
            : `No waiting patients in queue for ${doctor.name}. Current token: ${doctor.current_token}`,
          announcement_text: `Ding-Dong! Now calling Token ${called ? called.token_no : doctor.current_token}, ${called ? called.patient_name : doctor.current_patient}, for ${doctor.name}, ${doctor.room_no}`
        }), { headers: corsHeaders });
      }

      if (action === 'recall') {
        return new Response(JSON.stringify({
          success: true,
          action: 'recall',
          called_token: doctor.current_token,
          patient_name: doctor.current_patient,
          doctor_name: doctor.name,
          room_no: doctor.room_no,
          message: `Recalled token ${doctor.current_token} to ${doctor.room_no}`,
          announcement_text: `Ding-Dong! Reminder: Token ${doctor.current_token}, ${doctor.current_patient}, please proceed to ${doctor.room_no}`
        }), { headers: corsHeaders });
      }

      if (action === 'complete') {
        if (doctor.current_token) {
          state.completed.unshift({
            token_no: doctor.current_token,
            patient_name: doctor.current_patient,
            doctor_name: doctor.name,
            completed_at: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          });
        }
        const oldToken = doctor.current_token;
        doctor.current_token = '---';
        doctor.current_patient = 'Ready for Next';
        doctor.current_service = 'Free / Available';

        return new Response(JSON.stringify({
          success: true,
          action: 'complete',
          completed_token: oldToken,
          message: `Consultation for Token ${oldToken} marked complete in ${doctor.room_no}`
        }), { headers: corsHeaders });
      }

      if (action === 'skip') {
        const skippedToken = doctor.current_token;
        doctor.current_token = '---';
        doctor.current_patient = 'No-show Recorded';
        doctor.current_service = 'Free / Available';

        return new Response(JSON.stringify({
          success: true,
          action: 'skip',
          skipped_token: skippedToken,
          message: `Token ${skippedToken} marked as No-Show / Skipped`
        }), { headers: corsHeaders });
      }

      if (action === 'add_walkin') {
        const prefix = docId === 'doc_02' ? 'B' : (docId === 'doc_03' ? 'C' : 'A');
        const num = Math.floor(Math.random() * 50) + 20;
        const newToken = `${prefix}-${num}`;
        const walkin = {
          id: 'apt_walkin_' + Date.now().toString(36),
          token_no: newToken,
          patient_name: body.patient_name || 'Walk-In Patient',
          patient_phone: body.patient_phone || '',
          patient_age: body.patient_age || 30,
          patient_gender: body.patient_gender || 'General',
          practitioner_id: docId,
          doctor_name: doctor.name,
          department: doctor.department,
          room_no: doctor.room_no,
          service_name: body.service_name || 'General Consultation',
          slot_time: 'Walk-In Instant',
          token_status: 'WAITING',
          est_wait_min: (state.queue.length + 1) * 8
        };
        state.queue.push(walkin);
        state.stats.total_today++;

        return new Response(JSON.stringify({
          success: true,
          action: 'add_walkin',
          token_no: newToken,
          appointment: walkin,
          message: `Walk-in Token ${newToken} generated for ${walkin.patient_name}`
        }), { headers: corsHeaders });
      }

      return new Response(JSON.stringify({ success: false, error: 'Unknown action' }), {
        status: 400,
        headers: corsHeaders
      });
    } catch (e) {
      return new Response(JSON.stringify({ success: false, error: e.message }), {
        status: 400,
        headers: corsHeaders
      });
    }
  }

  return new Response('Method Not Allowed', { status: 405, headers: corsHeaders });
}

// Cloudflare Functions: Appointments Booking API
// POST /api/appointments -> Book slot & issue live OPD token

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

  if (request.method === 'POST') {
    try {
      const data = await request.json();

      if (!data.patient_name || !data.patient_phone) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Patient full name and phone number are required.'
        }), { status: 400, headers: corsHeaders });
      }

      const practitionerId = data.practitioner_id || 'doc_01';
      let docName = 'Dr. Sarah Smith, MD';
      let docDept = 'Dermatology & Skin Clinic';
      let roomNo = 'Room 101';
      let tokenPrefix = 'A';

      if (practitionerId === 'doc_02') {
        docName = 'Dr. Arvind Menon, BDS, MDS';
        docDept = 'Dental & Orthodontics';
        roomNo = 'Room 104';
        tokenPrefix = 'B';
      } else if (practitionerId === 'doc_03') {
        docName = 'Dr. Shalini Ray, MBBS, DNB';
        docDept = 'General & Preventive Care';
        roomNo = 'Room 108';
        tokenPrefix = 'C';
      }

      const tokenNumber = Math.floor(Math.random() * 60) + 16;
      const tokenNo = `${tokenPrefix}-${tokenNumber}`;
      const appointmentId = 'apt_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 5);
      const estWaitMin = Math.floor(Math.random() * 15) + 12;

      // If DB is bound
      if (env && env.DB) {
        try {
          await env.DB.prepare(`
            INSERT INTO appointments (id, token_no, patient_name, patient_phone, patient_age, patient_gender, practitioner_id, service_name, slot_time, token_status, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'WAITING', ?)
          `).bind(
            appointmentId,
            tokenNo,
            data.patient_name,
            data.patient_phone,
            data.patient_age ? parseInt(data.patient_age, 10) : 30,
            data.patient_gender || 'Unspecified',
            practitionerId,
            data.service_name || 'General Clinical Consultation',
            data.slot_time || '11:30 AM',
            data.notes || ''
          ).run();
        } catch (dbErr) {
          console.error('DB Insert appointment error:', dbErr);
        }
      }

      return new Response(JSON.stringify({
        success: true,
        appointment_id: appointmentId,
        token_no: tokenNo,
        patient_name: data.patient_name,
        patient_phone: data.patient_phone,
        patient_age: data.patient_age || 30,
        patient_gender: data.patient_gender || 'Unspecified',
        practitioner_id: practitionerId,
        doctor_name: docName,
        department: docDept,
        room_no: roomNo,
        service_name: data.service_name || 'Clinical Consultation',
        slot_time: data.slot_time || '11:30 AM',
        slot_date: data.slot_date || 'Today',
        est_wait_min: estWaitMin,
        qr_payload: `OPD:${tokenNo}:${appointmentId}:${roomNo}`,
        message: `Appointment confirmed! Your live queue token is ${tokenNo}. Please report to ${roomNo} at ${data.slot_time || '11:30 AM'}.`
      }), {
        status: 201,
        headers: corsHeaders
      });
    } catch (e) {
      return new Response(JSON.stringify({ success: false, error: e.message }), {
        status: 400,
        headers: corsHeaders
      });
    }
  }

  // GET: Sample appointments list
  if (request.method === 'GET') {
    return new Response(JSON.stringify({
      success: true,
      message: 'Appointments API active'
    }), { headers: corsHeaders });
  }

  return new Response('Method Not Allowed', { status: 405, headers: corsHeaders });
}

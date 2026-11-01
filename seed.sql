-- Seed Data for Clinic & Salon Queue CRM
INSERT INTO practitioners (id, name, title, department, room_no, status, avg_consult_min) VALUES
('doc_01', 'Dr. Sarah Smith, MD', 'Chief Dermatologist & Cosmetologist', 'Dermatology & Skin Clinic', 'Room 101', 'AVAILABLE', 15),
('doc_02', 'Dr. Arvind Menon, BDS, MDS', 'Senior Dental Surgeon & Implantologist', 'Dental & Orthodontics', 'Room 104', 'AVAILABLE', 20),
('doc_03', 'Dr. Shalini Ray, MBBS, DNB', 'Consultant Pediatrician & Family Health', 'General & Preventive Care', 'Room 108', 'AVAILABLE', 12);

INSERT INTO appointments (id, token_no, patient_name, patient_phone, patient_age, patient_gender, practitioner_id, service_name, slot_time, token_status, notes) VALUES
('apt_01', 'A-12', 'Ananya Sharma', '+91 98450 11223', 28, 'Female', 'doc_01', 'Laser Carbon Peel & Acne Consultation', '10:00 AM', 'COMPLETED', 'Follow up after 4 weeks of tretinoin'),
('apt_02', 'A-14', 'Vikramaditya Roy', '+91 99801 44556', 35, 'Male', 'doc_01', 'Cryotherapy for Viral Wart Removal', '10:30 AM', 'SERVING', 'Right forearm lesion'),
('apt_03', 'A-15', 'Meera Venkatesh', '+91 97402 77889', 42, 'Female', 'doc_01', 'Pigmentation & Melasma Review', '11:00 AM', 'WAITING', 'Reports from previous blood test attached'),
('apt_04', 'B-04', 'Rahul Krishnan', '+91 98860 33445', 29, 'Male', 'doc_02', 'Root Canal Treatment (Stage 2) & Crown Fit', '10:15 AM', 'SERVING', 'Tooth #36 sensitivity reduced'),
('apt_05', 'B-05', 'Kavita Sundaram', '+91 98455 66778', 52, 'Female', 'doc_02', 'Ultrasonic Scaling & Polishing', '11:00 AM', 'WAITING', 'Mild gingival bleeding reported'),
('apt_06', 'C-08', 'Master Aarav Patel', '+91 99001 22334', 6, 'Male', 'doc_03', 'Seasonal Asthma & Nebulization Followup', '10:45 AM', 'WAITING', 'Dry cough at night');

INSERT INTO prescriptions (id, appointment_id, patient_name, patient_phone, patient_age, patient_gender, doctor_name, department, room_no, diagnosis, vitals_bp, vitals_pulse, vitals_weight, vitals_temp, vitals_spo2, medicines_json, doctor_advice, follow_up) VALUES
('rx_01', 'apt_01', 'Ananya Sharma', '+91 98450 11223', 28, 'Female', 'Dr. Sarah Smith, MD', 'Dermatology & Skin Clinic', 'Room 101', 'Acne Vulgaris (Grade II) with Post-Inflammatory Erythema', '118/76 mmHg', '72 bpm', '58 kg', '98.4 °F', '99%',
 '[{"name":"Doxycycline 100mg","dosage":"1 Cap","freq":"1-0-0","days":"14 Days","instructions":"After breakfast with full glass of water"},{"name":"Adapalene + Benzoyl Peroxide Gel (0.1%/2.5%)","dosage":"Pea sized","freq":"0-0-1","days":"30 Days","instructions":"Apply thin film at bedtime on affected areas"},{"name":"Non-Comedogenic Sunscreen SPF 50+","dosage":"2 Fingers","freq":"1-1-0","days":"Daily","instructions":"Apply every 3 hours outdoors"}]',
 'Avoid heavy oil-based serums. Drink 3L water daily. Do not pick or squeeze lesions. Next review after 4 weeks.', '4 Weeks (28 Nov 2026)'),
('rx_02', 'apt_04', 'Rahul Krishnan', '+91 98860 33445', 29, 'Male', 'Dr. Arvind Menon, BDS, MDS', 'Dental & Orthodontics', 'Room 104', 'Acute Irreversible Pulpitis #36 (Post RCT Stage 1)', '124/82 mmHg', '76 bpm', '74 kg', '98.6 °F', '98%',
 '[{"name":"Amoxicillin + Clavulanic Acid 625mg","dosage":"1 Tab","freq":"1-0-1","days":"5 Days","instructions":"After meals"},{"name":"Aceclofenac + Paracetamol (100mg/325mg)","dosage":"1 Tab","freq":"1-0-1","days":"3 Days","instructions":"After meals (SOS for pain)"},{"name":"Chlorhexidine Gluconate 0.2% Oral Rinse","dosage":"10 ml","freq":"1-0-1","days":"7 Days","instructions":"Swish for 60 seconds after brushing"}]',
 'Avoid chewing hard foods on left quadrant until permanent crown placement. Warm saline rinses 3 times daily.', '7 Days for Crown Impression');

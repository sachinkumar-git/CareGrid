const nodemailer = require('nodemailer');
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const crypto = require('crypto');
const Razorpay = require('razorpay');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const razorpayInstance = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

db.connect((err) => {
    if (err) { console.error('DB Connection Failed:', err); return; }
    console.log('Connected to MySQL Database.');
});

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

transporter.verify((error) => {
    if (error) console.error('Email transport error (check .env):', error);
    else console.log('Email transport ready.');
});


// --- AUTH ---

app.post('/api/register', (req, res) => {
    const { full_name, email, password, role } = req.body;
    // Only patients can self-register; doctors are added by admin
    if (!['patient'].includes(role)) {
        return res.status(403).json({ success: false, message: 'Self-registration is only available for patients.' });
    }
    db.query("INSERT INTO users (full_name, email, password, role) VALUES (?, ?, ?, ?)",
        [full_name, email, password, role], (err) => {
            if (err) return res.status(500).json({ success: false, message: err.message });
            res.json({ success: true, message: 'Account created successfully!' });
        });
});

app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    db.query("SELECT id, full_name, role FROM users WHERE email = ? AND password = ?",
        [email, password], (err, results) => {
            if (err) return res.status(500).json({ success: false, message: err.message });
            if (results.length > 0) res.json({ success: true, user: results[0] });
            else res.status(401).json({ success: false, message: 'Invalid email or password.' });
        });
});


// --- ADMIN ---

app.get('/api/admin/stats', (req, res) => {
    const stats = {};
    db.query("SELECT COUNT(*) as count FROM doctors", (err, r) => {
        if (err) return res.status(500).json({ error: err.message });
        stats.totalDoctors = r[0].count;
        db.query("SELECT COUNT(*) as count FROM users WHERE role = 'patient'", (err, r) => {
            if (err) return res.status(500).json({ error: err.message });
            stats.totalPatients = r[0].count;
            db.query("SELECT COUNT(*) as count FROM appointments", (err, r) => {
                if (err) return res.status(500).json({ error: err.message });
                stats.totalAppointments = r[0].count;
                db.query("SELECT COUNT(*) as count FROM appointments WHERE status = 'pending'", (err, r) => {
                    if (err) return res.status(500).json({ error: err.message });
                    stats.pendingAppointments = r[0].count;
                    res.json(stats);
                });
            });
        });
    });
});

app.post('/api/admin/add-doctor', (req, res) => {
    const { full_name, email, password, specialization, fees, timing } = req.body;
    db.query("INSERT INTO users (full_name, email, password, role) VALUES (?, ?, ?, 'doctor')",
        [full_name, email, password], (err, userResult) => {
            if (err) return res.status(500).json({ success: false, message: err.message });
            db.query("INSERT INTO doctors (user_id, specialization, fees, timing) VALUES (?, ?, ?, ?)",
                [userResult.insertId, specialization, fees, timing], (err) => {
                    if (err) return res.status(500).json({ success: false, message: err.message });
                    res.json({ success: true, message: 'Doctor added successfully!' });
                });
        });
});

app.delete('/api/admin/delete-doctor/:doc_id', (req, res) => {
    db.query("SELECT user_id FROM doctors WHERE doc_id = ?", [req.params.doc_id], (err, result) => {
        if (err || result.length === 0) return res.status(404).json({ success: false, message: 'Doctor not found.' });
        const userId = result[0].user_id;
        db.query("DELETE FROM doctors WHERE doc_id = ?", [req.params.doc_id], (err) => {
            if (err) return res.status(500).json({ success: false, message: err.message });
            db.query("DELETE FROM users WHERE id = ?", [userId], (err) => {
                if (err) return res.status(500).json({ success: false, message: err.message });
                res.json({ success: true, message: 'Doctor removed successfully.' });
            });
        });
    });
});

app.get('/api/admin/appointments', (req, res) => {
    const sql = `SELECT a.app_id, u1.full_name AS patient_name, u2.full_name AS doctor_name,
                  d.specialization, a.appointment_date, a.status
                  FROM appointments a
                  JOIN users u1 ON a.patient_id = u1.id
                  JOIN doctors d ON a.doctor_id = d.doc_id
                  JOIN users u2 ON d.user_id = u2.id
                  ORDER BY a.appointment_date DESC`;
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});


// --- PATIENT ---

app.get('/api/doctors', (req, res) => {
    db.query(`SELECT d.doc_id, u.full_name as doc_name, d.specialization, d.fees, d.timing
               FROM doctors d JOIN users u ON d.user_id = u.id`, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

app.post('/api/create-order', async (req, res) => {
    try {
        const { amount } = req.body;
        const options = {
            amount: amount * 100, // paise
            currency: 'INR',
            receipt: `receipt_${Date.now()}`,
        };
        const order = await razorpayInstance.orders.create(options);
        res.json({ success: true, order });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

app.post('/api/verify-payment', async (req, res) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, appointmentData } = req.body;

    const sign = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSign = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(sign.toString())
        .digest('hex');

    if (razorpay_signature !== expectedSign) {
        return res.status(400).json({ success: false, message: 'Invalid payment signature.' });
    }

    const { patient_id, doctor_id, appointment_date } = appointmentData;
    db.query(
        "INSERT INTO appointments (patient_id, doctor_id, appointment_date, status) VALUES (?, ?, ?, 'pending')",
        [patient_id, doctor_id, appointment_date],
        (err) => {
            if (err) return res.status(500).json({ success: false, message: 'Database insertion failed.' });
            res.json({ success: true, message: 'Payment verified. Appointment is pending doctor approval.' });
        }
    );
});

app.get('/api/patient/appointments/:patient_id', (req, res) => {
    const sql = `SELECT a.app_id, u.full_name AS doctor_name, d.specialization,
                  a.appointment_date, a.status
                  FROM appointments a
                  JOIN doctors d ON a.doctor_id = d.doc_id
                  JOIN users u ON d.user_id = u.id
                  WHERE a.patient_id = ? ORDER BY a.appointment_date DESC`;
    db.query(sql, [req.params.patient_id], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

app.put('/api/appointments/cancel/:app_id', (req, res) => {
    db.query("UPDATE appointments SET status = 'cancelled' WHERE app_id = ? AND status = 'pending'",
        [req.params.app_id], (err, result) => {
            if (err) return res.status(500).json({ success: false, message: err.message });
            if (result.affectedRows === 0) return res.status(400).json({ success: false, message: 'Cannot cancel this appointment.' });
            res.json({ success: true, message: 'Appointment cancelled.' });
        });
});

app.get('/api/patient/receipt/:app_id', (req, res) => {
    const sql = `
        SELECT a.app_id, a.appointment_date, a.status,
                p.full_name AS patient_name,
                d_user.full_name AS doctor_name, doc.specialization, doc.fees,
                pr.medicine_name, pr.dosage, pr.duration, pr.instructions, pr.prescribed_at
        FROM appointments a
        JOIN users p ON a.patient_id = p.id
        JOIN doctors doc ON a.doctor_id = doc.doc_id
        JOIN users d_user ON doc.user_id = d_user.id
        LEFT JOIN prescriptions pr ON a.app_id = pr.app_id
        WHERE a.app_id = ?
    `;
    db.query(sql, [req.params.app_id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        if (result.length === 0) return res.status(404).json({ error: 'Receipt not found.' });
        res.json({ success: true, data: result[0] });
    });
});

// AI symptom-to-department routing via Gemini
app.post('/api/patient/predict-department', async (req, res) => {
    try {
        const { symptoms } = req.body;
        if (!symptoms) return res.status(400).json({ error: 'Symptoms are required.' });

        const prompt = `You are an expert medical routing AI. The patient has the following symptoms: "${symptoms}". 
        Output ONLY the exact name of the medical department they should visit. 
        Example outputs: "Cardiologist", "Neurologist", "Orthopedics", "Dermatologist", "Pediatrician", "General Physician".
        If unsure, output "General Physician". Do not include any other words or punctuation.`;

        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('Gemini API error:', data);
            return res.status(500).json({ success: false, message: 'AI service unavailable.' });
        }

        const predictedDepartment = data.candidates[0].content.parts[0].text.trim();

        db.query(
            `SELECT d.doc_id, u.full_name as doc_name, d.specialization, d.fees, d.timing
              FROM doctors d JOIN users u ON d.user_id = u.id
              WHERE d.specialization LIKE ?`,
            [`%${predictedDepartment}%`],
            (err, doctors) => {
                if (err) return res.status(500).json({ error: 'Database error fetching doctors.' });
                res.json({ success: true, department: predictedDepartment, doctors });
            }
        );
    } catch (error) {
        console.error('AI prediction error:', error);
        res.status(500).json({ success: false, message: 'AI prediction failed. Please try again.' });
    }
});


// --- DOCTOR ---

app.get('/api/doctor/profile/:user_id', (req, res) => {
    db.query("SELECT doc_id, specialization, fees, timing FROM doctors WHERE user_id = ?",
        [req.params.user_id], (err, result) => {
            if (err) return res.status(500).json({ error: err.message });
            if (result.length === 0) return res.status(404).json({ error: 'Doctor not found.' });
            res.json(result[0]);
        });
});

app.get('/api/doctor/appointments/:doc_id', (req, res) => {
    const sql = `SELECT a.app_id, u.full_name AS patient_name, a.patient_id, a.appointment_date, a.status
                  FROM appointments a JOIN users u ON a.patient_id = u.id
                  WHERE a.doctor_id = ? ORDER BY a.appointment_date DESC`;
    db.query(sql, [req.params.doc_id], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

app.post('/api/doctor/add-prescription', (req, res) => {
    const { app_id, doctor_id, patient_id, medicine_name, dosage, duration, instructions } = req.body;
    db.query(
        `INSERT INTO prescriptions (app_id, doctor_id, patient_id, medicine_name, dosage, duration, instructions)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [app_id, doctor_id, patient_id, medicine_name, dosage, duration, instructions],
        (err) => {
            if (err) return res.status(500).json({ success: false, message: err.message });
            db.query("UPDATE appointments SET status = 'completed' WHERE app_id = ?", [app_id], (updateErr) => {
                if (updateErr) return res.status(500).json({ success: false, message: updateErr.message });
                res.json({ success: true, message: 'Prescription saved and appointment marked completed.' });
            });
        }
    );
});

app.put('/api/appointments/update-status', (req, res) => {
    const { app_id, status } = req.body;

    db.query("UPDATE appointments SET status = ? WHERE app_id = ?", [status, app_id], (err) => {
        if (err) return res.status(500).json({ error: err.message });

        // Fire-and-forget email notification to patient
        const fetchSql = `
            SELECT u.email, u.full_name AS patient_name, a.appointment_date
            FROM appointments a JOIN users u ON a.patient_id = u.id
            WHERE a.app_id = ?
        `;
        db.query(fetchSql, [app_id], (err, patientInfo) => {
            if (!err && patientInfo.length > 0) {
                const patient = patientInfo[0];
                const date = new Date(patient.appointment_date).toLocaleDateString('en-IN', { dateStyle: 'long' });
                const isApproved = status === 'approved';

                const mailOptions = {
                    from: `"CareGrid" <${process.env.EMAIL_USER}>`,
                    to: patient.email,
                    subject: `Appointment ${status.charAt(0).toUpperCase() + status.slice(1)} — CareGrid`,
                    html: `
                        <div style="font-family: Arial, sans-serif; max-width: 520px; margin: auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
                            <div style="background-color: ${isApproved ? '#10b981' : '#ef4444'}; padding: 20px; text-align: center; color: white;">
                                <h2 style="margin: 0; font-size: 22px;">Appointment ${status.charAt(0).toUpperCase() + status.slice(1)}</h2>
                            </div>
                            <div style="padding: 28px; background-color: #f8fafc; color: #334155;">
                                <p style="font-size: 15px;">Hello <b>${patient.patient_name}</b>,</p>
                                <p style="font-size: 14px; line-height: 1.6;">
                                    Your appointment scheduled for <b>${date}</b> has been
                                    <strong style="color: ${isApproved ? '#10b981' : '#ef4444'};">${status}</strong> by the doctor.
                                </p>
                                ${isApproved
                                    ? '<p style="font-size: 13px;">Please arrive 15 minutes before your scheduled time.</p>'
                                    : '<p style="font-size: 13px;">We apologize for the inconvenience. A refund will be processed as per policy.</p>'
                                }
                            </div>
                            <div style="background-color: #1e293b; color: #94a3b8; text-align: center; padding: 14px; font-size: 12px;">
                                &copy; 2026 CareGrid &mdash; Integrated Healthcare Operations Platform
                            </div>
                        </div>
                    `
                };

                transporter.sendMail(mailOptions, (mailErr) => {
                    if (mailErr) console.error('Email notification failed:', mailErr.message);
                });
            }
        });

        res.json({ success: true, message: `Appointment ${status}.` });
    });
});


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`CareGrid backend running on port ${PORT}`));
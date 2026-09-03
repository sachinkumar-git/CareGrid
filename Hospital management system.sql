--   CareGrid — Integrated Healthcare Operations Platform
--   Database Schema | MySQL


DROP DATABASE IF EXISTS Hospital_HMS;
CREATE DATABASE Hospital_HMS;
USE Hospital_HMS;

-- SECTION 1: TABLE DEFINITIONS
-- Users Table
CREATE TABLE users (
    id          INT PRIMARY KEY AUTO_INCREMENT,
    full_name   VARCHAR(100) NOT NULL,
    email       VARCHAR(100) UNIQUE NOT NULL,
    password    VARCHAR(255) NOT NULL,
    role        ENUM('admin', 'doctor', 'patient') NOT NULL,
    is_active   BOOLEAN DEFAULT TRUE,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Doctors Table
CREATE TABLE doctors (
    doc_id          INT PRIMARY KEY AUTO_INCREMENT,
    user_id         INT NOT NULL,
    specialization  VARCHAR(100) NOT NULL,
    fees            DECIMAL(10, 2) NOT NULL,
    timing          VARCHAR(100),
    experience_yrs  INT DEFAULT 0,
    is_available    BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Appointments Table
CREATE TABLE appointments (
    app_id              INT PRIMARY KEY AUTO_INCREMENT,
    patient_id          INT NOT NULL,
    doctor_id           INT NOT NULL,
    appointment_date    DATE NOT NULL,
    status              ENUM('pending', 'approved', 'cancelled', 'completed') DEFAULT 'pending',
    notes               TEXT,
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (doctor_id)  REFERENCES doctors(doc_id) ON DELETE CASCADE
);

-- Prescriptions Table
CREATE TABLE prescriptions (
    pres_id         INT PRIMARY KEY AUTO_INCREMENT,
    app_id          INT NOT NULL,
    doctor_id       INT NOT NULL,
    patient_id      INT NOT NULL,
    medicine_name   VARCHAR(200) NOT NULL,
    dosage          VARCHAR(100),
    duration        VARCHAR(100),
    instructions    TEXT,
    prescribed_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (app_id)     REFERENCES appointments(app_id) ON DELETE CASCADE,
    FOREIGN KEY (doctor_id)  REFERENCES doctors(doc_id),
    FOREIGN KEY (patient_id) REFERENCES users(id)
);

-- Audit Log Table
CREATE TABLE appointment_audit_log (
    log_id      INT PRIMARY KEY AUTO_INCREMENT,
    app_id      INT NOT NULL,
    old_status  VARCHAR(50),
    new_status  VARCHAR(50),
    changed_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- SECTION 2: INDEXES (Performance Optimization)

CREATE INDEX idx_appointments_patient   ON appointments(patient_id);
CREATE INDEX idx_appointments_doctor    ON appointments(doctor_id);
CREATE INDEX idx_appointments_date      ON appointments(appointment_date);
CREATE INDEX idx_appointments_status    ON appointments(status);
CREATE INDEX idx_doctors_user           ON doctors(user_id);
CREATE INDEX idx_users_email            ON users(email);
CREATE INDEX idx_users_role             ON users(role);


-- SECTION 3: VIEWS

-- View 1: Complete Appointments Overview
CREATE VIEW vw_appointments_full AS
SELECT
    a.app_id,
    p.full_name      AS patient_name,
    p.email          AS patient_email,
    d.full_name      AS doctor_name,
    doc.specialization,
    doc.fees,
    a.appointment_date,
    a.status,
    a.notes,
    a.created_at     AS booked_at
FROM appointments a
JOIN users  p   ON a.patient_id = p.id
JOIN doctors doc ON a.doctor_id  = doc.doc_id
JOIN users  d   ON doc.user_id   = d.id;

-- View 2: Doctor Stats View
CREATE VIEW vw_doctor_stats AS
SELECT
    doc.doc_id,
    u.full_name          AS doctor_name,
    doc.specialization,
    doc.fees,
    doc.experience_yrs,
    COUNT(a.app_id)                                          AS total_appointments,
    SUM(a.status = 'approved')                               AS approved_count,
    SUM(a.status = 'pending')                                AS pending_count,
    SUM(a.status = 'cancelled')                              AS cancelled_count,
    SUM(a.status = 'completed')                              AS completed_count,
    COALESCE(SUM(a.status = 'completed') * doc.fees, 0)      AS total_revenue
FROM doctors doc
JOIN users u         ON doc.user_id  = u.id
LEFT JOIN appointments a ON a.doctor_id = doc.doc_id
GROUP BY doc.doc_id, u.full_name, doc.specialization, doc.fees, doc.experience_yrs;

-- View 3: Patient History View
CREATE VIEW vw_patient_history AS
SELECT
    u.id             AS patient_id,
    u.full_name      AS patient_name,
    u.email,
    COUNT(a.app_id)              AS total_bookings,
    SUM(a.status = 'completed')  AS completed,
    SUM(a.status = 'cancelled')  AS cancelled,
    MAX(a.appointment_date)      AS last_appointment
FROM users u
LEFT JOIN appointments a ON a.patient_id = u.id
WHERE u.role = 'patient'
GROUP BY u.id, u.full_name, u.email;

-- View 4: Today's Appointments
CREATE VIEW vw_todays_appointments AS
SELECT
    a.app_id,
    p.full_name  AS patient_name,
    d.full_name  AS doctor_name,
    doc.specialization,
    a.appointment_date,
    a.status
FROM appointments a
JOIN users  p    ON a.patient_id = p.id
JOIN doctors doc ON a.doctor_id  = doc.doc_id
JOIN users  d    ON doc.user_id  = d.id
WHERE a.appointment_date = CURDATE();


-- SECTION 4: STORED PROCEDURES

DELIMITER $$

-- Procedure 1: Book an Appointment
CREATE PROCEDURE sp_book_appointment(
    IN  p_patient_id      INT,
    IN  p_doctor_id       INT,
    IN  p_date            DATE,
    OUT p_result_msg      VARCHAR(200)
)
BEGIN
    DECLARE existing_count INT DEFAULT 0;

    -- Check if patient already has appointment with this doctor on same date
    SELECT COUNT(*) INTO existing_count
    FROM appointments
    WHERE patient_id = p_patient_id
      AND doctor_id  = p_doctor_id
      AND appointment_date = p_date
      AND status NOT IN ('cancelled');

    IF existing_count > 0 THEN
        SET p_result_msg = 'ERROR: You already have an appointment with this doctor on this date.';
    ELSE
        INSERT INTO appointments (patient_id, doctor_id, appointment_date, status)
        VALUES (p_patient_id, p_doctor_id, p_date, 'pending');
        SET p_result_msg = 'SUCCESS: Appointment booked successfully!';
    END IF;
END$$

-- Procedure 2: Add a Full Doctor (user + doctor record together)
CREATE PROCEDURE sp_add_doctor(
    IN p_full_name      VARCHAR(100),
    IN p_email          VARCHAR(100),
    IN p_password       VARCHAR(255),
    IN p_spec           VARCHAR(100),
    IN p_fees           DECIMAL(10,2),
    IN p_timing         VARCHAR(100),
    IN p_exp            INT
)
BEGIN
    DECLARE new_user_id INT;
    INSERT INTO users (full_name, email, password, role)
    VALUES (p_full_name, p_email, p_password, 'doctor');
    SET new_user_id = LAST_INSERT_ID();
    INSERT INTO doctors (user_id, specialization, fees, timing, experience_yrs)
    VALUES (new_user_id, p_spec, p_fees, p_timing, p_exp);
    SELECT 'Doctor added successfully' AS message, new_user_id AS user_id, LAST_INSERT_ID() AS doc_id;
END$$

-- Procedure 3: Get Full Doctor Dashboard Data
CREATE PROCEDURE sp_get_doctor_dashboard(IN p_user_id INT)
BEGIN
    -- Doctor profile
    SELECT d.doc_id, u.full_name, d.specialization, d.fees, d.timing, d.experience_yrs
    FROM doctors d JOIN users u ON d.user_id = u.id
    WHERE d.user_id = p_user_id;

    -- Their appointments
    SELECT a.app_id, u.full_name AS patient_name, a.appointment_date, a.status, a.notes
    FROM appointments a
    JOIN doctors d  ON a.doctor_id  = d.doc_id
    JOIN users u    ON a.patient_id = u.id
    WHERE d.user_id = p_user_id
    ORDER BY a.appointment_date DESC;
END$$

-- Procedure 4: Mark Old Appointments as Completed
CREATE PROCEDURE sp_mark_completed_appointments()
BEGIN
    UPDATE appointments
    SET status = 'completed'
    WHERE appointment_date < CURDATE()
      AND status = 'approved';
    SELECT ROW_COUNT() AS appointments_marked_completed;
END$$

DELIMITER ;


-- SECTION 5: TRIGGERS

DELIMITER $$

-- Trigger 1: Log every appointment status change
CREATE TRIGGER trg_appointment_status_change
AFTER UPDATE ON appointments
FOR EACH ROW
BEGIN
    IF OLD.status <> NEW.status THEN
        INSERT INTO appointment_audit_log (app_id, old_status, new_status)
        VALUES (NEW.app_id, OLD.status, NEW.status);
    END IF;
END$$

-- Trigger 2: Prevent booking on past dates
CREATE TRIGGER trg_prevent_past_booking
BEFORE INSERT ON appointments
FOR EACH ROW
BEGIN
    IF NEW.appointment_date < CURDATE() THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Cannot book appointment for a past date.';
    END IF;
END$$

-- Trigger 3: Auto-set updated_at on users
CREATE TRIGGER trg_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
BEGIN
    SET NEW.updated_at = CURRENT_TIMESTAMP;
END$$

DELIMITER ;


-- SECTION 6: SEED DATA

-- NOTE: Passwords are stored as plaintext in this schema.
-- Production deployments must hash passwords using bcrypt or similar.
INSERT INTO users (full_name, email, password, role) VALUES
('System Admin',    'admin@hms.com',   'admin123', 'admin'),
('Dr. Ramesh Sharma', 'ramesh@hms.com', 'doc123',  'doctor'),
('Dr. Sunita Verma',  'sunita@hms.com', 'doc123',  'doctor'),
('Dr. Anil Kapoor',   'anil@hms.com',   'doc123',  'doctor'),
('Rahul Mehta',       'rahul@hms.com',  'pat123',  'patient'),
('Priya Singh',       'priya@hms.com',  'pat123',  'patient');

INSERT INTO doctors (user_id, specialization, fees, timing, experience_yrs) VALUES
(2, 'Cardiologist',      1000.00, '10:00 AM - 02:00 PM', 12),
(3, 'Pediatrician',       800.00, '04:00 PM - 08:00 PM',  8),
(4, 'General Physician',  500.00, '09:00 AM - 01:00 PM',  5);

-- Sample appointment
INSERT INTO appointments (patient_id, doctor_id, appointment_date, status) VALUES
(5, 1, DATE_ADD(CURDATE(), INTERVAL 2 DAY), 'pending'),
(6, 2, DATE_ADD(CURDATE(), INTERVAL 3 DAY), 'approved'),
(5, 3, DATE_ADD(CURDATE(), INTERVAL 1 DAY), 'pending');

-- Sample prescription
INSERT INTO prescriptions (app_id, doctor_id, patient_id, medicine_name, dosage, duration, instructions) VALUES
(2, 2, 6, 'Paracetamol 500mg', '1 tablet', '5 days', 'Take after meals');


-- SECTION 7: USEFUL QUERIES (For viva / report)

-- Q1: All appointments with doctor and patient details
SELECT * FROM vw_appointments_full;

-- Q2: Doctor-wise statistics
SELECT * FROM vw_doctor_stats;

-- Q3: Patient appointment history
SELECT * FROM vw_patient_history;

-- Q4: Today's schedule
SELECT * FROM vw_todays_appointments;

-- Q5: Most booked specialization
SELECT specialization, COUNT(*) AS total_bookings
FROM vw_appointments_full
GROUP BY specialization
ORDER BY total_bookings DESC;

-- Q6: Revenue per doctor
SELECT doctor_name, specialization, total_revenue
FROM vw_doctor_stats
ORDER BY total_revenue DESC;

-- Q7: Pending appointments older than today
SELECT * FROM appointments
WHERE status = 'pending' AND appointment_date < CURDATE();

-- Q8: Call stored procedure to book appointment
-- CALL sp_book_appointment(5, 1, '2026-05-01', @msg);
-- SELECT @msg;

-- Q9: Mark all past approved as completed
-- CALL sp_mark_completed_appointments();

-- Q10: Audit log check
SELECT * FROM appointment_audit_log ORDER BY changed_at DESC;
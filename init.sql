CREATE TABLE IF NOT EXISTS users (
	user_id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    first_name VARCHAR(64),
    last_name VARCHAR(64),
    password_hash CHAR(60) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    role ENUM('customer', 'admin') NOT NULL DEFAULT 'customer',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_banned BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS courts (
	court_id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    court_name VARCHAR(32) NOT NULL UNIQUE,
    sport VARCHAR(32) NOT NULL
);

CREATE TABLE IF NOT EXISTS bookings (
	booking_id INT AUTO_INCREMENT PRIMARY KEY,
	user_id INT NOT NULL,
	court_id INT NOT NULL,
    booked_date DATE NOT NULL,
    booked_time TIME NOT NULL,
    booking_status ENUM('pending', 'confirmed', 'cancelled', 'no_show', 'completed') DEFAULT 'pending',
    payment_status ENUM('paid', 'pending', 'refunded') DEFAULT 'pending',
    payment_method VARCHAR(64) DEFAULT 'transferencia_bancaria',
    payment_proof VARCHAR(255) DEFAULT NULL,
    price DECIMAL(10, 2) DEFAULT 15.00,
    customer_name VARCHAR(128) DEFAULT NULL,
    customer_id VARCHAR(64) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(user_id),
    FOREIGN KEY (court_id) REFERENCES courts(court_id),
    
	active_slot VARCHAR(60) AS (
        IF(booking_status IN ('pending', 'confirmed'), CONCAT(court_id, '-', booked_date, '-', booked_time), NULL)
    ) STORED,
	UNIQUE KEY uq_active_slot (active_slot)
);

-- Migración: agregar columnas si ya existe la tabla (seguro para DBs existentes)
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS customer_name VARCHAR(128) DEFAULT NULL;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS customer_id VARCHAR(64) DEFAULT NULL;

-- 10 canchas de fútbol 5
INSERT IGNORE INTO courts (court_name, sport) VALUES ('Cancha 1', 'futbol5');
INSERT IGNORE INTO courts (court_name, sport) VALUES ('Cancha 2', 'futbol5');
INSERT IGNORE INTO courts (court_name, sport) VALUES ('Cancha 3', 'futbol5');
INSERT IGNORE INTO courts (court_name, sport) VALUES ('Cancha 4', 'futbol5');
INSERT IGNORE INTO courts (court_name, sport) VALUES ('Cancha 5', 'futbol5');
INSERT IGNORE INTO courts (court_name, sport) VALUES ('Cancha 6', 'futbol5');
INSERT IGNORE INTO courts (court_name, sport) VALUES ('Cancha 7', 'futbol5');
INSERT IGNORE INTO courts (court_name, sport) VALUES ('Cancha 8', 'futbol5');
INSERT IGNORE INTO courts (court_name, sport) VALUES ('Cancha 9', 'futbol5');
INSERT IGNORE INTO courts (court_name, sport) VALUES ('Cancha 10', 'futbol5');

-- Usuario administrador por defecto (contraseña: Admin123!)
-- Hash bcrypt de 'Admin123!' con 10 rounds
INSERT IGNORE INTO users (first_name, last_name, password_hash, email, role)
VALUES (
    'Administrador',
    'Sistema',
    '$2b$10$.Zo9avfX3Wmq0l4UzNjlNuS5o7EFmg8BsZ0VlnwwQdBto6.3k5CF.',
    'admin@canchas.com',
    'admin'
);
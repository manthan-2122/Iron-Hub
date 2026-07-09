-- Run this in MySQL to set up the database

CREATE DATABASE IF NOT EXISTS gym_management;
USE gym_management;

-- Main users table (all roles stored here)
CREATE TABLE IF NOT EXISTS users (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name  VARCHAR(100) NOT NULL DEFAULT '',
    email      VARCHAR(150) NOT NULL UNIQUE,
    password   VARCHAR(255) NOT NULL,
    role       ENUM('user', 'trainer', 'admin') NOT NULL DEFAULT 'user',
    status     ENUM('Pending', 'Active', 'Inactive') NOT NULL DEFAULT 'Pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Extra trainer details
CREATE TABLE IF NOT EXISTS trainers (
    id             INT AUTO_INCREMENT PRIMARY KEY,
    user_id        INT NOT NULL UNIQUE,
    specialization VARCHAR(100) NOT NULL,
    experience     INT DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Extended trainer profile details
CREATE TABLE IF NOT EXISTS trainer_profiles (
    id             INT AUTO_INCREMENT PRIMARY KEY,
    user_id        INT NOT NULL UNIQUE,
    phone          VARCHAR(20)  DEFAULT '',
    bio            TEXT         DEFAULT NULL,
    certifications TEXT         DEFAULT NULL,
    hourly_rate    DECIMAL(8,2) DEFAULT NULL,
    availability   VARCHAR(100) DEFAULT 'Available',
    profile_image  VARCHAR(255) DEFAULT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Extended user profile details
CREATE TABLE IF NOT EXISTS user_profiles (
    id             INT AUTO_INCREMENT PRIMARY KEY,
    user_id        INT NOT NULL UNIQUE,
    phone          VARCHAR(20)  DEFAULT '',
    age            INT          DEFAULT NULL,
    gender         VARCHAR(20)  DEFAULT '',
    height         DECIMAL(5,2) DEFAULT NULL,
    weight         DECIMAL(5,2) DEFAULT NULL,
    fitness_goal   VARCHAR(50)  DEFAULT '',
    activity_level VARCHAR(50)  DEFAULT '',
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Subscriptions
CREATE TABLE IF NOT EXISTS subscriptions (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    user_id    INT NOT NULL,
    plan_name  VARCHAR(50)  NOT NULL,
    amount     DECIMAL(8,2) NOT NULL,
    start_date DATE         NOT NULL,
    expiry_date DATE        NOT NULL,
    status     ENUM('Pending','Active','Expired','Cancelled') NOT NULL DEFAULT 'Pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Email Preferences
CREATE TABLE IF NOT EXISTS email_preferences (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    membership_expiry BOOLEAN DEFAULT TRUE,
    workout_reminders BOOLEAN DEFAULT TRUE,
    progress_reports BOOLEAN DEFAULT TRUE,
    new_offers BOOLEAN DEFAULT TRUE,
    chat_notifications BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Live Chat Messages
CREATE TABLE IF NOT EXISTS chat_messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    message TEXT NOT NULL,
    sender_type ENUM('user', 'support') DEFAULT 'user',
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX user_created (user_id, created_at)
);

-- BMI Records
CREATE TABLE IF NOT EXISTS bmi_records (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    height DECIMAL(5,2) NOT NULL,
    weight DECIMAL(5,2) NOT NULL,
    bmi DECIMAL(5,2) NOT NULL,
    category VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX user_created (user_id, created_at)
);

-- Membership Expiry Alerts
CREATE TABLE IF NOT EXISTS membership_expiry_alerts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    subscription_id INT,
    expiry_date DATE NOT NULL,
    days_until_expiry INT,
    alert_sent BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (subscription_id) REFERENCES subscriptions(id) ON DELETE SET NULL
);

-- Workout Plans (temporary, expires in 24 hours)
CREATE TABLE IF NOT EXISTS workout_plans (
    id                  INT AUTO_INCREMENT PRIMARY KEY,
    user_id             INT NOT NULL,
    name                VARCHAR(255) NOT NULL,
    type                VARCHAR(100) DEFAULT '',
    duration_minutes    INT NOT NULL,
    estimated_calories  INT NOT NULL,
    difficulty          ENUM('Beginner','Intermediate','Advanced') DEFAULT 'Intermediate',
    description         TEXT,
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at          DATETIME NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Workout History (completed workouts log)
CREATE TABLE IF NOT EXISTS workout_history (
    id                  INT AUTO_INCREMENT PRIMARY KEY,
    user_id             INT NOT NULL,
    workout_plan_id     INT,
    workout_name        VARCHAR(255) NOT NULL,
    duration_minutes    INT NOT NULL,
    duration_seconds    INT DEFAULT 0,
    calories_burned     INT NOT NULL,
    completed           BOOLEAN DEFAULT TRUE,
    completed_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (workout_plan_id) REFERENCES workout_plans(id) ON DELETE SET NULL
);

-- Body Measurements (progress tracking)
CREATE TABLE IF NOT EXISTS measurements (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    user_id     INT NOT NULL,
    weight      DECIMAL(5,2) NOT NULL,
    body_fat    DECIMAL(4,2) DEFAULT NULL,
    chest       DECIMAL(5,2) DEFAULT NULL,
    waist       DECIMAL(5,2) DEFAULT NULL,
    hips        DECIMAL(5,2) DEFAULT NULL,
    logged_date DATE NOT NULL,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_date (user_id, logged_date)
);

-- Trainer-Client Assignments
CREATE TABLE IF NOT EXISTS trainer_clients (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    trainer_id  INT NOT NULL,
    client_id   INT NOT NULL,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (trainer_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (client_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_assignment (trainer_id, client_id)
);

DELETE FROM users;

UPDATE users
SET status = 'Active'
WHERE id = 3;



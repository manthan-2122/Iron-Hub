-- Active: 1776186931652@@mysql-1e100372-developer1-e1bc.g.aivencloud.com@27075@gym_management
-- New Tables for Features

-- Email Notification Preferences
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

-- Membership Expiry History
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

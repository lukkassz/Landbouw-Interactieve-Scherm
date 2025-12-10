-- Table for quiz questions
CREATE TABLE IF NOT EXISTS quiz_questions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    event_id INT NULL,
    question VARCHAR(500) NOT NULL DEFAULT 'Waarvoor werd dit werktuig gebruikt?',
    image_url VARCHAR(1000) NOT NULL,
    correct_answer VARCHAR(255) NOT NULL,
    option_1 VARCHAR(255) NOT NULL,
    option_2 VARCHAR(255) NOT NULL,
    option_3 VARCHAR(255) NOT NULL,
    option_4 VARCHAR(255) NULL,
    category VARCHAR(100) DEFAULT 'gereedschap',
    difficulty ENUM('easy', 'medium', 'hard') DEFAULT 'medium',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_active TINYINT(1) DEFAULT 1,
    FOREIGN KEY (event_id) REFERENCES timeline_events(id) ON DELETE CASCADE
);

-- Table for quiz scores/leaderboard
CREATE TABLE IF NOT EXISTS quiz_scores (
    id INT AUTO_INCREMENT PRIMARY KEY,
    player_name VARCHAR(50) NOT NULL,
    score INT NOT NULL,
    total_questions INT NOT NULL DEFAULT 10,
    percentage DECIMAL(5,2) GENERATED ALWAYS AS (score / total_questions * 100) STORED,
    played_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_score (score DESC, played_at DESC)
);


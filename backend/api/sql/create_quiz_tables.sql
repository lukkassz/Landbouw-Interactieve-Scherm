-- Table for quiz questions
CREATE TABLE IF NOT EXISTS quiz_questions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    event_id INT NULL,
    question VARCHAR(500) NOT NULL DEFAULT 'Do czego służyło to narzędzie?',
    image_url VARCHAR(1000) NOT NULL,
    correct_answer VARCHAR(255) NOT NULL,
    option_1 VARCHAR(255) NOT NULL,
    option_2 VARCHAR(255) NOT NULL,
    option_3 VARCHAR(255) NOT NULL,
    option_4 VARCHAR(255) NULL,
    category VARCHAR(100) DEFAULT 'narzędzia',
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

-- Enkele voorbeeldvragen toevoegen
INSERT INTO quiz_questions (question, image_url, correct_answer, option_1, option_2, option_3, option_4, category, difficulty) VALUES
('Waarvoor werd dit werktuig gebruikt?', 'https://via.placeholder.com/600x400?text=Sikkel', 'Voor het oogsten van graan', 'Voor het ploegen', 'Voor het oogsten van graan', 'Voor het melken van koeien', NULL, 'gereedschap', 'easy'),
('Waarvoor werd dit werktuig gebruikt?', 'https://via.placeholder.com/600x400?text=Ploeg', 'Voor het ploegen van de grond', 'Voor het ploegen van de grond', 'Voor het zaaien', 'Voor het dorsen', NULL, 'gereedschap', 'easy'),
('Waarvoor werd dit werktuig gebruikt?', 'https://via.placeholder.com/600x400?text=Wan', 'Voor het wannen van graan', 'Voor het wannen van graan', 'Voor het maaien van gras', 'Voor het maken van boter', NULL, 'gereedschap', 'medium'),
('Waarvoor werd dit werktuig gebruikt?', 'https://via.placeholder.com/600x400?text=Dorsvlegel', 'Voor het dorsen van graan', 'Voor het graven', 'Voor het dorsen van graan', 'Voor het kammen van wol', NULL, 'gereedschap', 'medium'),
('Waarvoor werd dit werktuig gebruikt?', 'https://via.placeholder.com/600x400?text=Hekel', 'Voor het hekelen van vlas', 'Voor het scheren van schapen', 'Voor het hekelen van vlas', 'Voor het strijken', NULL, 'gereedschap', 'hard'),
('Waarvoor werd dit werktuig gebruikt?', 'https://via.placeholder.com/600x400?text=Spinnewiel', 'Voor het spinnen van wol', 'Voor het dorsen', 'Voor het spinnen van wol', 'Voor het weven', NULL, 'gereedschap', 'medium'),
('Waarvoor werd dit werktuig gebruikt?', 'https://via.placeholder.com/600x400?text=Botervat', 'Voor het maken van boter', 'Voor het maken van boter', 'Voor het melken', 'Voor het wassen', NULL, 'gereedschap', 'easy'),
('Waarvoor werd dit werktuig gebruikt?', 'https://via.placeholder.com/600x400?text=Zeis', 'Voor het maaien van gras en graan', 'Voor het ploegen', 'Voor het planten', 'Voor het maaien van gras en graan', NULL, 'gereedschap', 'easy'),
('Waarvoor werd dit werktuig gebruikt?', 'https://via.placeholder.com/600x400?text=Hark', 'Voor het harken van hooi', 'Voor het graven', 'Voor het harken van hooi', 'Voor het planten', NULL, 'gereedschap', 'easy'),
('Waarvoor werd dit werktuig gebruikt?', 'https://via.placeholder.com/600x400?text=Hooivork', 'Voor het verplaatsen van hooi', 'Voor het verplaatsen van hooi', 'Voor het ploegen', 'Voor het graven', NULL, 'gereedschap', 'easy');


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

-- Insert some example questions
INSERT INTO quiz_questions (question, image_url, correct_answer, option_1, option_2, option_3, option_4, category, difficulty) VALUES
('Do czego służyło to narzędzie?', 'https://via.placeholder.com/600x400?text=Sierp', 'Do żniw zboża', 'Do orki', 'Do żniw zboża', 'Do dojenia krów', NULL, 'narzędzia', 'easy'),
('Do czego służyło to narzędzie?', 'https://via.placeholder.com/600x400?text=Pług', 'Do orki pola', 'Do orki pola', 'Do siewu', 'Do młócki', NULL, 'narzędzia', 'easy'),
('Do czego służyło to narzędzie?', 'https://via.placeholder.com/600x400?text=Wialnia', 'Do przesiewania ziarna', 'Do przesiewania ziarna', 'Do koszenia trawy', 'Do robienia masła', NULL, 'narzędzia', 'medium'),
('Do czego służyło to narzędzie?', 'https://via.placeholder.com/600x400?text=Cep', 'Do młócki zboża', 'Do kopania', 'Do młócki zboża', 'Do czesania wełny', NULL, 'narzędzia', 'medium'),
('Do czego służyło to narzędzie?', 'https://via.placeholder.com/600x400?text=Trepy', 'Do czesania lnu', 'Do strzyżenia owiec', 'Do czesania lnu', 'Do prasowania', NULL, 'narzędzia', 'hard'),
('Do czego służyło to narzędzie?', 'https://via.placeholder.com/600x400?text=Kołowrotek', 'Do przędzenia nici', 'Do młócenia', 'Do przędzenia nici', 'Do tkania', NULL, 'narzędzia', 'medium'),
('Do czego służyło to narzędzie?', 'https://via.placeholder.com/600x400?text=Masielnica', 'Do robienia masła', 'Do robienia masła', 'Do dojenia', 'Do prania', NULL, 'narzędzia', 'easy'),
('Do czego służyło to narzędzie?', 'https://via.placeholder.com/600x400?text=Kosa', 'Do koszenia trawy i zboża', 'Do orki', 'Do sadzenia', 'Do koszenia trawy i zboża', NULL, 'narzędzia', 'easy'),
('Do czego służyło to narzędzie?', 'https://via.placeholder.com/600x400?text=Grabie', 'Do grabienia siana', 'Do kopania', 'Do grabienia siana', 'Do sadzenia', NULL, 'narzędzia', 'easy'),
('Do czego służyło to narzędzie?', 'https://via.placeholder.com/600x400?text=Widły', 'Do przerzucania siana', 'Do przerzucania siana', 'Do orki', 'Do kopania', NULL, 'narzędzia', 'easy');


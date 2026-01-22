<?php
/**
 * Quiz Scores API
 * 
 * GET: Fetch quiz leaderboard (filtered by event_id and difficulty)
 * POST: Save quiz score (with event_id and difficulty, no duplicate nicknames)
 */

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json; charset=UTF-8');

// Handle preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/config/database.php';

$database = new Database();
$db = $database->getConnection();

if (!$db) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Databaseverbinding mislukt'
    ]);
    exit();
}

// Ensure table has event_id and difficulty columns
function ensureTableColumns($db) {
    try {
        // Check if event_id column exists
        $checkEventId = $db->query("SHOW COLUMNS FROM quiz_scores LIKE 'event_id'");
        if ($checkEventId->rowCount() === 0) {
            $db->exec("ALTER TABLE quiz_scores ADD COLUMN event_id INT NULL AFTER id");
        }
        
        // Check if difficulty column exists
        $checkDifficulty = $db->query("SHOW COLUMNS FROM quiz_scores LIKE 'difficulty'");
        if ($checkDifficulty->rowCount() === 0) {
            $db->exec("ALTER TABLE quiz_scores ADD COLUMN difficulty VARCHAR(10) DEFAULT 'easy' AFTER event_id");
        }
        
        return true;
    } catch (PDOException $e) {
        // Table might not exist yet, that's okay
        return false;
    }
}

// GET Request - Fetch Leaderboard
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        // Check if table exists
        $checkTable = $db->query("SHOW TABLES LIKE 'quiz_scores'");
        if ($checkTable->rowCount() === 0) {
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'message' => 'Tabel quiz_scores bestaat niet nog.',
                'scores' => []
            ]);
            exit();
        }
        
        // Ensure columns exist
        ensureTableColumns($db);
        
        $limit = isset($_GET['limit']) ? intval($_GET['limit']) : 50;
        $event_id = isset($_GET['event_id']) ? intval($_GET['event_id']) : null;
        $difficulty = isset($_GET['difficulty']) ? $_GET['difficulty'] : null;
        
        // Build query based on filters
        $where_clauses = [];
        $params = [];
        
        if ($event_id !== null) {
            $where_clauses[] = "event_id = :event_id";
            $params[':event_id'] = $event_id;
        }
        
        if ($difficulty !== null && in_array($difficulty, ['easy', 'hard'])) {
            $where_clauses[] = "difficulty = :difficulty";
            $params[':difficulty'] = $difficulty;
        }
        
        $where_sql = '';
        if (!empty($where_clauses)) {
            $where_sql = "WHERE " . implode(" AND ", $where_clauses);
        }
        
        $query = "SELECT player_name, score, total_questions, percentage, played_at, event_id, difficulty 
                 FROM quiz_scores 
                 $where_sql
                 ORDER BY score DESC, percentage DESC, played_at DESC 
                 LIMIT :limit";
        
        $stmt = $db->prepare($query);
        $stmt->bindParam(':limit', $limit, PDO::PARAM_INT);
        
        foreach ($params as $key => $value) {
            if ($key === ':event_id') {
                $stmt->bindValue($key, $value, PDO::PARAM_INT);
            } else {
                $stmt->bindValue($key, $value, PDO::PARAM_STR);
            }
        }
        
        $stmt->execute();
        
        $scores = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Add rank
        foreach ($scores as $index => &$score) {
            $score['rank'] = $index + 1;
        }
        
        http_response_code(200);
        echo json_encode([
            'success' => true,
            'count' => count($scores),
            'scores' => $scores
        ]);
        
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => 'Database error: ' . $e->getMessage()
        ]);
    }
}

// POST Request - Save Score
elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
    try {
        // Ensure columns exist
        ensureTableColumns($db);
        
        $data = json_decode(file_get_contents("php://input"), true);
        
        $player_name = isset($data['player_name']) ? trim($data['player_name']) : '';
        $score = isset($data['score']) ? intval($data['score']) : 0;
        $total_questions = isset($data['total_questions']) ? intval($data['total_questions']) : 10;
        $event_id = isset($data['event_id']) ? intval($data['event_id']) : null;
        $difficulty = isset($data['difficulty']) ? $data['difficulty'] : 'easy';
        
        // Validate difficulty
        if (!in_array($difficulty, ['easy', 'hard'])) {
            $difficulty = 'easy';
        }
        
        // Validate
        if (empty($player_name)) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => 'Naam is verplicht'
            ]);
            exit();
        }
        
        if (strlen($player_name) > 50) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => 'Naam te lang (max 50 tekens)'
            ]);
            exit();
        }
        
        if ($score < 0 || $score > $total_questions) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => 'Ongeldige score'
            ]);
            exit();
        }
        
        // Check for duplicate nickname in same event + difficulty
        $check_query = "SELECT id FROM quiz_scores WHERE player_name = :player_name";
        $check_params = [':player_name' => $player_name];
        
        if ($event_id !== null) {
            $check_query .= " AND event_id = :event_id";
            $check_params[':event_id'] = $event_id;
        } else {
            $check_query .= " AND event_id IS NULL";
        }
        
        $check_query .= " AND difficulty = :difficulty";
        $check_params[':difficulty'] = $difficulty;
        
        $check_stmt = $db->prepare($check_query);
        foreach ($check_params as $key => $value) {
            if ($key === ':event_id') {
                $check_stmt->bindValue($key, $value, PDO::PARAM_INT);
            } else {
                $check_stmt->bindValue($key, $value, PDO::PARAM_STR);
            }
        }
        $check_stmt->execute();
        
        if ($check_stmt->rowCount() > 0) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => 'Deze naam bestaat al in dit scoreboard. Kies een andere naam.'
            ]);
            exit();
        }
        
        // Insert score
        $query = "INSERT INTO quiz_scores (player_name, score, total_questions, event_id, difficulty) 
                 VALUES (:player_name, :score, :total_questions, :event_id, :difficulty)";
        
        $stmt = $db->prepare($query);
        $stmt->bindParam(':player_name', $player_name);
        $stmt->bindParam(':score', $score, PDO::PARAM_INT);
        $stmt->bindParam(':total_questions', $total_questions, PDO::PARAM_INT);
        $stmt->bindParam(':event_id', $event_id, PDO::PARAM_INT);
        $stmt->bindParam(':difficulty', $difficulty);
        
        if ($stmt->execute()) {
            $inserted_id = $db->lastInsertId();
            
            // Calculate rank within same event + difficulty
            $rank_query = "SELECT COUNT(*) + 1 as rank 
                          FROM quiz_scores 
                          WHERE ((score > :score) 
                          OR (score = :score AND id < :id))";
            
            if ($event_id !== null) {
                $rank_query .= " AND event_id = :event_id";
            } else {
                $rank_query .= " AND event_id IS NULL";
            }
            
            $rank_query .= " AND difficulty = :difficulty";
            
            $rank_stmt = $db->prepare($rank_query);
            $rank_stmt->bindParam(':score', $score, PDO::PARAM_INT);
            $rank_stmt->bindParam(':id', $inserted_id, PDO::PARAM_INT);
            $rank_stmt->bindParam(':difficulty', $difficulty);
            
            if ($event_id !== null) {
                $rank_stmt->bindParam(':event_id', $event_id, PDO::PARAM_INT);
            }
            
            $rank_stmt->execute();
            
            $rank_result = $rank_stmt->fetch(PDO::FETCH_ASSOC);
            $rank = $rank_result['rank'];
            
            http_response_code(201);
            echo json_encode([
                'success' => true,
                'message' => 'Score succesvol opgeslagen',
                'id' => $inserted_id,
                'rank' => $rank
            ]);
        } else {
            throw new Exception('Failed to insert score');
        }
        
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => 'Database error: ' . $e->getMessage()
        ]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => $e->getMessage()
        ]);
    }
}

else {
    http_response_code(405);
    echo json_encode([
        'success' => false,
        'message' => 'Methode niet toegestaan'
    ]);
}
?>


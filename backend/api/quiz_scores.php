<?php
/**
 * Quiz Scores API
 * 
 * GET: Fetch quiz leaderboard
 * POST: Save quiz score
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

require_once __DIR__ . '/../config/database.php';

$database = new Database();
$db = $database->getConnection();

if (!$db) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Database connection failed'
    ]);
    exit();
}

// GET Request - Fetch Leaderboard
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        $limit = isset($_GET['limit']) ? intval($_GET['limit']) : 50;
        
        $query = "SELECT player_name, score, total_questions, percentage, played_at 
                 FROM quiz_scores 
                 ORDER BY score DESC, percentage DESC, played_at DESC 
                 LIMIT :limit";
        
        $stmt = $db->prepare($query);
        $stmt->bindParam(':limit', $limit, PDO::PARAM_INT);
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
        $data = json_decode(file_get_contents("php://input"), true);
        
        $player_name = isset($data['player_name']) ? trim($data['player_name']) : '';
        $score = isset($data['score']) ? intval($data['score']) : 0;
        $total_questions = isset($data['total_questions']) ? intval($data['total_questions']) : 10;
        
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
        
        // Insert score
        $query = "INSERT INTO quiz_scores (player_name, score, total_questions) 
                 VALUES (:player_name, :score, :total_questions)";
        
        $stmt = $db->prepare($query);
        $stmt->bindParam(':player_name', $player_name);
        $stmt->bindParam(':score', $score, PDO::PARAM_INT);
        $stmt->bindParam(':total_questions', $total_questions, PDO::PARAM_INT);
        
        if ($stmt->execute()) {
            $inserted_id = $db->lastInsertId();
            
            // Calculate rank
            $rank_query = "SELECT COUNT(*) + 1 as rank 
                          FROM quiz_scores 
                          WHERE (score > :score) 
                          OR (score = :score AND id < :id)";
            
            $rank_stmt = $db->prepare($rank_query);
            $rank_stmt->bindParam(':score', $score, PDO::PARAM_INT);
            $rank_stmt->bindParam(':id', $inserted_id, PDO::PARAM_INT);
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
        'message' => 'Method not allowed'
    ]);
}
?>


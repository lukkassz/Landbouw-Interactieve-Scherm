<?php
/**
 * Quiz Questions API
 * 
 * GET: Fetch quiz questions (optionally filtered by event_id)
 */

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
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

// GET Request - Fetch questions
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        $event_id = isset($_GET['event_id']) ? intval($_GET['event_id']) : null;
        
        // Build query
        $query = "SELECT id, event_id, question, image_url, correct_answer, 
                        option_1, option_2, option_3, option_4, 
                        category, difficulty, created_at 
                 FROM quiz_questions 
                 WHERE is_active = 1";
        
        // Filter by event_id if provided
        if ($event_id) {
            $query .= " AND (event_id = :event_id OR event_id IS NULL)";
        }
        
        $query .= " ORDER BY RAND()"; // Randomize question order
        
        $stmt = $db->prepare($query);
        
        if ($event_id) {
            $stmt->bindParam(':event_id', $event_id, PDO::PARAM_INT);
        }
        
        $stmt->execute();
        $questions = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Shuffle options for each question
        foreach ($questions as &$question) {
            $options = array_filter([
                $question['option_1'],
                $question['option_2'],
                $question['option_3'],
                $question['option_4']
            ]);
            
            shuffle($options);
            
            // Reassign shuffled options
            $question['option_1'] = $options[0] ?? '';
            $question['option_2'] = $options[1] ?? '';
            $question['option_3'] = $options[2] ?? '';
            $question['option_4'] = $options[3] ?? '';
        }
        
        http_response_code(200);
        echo json_encode([
            'success' => true,
            'count' => count($questions),
            'questions' => $questions
        ]);
        
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => 'Database error: ' . $e->getMessage()
        ]);
    }
} else {
    http_response_code(405);
    echo json_encode([
        'success' => false,
        'message' => 'Method not allowed'
    ]);
}
?>


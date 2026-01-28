<?php
/**
 * Puzzle Scores API
 * 
 * GET - Get top 10 scores (optionally filtered by difficulty)
 * POST - Add new score (with difficulty)
 */

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");

// Handle preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Database connection
require_once __DIR__ . '/config/database.php';

$database = new Database();
$db = $database->getConnection();

if ($db === null) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Databaseverbinding mislukt']);
    exit;
}

// GET - Fetch top 10 scores
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        $difficulty = isset($_GET['difficulty']) ? $_GET['difficulty'] : null;
        
        if ($difficulty && in_array($difficulty, ['easy', 'hard'])) {
            $stmt = $db->prepare("SELECT player_name, moves, difficulty, completed_at FROM puzzle_scores WHERE difficulty = ? ORDER BY moves ASC, completed_at ASC LIMIT 10");
            $stmt->execute([$difficulty]);
        } else {
            $stmt = $db->prepare("SELECT player_name, moves, difficulty, completed_at FROM puzzle_scores ORDER BY moves ASC, completed_at ASC LIMIT 10");
            $stmt->execute();
        }
        
        $scores = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode([
            'success' => true,
            'scores' => $scores
        ]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Kon scores niet ophalen: ' . $e->getMessage()]);
    }
    exit;
}

// POST - Add new score
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    
    $playerName = trim($input['player_name'] ?? '');
    $moves = intval($input['moves'] ?? 0);
    $difficulty = $input['difficulty'] ?? 'easy';
    
    // Validate difficulty
    if (!in_array($difficulty, ['easy', 'hard'])) {
        $difficulty = 'easy';
    }
    
    // Validation
    if (empty($playerName)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Spelersnaam is verplicht']);
        exit;
    }
    
    if (strlen($playerName) > 10) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Spelersnaam mag maximaal 10 tekens bevatten']);
        exit;
    }
    
    // Only allow alphanumeric and basic characters
    if (!preg_match('/^[a-zA-Z0-9_\- ]+$/', $playerName)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Spelersnaam mag alleen letters, cijfers, spaties, _ en - bevatten']);
        exit;
    }
    
    if ($moves < 1) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Ongeldig aantal zetten']);
        exit;
    }
    
    try {
        // Check if name already exists for this difficulty
        $checkStmt = $db->prepare("SELECT id, moves FROM puzzle_scores WHERE player_name = ? AND difficulty = ?");
        $checkStmt->execute([$playerName, $difficulty]);
        $existingScore = $checkStmt->fetch(PDO::FETCH_ASSOC);

        if ($existingScore) {
            // Player exists - check if new score is better (fewer moves is better)
            if ($moves < $existingScore['moves']) {
                // Update existing score
                $updateStmt = $db->prepare("UPDATE puzzle_scores SET moves = ?, completed_at = CURRENT_TIMESTAMP WHERE id = ?");
                $updateStmt->execute([$moves, $existingScore['id']]);
                
                $message = 'Gefeliciteerd! Je hebt je persoonlijke record verbeterd!';
            } else {
                // New score is worse or equal - do nothing but return success (or specific message)
                // We return success=true so the frontend shows the leaderboard, but with a message
                
                // Fetch leaderboard
                $stmt = $db->prepare("SELECT player_name, moves, difficulty, completed_at FROM puzzle_scores WHERE difficulty = ? ORDER BY moves ASC, completed_at ASC LIMIT 10");
                $stmt->execute([$difficulty]);
                $scores = $stmt->fetchAll(PDO::FETCH_ASSOC);

                echo json_encode([
                    'success' => true,
                    'message' => 'Je hebt al een betere score (' . $existingScore['moves'] . ' zetten).',
                    'scores' => $scores
                ]);
                exit;
            }
        } else {
            // New player
            
            // Count current scores for this difficulty
            $countStmt = $db->prepare("SELECT COUNT(*) as count FROM puzzle_scores WHERE difficulty = ?");
            $countStmt->execute([$difficulty]);
            $count = $countStmt->fetch(PDO::FETCH_ASSOC)['count'];
            
            // If 10 or more scores, check if new score is better than worst
            if ($count >= 10) {
                // Get worst score for this difficulty (highest moves)
                // If moves are equal, order by completed_at ASC (oldest remains, newest is worst candidate to drop? 
                // No, usually we drop the one with worst rank.
                // SQL: ORDER BY moves DESC, completed_at ASC (worst rank is last)
                // Wait, LIMIT 10 query is: ORDER BY moves ASC, completed_at ASC
                // So the 10th item has highest moves.
                
                $worstStmt = $db->prepare("SELECT id, moves FROM puzzle_scores WHERE difficulty = ? ORDER BY moves DESC, completed_at DESC LIMIT 1");
                $worstStmt->execute([$difficulty]);
                $worst = $worstStmt->fetch(PDO::FETCH_ASSOC);
                
                // If new moves >= worst moves, you don't make the cut
                // (Unless we want ties to beat the old one? Let's stick to strict better for now, or equal)
                // User said: "11 to ten 10 sie usuwa". 
                // Let's assume STRICTLY BETTER (less moves) guarantees entry.
                // What about EQUAL moves? Usually first come first serve. So new equal score doesn't enter.
                
                if ($moves >= $worst['moves']) {
                    echo json_encode([
                        'success' => false, 
                        'message' => 'Helaas, je staat niet in de top 10. Beste score om te verslaan: ' . ($worst['moves'] - 1) . ' zetten.'
                    ]);
                    exit;
                }
                
                // Delete worst score to make room
                $deleteStmt = $db->prepare("DELETE FROM puzzle_scores WHERE id = ?");
                $deleteStmt->execute([$worst['id']]);
            }
            
            // Insert new score
            $insertStmt = $db->prepare("INSERT INTO puzzle_scores (player_name, moves, difficulty) VALUES (?, ?, ?)");
            $insertStmt->execute([$playerName, $moves, $difficulty]);
            $message = 'Score opgeslagen!';
        }
        
        // Get updated leaderboard function logic inline
        $stmt = $db->prepare("SELECT player_name, moves, difficulty, completed_at FROM puzzle_scores WHERE difficulty = ? ORDER BY moves ASC, completed_at ASC LIMIT 10");
        $stmt->execute([$difficulty]);
        $scores = $stmt->fetchAll(PDO::FETCH_ASSOC);
        

        
        // Find player's rank
        $rank = 1;
        foreach ($scores as $index => $score) {
            if ($score['player_name'] === $playerName) {
                $rank = $index + 1;
                break;
            }
        }
        
        echo json_encode([
            'success' => true,
            'message' => 'Score opgeslagen! Je staat op #' . $rank . '!',
            'rank' => $rank,
            'scores' => $scores
        ]);
        
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Kon score niet opslaan: ' . $e->getMessage()]);
    }
    exit;
}

http_response_code(405);
echo json_encode(['success' => false, 'message' => 'Methode niet toegestaan']);

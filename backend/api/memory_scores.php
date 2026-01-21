<?php
/**
 * Memory Game Scores API
 * 
 * GET - Get top 10 scores
 * POST - Add new score (with validation)
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
        $stmt = $db->prepare("SELECT player_name, moves, time_seconds, completed_at FROM memory_scores ORDER BY moves ASC, time_seconds ASC LIMIT 10");
        $stmt->execute();
        $scores = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode([
            'success' => true,
            'scores' => $scores
        ]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Kon scores niet ophalen']);
    }
    exit;
}

// POST - Add new score
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    
    $playerName = trim($input['player_name'] ?? '');
    $moves = intval($input['moves'] ?? 0);
    $timeSeconds = intval($input['time_seconds'] ?? 0);
    
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
    if (!preg_match('/^[a-zA-Z0-9_\-]+$/', $playerName)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Spelersnaam mag alleen letters, cijfers, _ en - bevatten']);
        exit;
    }
    
    if ($moves < 1) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Ongeldig aantal zetten']);
        exit;
    }
    
    try {
        // Check if name already exists
        $checkStmt = $db->prepare("SELECT id FROM memory_scores WHERE player_name = ?");
        $checkStmt->execute([$playerName]);
        if ($checkStmt->fetch()) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Deze naam is al in gebruik. Kies een andere naam.']);
            exit;
        }
        
        // Count current scores
        $countStmt = $db->prepare("SELECT COUNT(*) as count FROM memory_scores");
        $countStmt->execute();
        $count = $countStmt->fetch(PDO::FETCH_ASSOC)['count'];
        
        // If 10 or more scores, check if new score is better than worst
        if ($count >= 10) {
            // Get worst score (highest moves, then longest time)
            $worstStmt = $db->prepare("SELECT id, moves, time_seconds FROM memory_scores ORDER BY moves DESC, time_seconds DESC LIMIT 1");
            $worstStmt->execute();
            $worst = $worstStmt->fetch(PDO::FETCH_ASSOC);
            
            // Check if new score is better (fewer moves, or same moves but faster time)
            $isBetter = $moves < $worst['moves'] || ($moves === $worst['moves'] && $timeSeconds < $worst['time_seconds']);
            
            if (!$isBetter) {
                echo json_encode([
                    'success' => false, 
                    'message' => 'Je score staat niet in de top 10. Beste score om te verslaan: ' . $worst['moves'] . ' zetten.'
                ]);
                exit;
            }
            
            // Delete worst score to make room
            $deleteStmt = $db->prepare("DELETE FROM memory_scores WHERE id = ?");
            $deleteStmt->execute([$worst['id']]);
        }
        
        // Insert new score
        $insertStmt = $db->prepare("INSERT INTO memory_scores (player_name, moves, time_seconds) VALUES (?, ?, ?)");
        $insertStmt->execute([$playerName, $moves, $timeSeconds]);
        
        // Get updated leaderboard
        $stmt = $db->prepare("SELECT player_name, moves, time_seconds, completed_at FROM memory_scores ORDER BY moves ASC, time_seconds ASC LIMIT 10");
        $stmt->execute();
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
            'message' => 'Score opgeslagen! Je staat op plaats #' . $rank . ' op het scorebord!',
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


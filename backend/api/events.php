<?php

/**
 * Direct endpoint for GET /api/events
 * This file can be accessed directly: /backend/api/events.php
 * Works even if .htaccess routing doesn't work
 */

// Set headers for JSON response and CORS
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET");
header("Access-Control-Max-Age: 3600");

// Include database configuration
include_once __DIR__ . '/config/database.php';

// Create database connection
$database = new Database();
$db = $database->getConnection();

// Check if connection was successful
if ($db === null) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Databaseverbinding mislukt"
    ]);
    exit();
}

try {
    // Check if has_video column exists
    $checkColumn = $db->query("SHOW COLUMNS FROM timeline_events LIKE 'has_video'");
    $hasVideoColumn = $checkColumn->rowCount() > 0;
    
    // Prepare SQL query to get all events ordered by year
    $query = "SELECT
                id,
                year,
                title,
                description,
                icon,
                gradient,
                museum_gradient,
                stage,
                use_detailed_modal,
                historical_context,
                has_key_moments,
                has_puzzle,
                puzzle_image_url,
                game_type,
                category,
                sort_order,
                created_at,
                updated_at,
                is_active";
    
    // Add has_video only if column exists
    if ($hasVideoColumn) {
        $query .= ",
                COALESCE(has_video, 0) as has_video";
    }
    
    $query .= "
              FROM timeline_events
              WHERE is_active = 1
              ORDER BY sort_order ASC, CAST(SUBSTRING_INDEX(year, '-', 1) AS UNSIGNED) ASC";

    // Execute query
    $stmt = $db->prepare($query);
    $stmt->execute();

    // Fetch all results
    $events = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Add has_video = 0 if column doesn't exist
    if (!$hasVideoColumn) {
        foreach ($events as &$event) {
            $event['has_video'] = 0;
        }
    }

    // Process each event
    foreach ($events as &$event) {
        // Convert to appropriate types
        $event['id'] = (int)$event['id'];
        $event['stage'] = (int)$event['stage'];
        $event['sort_order'] = (int)$event['sort_order'];
        $event['is_active'] = (bool)$event['is_active'];
        $event['use_detailed_modal'] = (bool)$event['use_detailed_modal'];
        // Convert has_key_moments to boolean - handle both string and numeric values
        $hasKeyMoments = $event['has_key_moments'] ?? false;
        $event['has_key_moments'] = ($hasKeyMoments === true || $hasKeyMoments === 1 || $hasKeyMoments === '1');
        
        // Convert has_puzzle to boolean - handle both string and numeric values
        $hasPuzzle = $event['has_puzzle'] ?? false;
        $event['has_puzzle'] = ($hasPuzzle === true || $hasPuzzle === 1 || $hasPuzzle === '1' || $hasPuzzle === 'true');
        
        // Keep puzzle_image_url as string (or null if empty)
        // Construct full URL using serve.php proxy for CORS support
        $puzzleImageUrl = $event['puzzle_image_url'] ?? '';
        if (empty($puzzleImageUrl) || $puzzleImageUrl === null) {
            $event['puzzle_image_url'] = null;
            $hasPuzzleImage = false;
        } else {
            // Build full URL with serve.php proxy
            $protocol = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? 'https' : 'http';
            $host = $_SERVER['HTTP_HOST'] ?? 'www.mbo-portal.nl';
            $requestUri = $_SERVER['REQUEST_URI'] ?? '';
            
            // Detect base path
            if (preg_match('#^(/.*?)/backend/api#', $requestUri, $matches)) {
                $basePath = $matches[1];
            } else {
                $basePath = '/museumproject/landbouwmuseum/timeline';
            }
            
            // Only filename stored in DB, construct full proxy URL
            $filename = basename($puzzleImageUrl);
            $event['puzzle_image_url'] = $protocol . '://' . $host . $basePath . '/adminpanel/uploads/serve.php?file=' . urlencode($filename);
            $hasPuzzleImage = true;
        }
        
        // Calculate game_type - use database value if exists, otherwise fallback to legacy logic
        if (isset($event['game_type']) && !empty($event['game_type']) && $event['game_type'] !== 'none') {
            // Use database value (can be 'puzzle', 'memory', 'harvest', etc.)
            $event['game_type'] = (string)$event['game_type'];
        } else {
            // Legacy fallback logic - only if game_type is not set or is 'none'
        if ($event['has_puzzle'] && $hasPuzzleImage) {
            $event['game_type'] = 'puzzle';
        } elseif ($event['has_puzzle']) {
            $event['game_type'] = 'memory';
        } else {
            $event['game_type'] = 'none';
            }
        }

        // Year might be a string like "1925" or range like "1930-1956"
        // Keep as string for flexibility
    }

    // Return success response
    http_response_code(200);
    echo json_encode([
        "success" => true,
        "count" => count($events),
        "data" => $events
    ]);
} catch (PDOException $e) {
    // Return error response with detailed error info
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Error fetching events",
        "error" => $e->getMessage(),
        "file" => $e->getFile(),
        "line" => $e->getLine()
    ], JSON_PRETTY_PRINT);
} catch (Exception $e) {
    // Catch any other errors
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Unexpected error",
        "error" => $e->getMessage(),
        "file" => $e->getFile(),
        "line" => $e->getLine()
    ], JSON_PRETTY_PRINT);
}

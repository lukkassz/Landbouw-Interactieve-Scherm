<?php

/**
 * Event Media API Endpoint
 * 
 * Handles GET requests for event media (images)
 * GET /api/event/{id}/media - Get all media for an event
 */

// Set headers
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

// Include database configuration
include_once __DIR__ . '/../config/database.php';

// Create database connection
$database = new Database();
$db = $database->getConnection();

// Check if connection was successful
if ($db === null) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Database connection failed"
    ]);
    exit();
}

// Get event ID from GET parameter (set by router)
$eventId = isset($_GET['event_id']) ? intval($_GET['event_id']) : null;

if (!$eventId) {
    // Try to extract from REQUEST_URI as fallback
    $requestUri = $_SERVER['REQUEST_URI'] ?? '';
    if (preg_match('#event[^/]*/(\d+)/media#i', $requestUri, $matches)) {
        $eventId = intval($matches[1]);
    } else {
        // Last resort: try PATH_INFO
        $pathInfo = $_SERVER['PATH_INFO'] ?? '';
        if (preg_match('#event[^/]*/(\d+)/media#i', $pathInfo, $pathMatches)) {
            $eventId = intval($pathMatches[1]);
        } else {
            http_response_code(400);
            echo json_encode([
                "success" => false,
                "message" => "Event ID is required",
                "debug" => [
                    "request_uri" => $requestUri,
                    "path_info" => $pathInfo,
                    "get_params" => $_GET
                ]
            ]);
            exit;
        }
    }
}

try {
    // Get all media for this event
    $query = "SELECT id, event_id, media_type, file_url, caption, display_order 
              FROM event_media 
              WHERE event_id = :event_id 
              ORDER BY display_order ASC";

    $stmt = $db->prepare($query);
    $stmt->bindParam(':event_id', $eventId, PDO::PARAM_INT);
    $stmt->execute();

    $media = [];
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $protocol = (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on') ? 'https' : 'http';
        $host = $_SERVER['HTTP_HOST'];
        // Path relative to server root - adjust based on your server structure
        // For: museumproject/landbouwmuseum/timeline/adminpanel/uploads/event_media/
        $uploadPath = '/museumproject/landbouwmuseum/timeline/adminpanel/uploads/event_media/';
        $fullUrl = $protocol . '://' . $host . $uploadPath . $row['file_url'];

        $media[] = [
            'id' => intval($row['id']),
            'event_id' => intval($row['event_id']),
            'media_type' => $row['media_type'],
            'file_url' => $fullUrl,
            'caption' => $row['caption'] ? $row['caption'] : '',
            'display_order' => intval($row['display_order'])
        ];
    }

    http_response_code(200);
    echo json_encode([
        "success" => true,
        "data" => $media,
        "count" => count($media)
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Database error: " . $e->getMessage()
    ]);
}

<?php

/**
 * Direct endpoint for GET /api/key-moments (using mysqli like admin panel)
 * This file can be accessed directly: /backend/api/key_moments_direct_mysqli.php?event_id=18
 * Uses mysqli instead of PDO for compatibility
 */

// Set headers for JSON response and CORS
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET");
header("Access-Control-Max-Age: 3600");

// Use mysqli connection (same as admin panel)
// Try different paths depending on server structure
$dbPath1 = __DIR__ . '/../../includes/db.php';  // adminpanel/backend/api -> adminpanel/includes/db.php
$dbPath2 = __DIR__ . '/../../../adminpanel/includes/db.php';  // timeline/backend/api -> timeline/adminpanel/includes/db.php
$dbPath3 = dirname(dirname(dirname(__DIR__))) . '/adminpanel/includes/db.php';  // Alternative path

if (file_exists($dbPath1)) {
    include_once $dbPath1;
} elseif (file_exists($dbPath2)) {
    include_once $dbPath2;
} elseif (file_exists($dbPath3)) {
    include_once $dbPath3;
} else {
    // Fallback: try to find db.php
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Database config file not found",
        "tried_paths" => [$dbPath1, $dbPath2, $dbPath3]
    ]);
    exit();
}

// Check if connection was successful
if (!$conn) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Database connection failed"
    ]);
    exit();
}

// Get event ID from GET parameter
$eventId = isset($_GET['event_id']) ? intval($_GET['event_id']) : null;

if (!$eventId) {
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "message" => "Event ID is required",
        "usage" => "Add ?event_id=1 to the URL"
    ]);
    exit;
}

// Get all key moments for this event
$query = "SELECT 
            id,
            event_id,
            year,
            title,
            short_description,
            full_description,
            display_order
          FROM event_key_moments 
          WHERE event_id = " . intval($eventId) . "
          ORDER BY display_order ASC, year ASC";

$result = mysqli_query($conn, $query);

if (!$result) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Database error: " . mysqli_error($conn)
    ]);
    exit();
}

$keyMoments = [];
while ($row = mysqli_fetch_assoc($result)) {
    $keyMoments[] = [
        'id' => intval($row['id']),
        'event_id' => intval($row['event_id']),
        'year' => intval($row['year']),
        'title' => $row['title'],
        'shortDescription' => $row['short_description'] ? $row['short_description'] : '',
        'fullDescription' => $row['full_description'] ? $row['full_description'] : '',
        'display_order' => intval($row['display_order'])
    ];
}

http_response_code(200);
echo json_encode([
    "success" => true,
    "data" => $keyMoments,
    "count" => count($keyMoments)
]);

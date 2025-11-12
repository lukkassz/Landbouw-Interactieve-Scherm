<?php
/**
 * Check if key moments exist in database
 * Usage: /backend/api/check_key_moments.php?event_id=18
 */

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

// Include database configuration
include_once __DIR__ . '/config/database.php';

// Create database connection
$database = new Database();
$db = $database->getConnection();

if ($db === null) {
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
        "usage" => "Add ?event_id=18 to the URL"
    ]);
    exit();
}

try {
    // Check if event exists
    $eventQuery = "SELECT id, title, has_key_moments FROM timeline_events WHERE id = :event_id";
    $eventStmt = $db->prepare($eventQuery);
    $eventStmt->bindParam(':event_id', $eventId, PDO::PARAM_INT);
    $eventStmt->execute();
    $event = $eventStmt->fetch(PDO::FETCH_ASSOC);

    if (!$event) {
        echo json_encode([
            "success" => false,
            "message" => "Event not found",
            "event_id" => $eventId
        ]);
        exit();
    }

    // Check if key moments exist
    $keyMomentsQuery = "SELECT COUNT(*) as count FROM event_key_moments WHERE event_id = :event_id";
    $keyMomentsStmt = $db->prepare($keyMomentsQuery);
    $keyMomentsStmt->bindParam(':event_id', $eventId, PDO::PARAM_INT);
    $keyMomentsStmt->execute();
    $keyMomentsCount = $keyMomentsStmt->fetch(PDO::FETCH_ASSOC)['count'];

    // Get all key moments
    $allKeyMomentsQuery = "SELECT * FROM event_key_moments WHERE event_id = :event_id ORDER BY display_order ASC";
    $allKeyMomentsStmt = $db->prepare($allKeyMomentsQuery);
    $allKeyMomentsStmt->bindParam(':event_id', $eventId, PDO::PARAM_INT);
    $allKeyMomentsStmt->execute();
    $allKeyMoments = $allKeyMomentsStmt->fetchAll(PDO::FETCH_ASSOC);

    // Check if table exists
    $tableCheckQuery = "SHOW TABLES LIKE 'event_key_moments'";
    $tableCheckStmt = $db->prepare($tableCheckQuery);
    $tableCheckStmt->execute();
    $tableExists = $tableCheckStmt->rowCount() > 0;

    echo json_encode([
        "success" => true,
        "event" => [
            "id" => (int)$event['id'],
            "title" => $event['title'],
            "has_key_moments" => (bool)$event['has_key_moments']
        ],
        "database" => [
            "table_exists" => $tableExists,
            "key_moments_count" => (int)$keyMomentsCount,
            "key_moments" => $allKeyMoments
        ],
        "diagnosis" => [
            "has_key_moments_flag" => (bool)$event['has_key_moments'],
            "has_key_moments_in_db" => $keyMomentsCount > 0,
            "status" => $keyMomentsCount > 0 ? "OK - Key moments found" : "PROBLEM - No key moments in database"
        ]
    ], JSON_PRETTY_PRINT);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Database error: " . $e->getMessage(),
        "error_code" => $e->getCode()
    ]);
}


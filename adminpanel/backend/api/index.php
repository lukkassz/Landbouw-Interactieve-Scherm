<?php

/**
 * API Router
 *
 * Simple router to handle API requests.
 * Routes requests to the appropriate endpoint.
 */

// Set headers
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Get the request URI
$request_uri = $_SERVER['REQUEST_URI'];
$path = parse_url($request_uri, PHP_URL_PATH);

// Debug: log the original path
error_log("API Router - REQUEST_URI: " . $request_uri);
error_log("API Router - Parsed path: " . $path);

// Remove common prefixes - handle various server structures
$path = preg_replace('#^/.*?/backend/api/#', '', $path);
$path = preg_replace('#^/.*?/adminpanel/backend/api/#', '', $path);
$path = preg_replace('#^/backend/api/#', '', $path);
$path = preg_replace('#^/api/#', '', $path);
$path = trim($path, '/');

error_log("API Router - Cleaned path: " . $path);

// Check for event media endpoint - try multiple patterns
$eventId = null;
if (preg_match('#^event/(\d+)/media$#', $path, $matches)) {
    $eventId = $matches[1];
} elseif (preg_match('#event[^/]*/(\d+)/media#i', $request_uri, $uriMatches)) {
    $eventId = $uriMatches[1];
} elseif (isset($_GET['event_id'])) {
    $eventId = intval($_GET['event_id']);
}

if ($eventId) {
    $_GET['event_id'] = $eventId;
    include_once __DIR__ . '/endpoints/event_media.php';
    exit;
}

// Route requests
switch ($path) {
    case 'events':
    case 'timeline/events':
        // GET all events
        include_once 'endpoints/get_events.php';
        break;

    case 'event':
    case 'admin/event':
        // CRUD operations on single event
        include_once 'endpoints/event_crud.php';
        break;

    case '':
    case 'index.php':
        // API info
        http_response_code(200);
        echo json_encode([
            "success" => true,
            "message" => "Timeline Events API",
            "version" => "1.0.0",
            "endpoints" => [
                "GET /api/events" => "Get all timeline events",
                "GET /api/event?id={id}" => "Get single event by ID",
                "POST /api/event" => "Create new event (admin)",
                "PUT /api/event" => "Update event (admin)",
                "DELETE /api/event?id={id}" => "Delete event (admin)"
            ]
        ]);
        break;

    default:
        // 404 Not Found
        http_response_code(404);
        echo json_encode([
            "success" => false,
            "message" => "Endpoint not found",
            "path" => $path
        ]);
        break;
}

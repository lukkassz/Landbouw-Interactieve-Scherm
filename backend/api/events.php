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
        "message" => "Database connection failed"
    ]);
    exit();
}

try {
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
                category,
                sort_order,
                created_at,
                updated_at,
                is_active
              FROM timeline_events
              WHERE is_active = 1
              ORDER BY sort_order ASC, year ASC";

    // Execute query
    $stmt = $db->prepare($query);
    $stmt->execute();

    // Fetch all results
    $events = $stmt->fetchAll(PDO::FETCH_ASSOC);

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

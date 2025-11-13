<?php
/**
 * Simple test endpoint to check if key moments endpoint works
 * Usage: /backend/api/test_key_moments.php?event_id=18
 */

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

// Simple test - just return success
echo json_encode([
    "success" => true,
    "message" => "Test endpoint works",
    "event_id" => isset($_GET['event_id']) ? intval($_GET['event_id']) : null
]);


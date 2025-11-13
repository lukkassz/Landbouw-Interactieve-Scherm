<?php
/**
 * Test Router - Debug endpoint
 * 
 * This file helps debug routing issues
 * Access: /backend/api/test_router.php
 */

header("Content-Type: application/json; charset=UTF-8");

echo json_encode([
    "success" => true,
    "message" => "Router test endpoint is working",
    "debug" => [
        "REQUEST_URI" => $_SERVER['REQUEST_URI'] ?? 'not set',
        "SCRIPT_NAME" => $_SERVER['SCRIPT_NAME'] ?? 'not set',
        "PATH_INFO" => $_SERVER['PATH_INFO'] ?? 'not set',
        "QUERY_STRING" => $_SERVER['QUERY_STRING'] ?? 'not set',
        "REQUEST_METHOD" => $_SERVER['REQUEST_METHOD'] ?? 'not set',
        "GET" => $_GET,
        "SERVER_NAME" => $_SERVER['SERVER_NAME'] ?? 'not set',
        "HTTP_HOST" => $_SERVER['HTTP_HOST'] ?? 'not set',
    ]
], JSON_PRETTY_PRINT);



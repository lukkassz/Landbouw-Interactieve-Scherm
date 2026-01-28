<?php
/**
 * Direct Puzzle Image URL Endpoint
 * 
 * Returns the full URL to a puzzle image file
 * Usage: /backend/api/puzzle_image_direct.php?filename=1763627546_xdddd.jpg
 * 
 * Uses the same path detection logic as event_media_direct.php
 */

// Set headers
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

// Get filename from GET parameter
$filenameParam = isset($_GET['filename']) ? $_GET['filename'] : null;

if (!$filenameParam) {
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "message" => "Bestandsnaam is verplicht",
        "usage" => "Add ?filename=1763627546_xdddd.jpg to the URL"
    ]);
    exit;
}

// If the filename is already a full URL (from events.php with serve.php proxy), return it directly
if (preg_match('#^https?://#i', $filenameParam)) {
    http_response_code(200);
    echo json_encode([
        "success" => true,
        "url" => $filenameParam,
        "filename" => basename(parse_url($filenameParam, PHP_URL_PATH)),
        "exists" => true,
        "base_path" => "direct_url"
    ]);
    exit;
}

// Otherwise, it's just a filename - construct the full URL
$filename = basename($filenameParam);

// Build URL dynamically based on current request (same logic as event_media_direct.php)
$protocol = (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on') ? 'https' : 'http';
$host = $_SERVER['HTTP_HOST'];

// Get the base path from the current request
$scriptName = $_SERVER['SCRIPT_NAME'] ?? '';
$basePath = '';

// Extract base path from script name (same logic as event_media_direct.php)
// Script is at: /path/backend/api/puzzle_image_direct.php -> we need /path/adminpanel
$requestUri = $_SERVER['REQUEST_URI'] ?? '';
if (preg_match('#^(/.*?)/backend/api#', $scriptName, $pathMatches)) {
    $basePath = $pathMatches[1] . '/adminpanel';
} elseif (preg_match('#^(/.*?)/adminpanel/backend/api#', $scriptName, $pathMatches)) {
    $basePath = $pathMatches[1] . '/adminpanel';
} elseif (preg_match('#^(/.*?)/backend/api#', $requestUri, $pathMatches)) {
    $basePath = $pathMatches[1] . '/adminpanel';
} elseif (preg_match('#^/backend/api#', $scriptName) || preg_match('#^/backend/api#', $requestUri)) {
    // Project at document root: /backend/api/ and /adminpanel/ are siblings
    $basePath = '/adminpanel';
} else {
    // Fallback for production (e.g. school server)
    $basePath = '/museumproject/landbouwmuseum/timeline/adminpanel';
}

// Construct full URL to the puzzle image via serve.php proxy (CORS support)
$proxyPath = $basePath . '/uploads/serve.php?file=';
$fullUrl = $protocol . '://' . $host . $proxyPath . urlencode($filename);

// Check if file exists (optional - can be removed if file check is not needed)
$uploadPath = $basePath . '/uploads/';
$filePath = $_SERVER['DOCUMENT_ROOT'] . $uploadPath . $filename;
$fileExists = file_exists($filePath);

http_response_code(200);
echo json_encode([
    "success" => true,
    "url" => $fullUrl,
    "filename" => $filename,
    "exists" => $fileExists,
    "base_path" => $basePath
]);






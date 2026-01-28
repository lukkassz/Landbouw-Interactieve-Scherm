<?php
/**
 * Image Proxy - Serves images with CORS headers
 * Usage: /adminpanel/uploads/serve.php?file=image.png
 */

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$filename = isset($_GET['file']) ? basename($_GET['file']) : null;

if (!$filename) {
    http_response_code(400);
    die("Missing file parameter");
}

$filePath = __DIR__ . '/' . $filename;

if (!file_exists($filePath)) {
    $filePath = __DIR__ . '/event_media/' . $filename;
}

if (!file_exists($filePath)) {
    http_response_code(404);
    die("File not found");
}

$ext = strtolower(pathinfo($filename, PATHINFO_EXTENSION));
$mimeTypes = [
    'jpg' => 'image/jpeg',
    'jpeg' => 'image/jpeg',
    'png' => 'image/png',
    'gif' => 'image/gif',
    'webp' => 'image/webp'
];

header("Content-Type: " . ($mimeTypes[$ext] ?? 'application/octet-stream'));
header("Content-Length: " . filesize($filePath));
header("Cache-Control: public, max-age=86400");

readfile($filePath);

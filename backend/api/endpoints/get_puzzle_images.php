<?php
/**
 * Get Puzzle Images Endpoint
 * 
 * Fetches all available puzzle images from the database events.
 * Used for the global image selection screen in the puzzle game.
 */

include_once __DIR__ . '/../config/database.php';

// Only accept GET
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(["success" => false, "message" => "Method not allowed"]);
    exit;
}

// Get database connection
$database = new Database();
$conn = $database->getConnection();

if (!$conn) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Database connection failed"]);
    exit;
}

// Optional: exclude a specific event ID (the current event)
$excludeId = isset($_GET['exclude_id']) ? intval($_GET['exclude_id']) : null;

// Build query
$query = "SELECT id, title, year, puzzle_image_url 
          FROM timeline_events 
          WHERE game_type = 'puzzle' 
          AND puzzle_image_url IS NOT NULL 
          AND puzzle_image_url != ''
          AND is_active = 1";

if ($excludeId) {
    $query .= " AND id != " . $excludeId;
}

$query .= " ORDER BY year DESC";

try {
    $stmt = $conn->query($query);
    if ($stmt === false) {
        throw new Exception("Query failed to execute");
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Database error: " . $e->getMessage()]);
    exit;
}

$result = $stmt;

$puzzleImages = [];

// Get the base URL for uploads - using serve.php proxy for CORS support
$baseUrl = '';
if (isset($_SERVER['HTTP_HOST'])) {
    $protocol = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? 'https' : 'http';
    $baseUrl = $protocol . '://' . $_SERVER['HTTP_HOST'];
    
    // Use REQUEST_URI for path detection
    $requestUri = $_SERVER['REQUEST_URI'] ?? '';
    $scriptPath = $_SERVER['SCRIPT_NAME'] ?? '';
    
    // Find base path and construct URL to serve.php proxy
    if (preg_match('#^(/.*?)/backend/api#', $requestUri, $matches)) {
        $baseUrl .= $matches[1] . '/adminpanel/uploads/serve.php?file=';
    } elseif (preg_match('#^(/.*?)/backend/api#', $scriptPath, $matches)) {
        $baseUrl .= $matches[1] . '/adminpanel/uploads/serve.php?file=';
    } elseif (strpos($scriptPath, '/backend/') !== false || strpos($requestUri, '/backend/') !== false) {
        $basePath = preg_replace('#/backend/.*$#', '', $requestUri ?: $scriptPath);
        $baseUrl .= $basePath . '/adminpanel/uploads/serve.php?file=';
    } else {
        // Fallback for production
        $baseUrl .= '/museumproject/landbouwmuseum/timeline/adminpanel/uploads/serve.php?file=';
    }
}

while ($row = $result->fetch(PDO::FETCH_ASSOC)) {
    // Check if file physically exists before including it
    $filename = $row['puzzle_image_url'];
    if (empty($filename)) continue;

    // Define path to uploads directory relative to this script
    // Script is in /backend/api/endpoints/
    // Uploads are in /adminpanel/uploads/
    $uploadDir = __DIR__ . '/../../../adminpanel/uploads/';
    $filePath = $uploadDir . $filename;

    // Also check event_media subdirectory if not found in root
    if (!file_exists($filePath)) {
        $filePath = $uploadDir . 'event_media/' . $filename;
        if (!file_exists($filePath)) {
            // Skip this image if it doesn't exist on server
            continue; 
        }
    }

    $puzzleImages[] = [
        'id' => intval($row['id']),
        'title' => $row['title'],
        'year' => $row['year'],
        'imageUrl' => $baseUrl . urlencode($filename)
    ];
}

http_response_code(200);
echo json_encode([
    "success" => true,
    "puzzleImages" => $puzzleImages,
    "count" => count($puzzleImages)
]);

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

// Get the base URL for uploads
$baseUrl = '';
if (isset($_SERVER['HTTP_HOST'])) {
    $protocol = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? 'https' : 'http';
    // Determine upload path based on current script location
    $baseUrl = $protocol . '://' . $_SERVER['HTTP_HOST'];
    
    // Try to find the adminpanel/uploads path
    $scriptPath = $_SERVER['SCRIPT_NAME'];
    if (strpos($scriptPath, '/backend/') !== false) {
        $basePath = preg_replace('#/backend/.*$#', '', $scriptPath);
        $baseUrl .= $basePath . '/adminpanel/uploads/';
    } else {
        $baseUrl .= '/adminpanel/uploads/';
    }
}

while ($row = $result->fetch(PDO::FETCH_ASSOC)) {
    $imageUrl = $row['puzzle_image_url'];
    
    // If the URL doesn't start with http, prepend the base URL
    if (!empty($imageUrl) && strpos($imageUrl, 'http') !== 0) {
        $imageUrl = $baseUrl . $imageUrl;
    }
    
    $puzzleImages[] = [
        'id' => intval($row['id']),
        'title' => $row['title'],
        'year' => $row['year'],
        'imageUrl' => $imageUrl
    ];
}

http_response_code(200);
echo json_encode([
    "success" => true,
    "puzzleImages" => $puzzleImages,
    "count" => count($puzzleImages)
]);

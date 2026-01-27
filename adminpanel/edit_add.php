<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);
// upload_max_filesize and post_max_size do NOT work via ini_set (they are applied before the script). See .htaccess / .user.ini.
ini_set('max_execution_time', '300');
ini_set('memory_limit', '256M');

include 'includes/db.php';
include 'includes/auth.php';
include 'includes/functions.php';

// Check if editing
$isEdit = isset($_GET['id']);
$eventId = $isEdit ? intval($_GET['id']) : 0;

// Default values
$event = [
    'year' => '',
    'title' => '',
    'description' => '',
    'historical_context' => '',
    'category' => 'museum',
    'is_active' => 1,
    'has_puzzle' => 0,
    'puzzle_image_url' => '',
    'has_key_moments' => 0
];

$eventMedia = [];
$eventSections = [];
$eventKeyMoments = [];

// Load existing data if editing
if ($isEdit) {
    $result = mysqli_query($conn, "SELECT * FROM timeline_events WHERE id = $eventId");
    if ($result && mysqli_num_rows($result) > 0) {
        $event = mysqli_fetch_assoc($result);
    }

    // Load media
    $mediaResult = mysqli_query($conn, "SELECT * FROM event_media WHERE event_id = $eventId ORDER BY display_order ASC");
    while ($mediaResult && $row = mysqli_fetch_assoc($mediaResult)) {
        $eventMedia[] = $row;
    }

    // Load sections
    $sectionsResult = mysqli_query($conn, "SELECT * FROM event_sections WHERE event_id = $eventId ORDER BY section_order ASC");
    while ($sectionsResult && $row = mysqli_fetch_assoc($sectionsResult)) {
        $eventSections[] = $row;
    }

    // Load key moments
    $momentsResult = mysqli_query($conn, "SELECT * FROM event_key_moments WHERE event_id = $eventId ORDER BY display_order ASC");
    while ($momentsResult && $row = mysqli_fetch_assoc($momentsResult)) {
        $eventKeyMoments[] = $row;
    }
}

// Determine game type - check database first, then fallback to legacy logic
$gameType = $event['game_type'] ?? 'none';
if ($gameType === 'none' || empty($gameType)) {
    // Legacy fallback logic
    if ($event['has_puzzle'] && !empty($event['puzzle_image_url'])) {
        $gameType = 'puzzle';
    } elseif ($event['has_puzzle']) {
        $gameType = 'memory';
    }
}

$error = '';
$success = '';

// Process form submission
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $year = mysqli_real_escape_string($conn, trim($_POST['year'] ?? ''));
    $title = mysqli_real_escape_string($conn, trim($_POST['title'] ?? ''));
    $description = mysqli_real_escape_string($conn, trim($_POST['description'] ?? ''));
    $historical_context = mysqli_real_escape_string($conn, trim($_POST['historical_context'] ?? ''));
    $category = mysqli_real_escape_string($conn, $_POST['category'] ?? 'museum');
    $is_active = isset($_POST['is_active']) ? 1 : 0;
    $has_key_moments = isset($_POST['has_key_moments']) ? 1 : 0;

    // Game settings
    $gameType = $_POST['game_type'] ?? 'none';
    $has_puzzle = ($gameType === 'puzzle' || $gameType === 'memory') ? 1 : 0;

    // Start with existing puzzle_image_url (preserve it if no new upload)
    $puzzle_image_url = $event['puzzle_image_url'] ?? '';

    // For harvest game, we don't need has_puzzle or puzzle_image_url
    if ($gameType === 'harvest') {
        $has_puzzle = 0;
        $puzzle_image_url = '';
    }

    // Handle puzzle image upload - only if user actually selected a new file
    if ($gameType === 'puzzle' && isset($_FILES['puzzle_image']) && $_FILES['puzzle_image']['error'] === UPLOAD_ERR_OK) {
        $uploadDir = __DIR__ . '/uploads/';
        if (!file_exists($uploadDir)) {
            if (!mkdir($uploadDir, 0755, true)) {
                $error = "Kon upload map niet aanmaken: $uploadDir";
            }
        }

        $fileName = time() . '_' . preg_replace('/[^a-zA-Z0-9._-]/', '', $_FILES['puzzle_image']['name']);
        $targetPath = $uploadDir . $fileName;

        if (move_uploaded_file($_FILES['puzzle_image']['tmp_name'], $targetPath)) {
            $puzzle_image_url = $fileName;
        } else {
            $error = "Fout bij uploaden puzzel afbeelding naar: $targetPath";
        }
    } elseif ($gameType === 'puzzle' && isset($_FILES['puzzle_image']) && $_FILES['puzzle_image']['error'] !== UPLOAD_ERR_NO_FILE) {
        $c = (int)$_FILES['puzzle_image']['error'];
        $maxUp = ini_get('upload_max_filesize') ?: '?';
        $uploadErrors = [
            1 => "Bestand te groot. De server staat maximaal $maxUp toe. Gebruik een kleinere afbeelding (bijv. 800×800 px, onder 2 MB) of neem contact op met de ict-beheerder om de limiet te verhogen.",
            2 => "Bestand te groot voor dit formulier. Gebruik een kleinere afbeelding (bijv. 800×800 px) of neem contact op met de ict-beheerder.",
            3 => "Bestand alleen gedeeltelijk geüpload. Probeer opnieuw of neem contact op met de ict-beheerder.",
            4 => "Geen bestand geselecteerd.",
            6 => "Probleem op de server: tijdelijke map ontbreekt. Neem contact op met de ict-beheerder.",
            7 => "Bestand kon niet op de server worden opgeslagen. Neem contact op met de ict-beheerder (rechten map uploads).",
            8 => "Upload geblokkeerd door serverinstelling. Neem contact op met de ict-beheerder.",
        ];
        $error = 'Puzzelafbeelding: ' . ($uploadErrors[$c] ?? "Onbekende fout. Neem contact op met de ict-beheerder. (Code: $c)");
    }

    // Only clear puzzle_image_url if switching away from puzzle type
    if ($gameType !== 'puzzle') {
        $puzzle_image_url = '';
    }

    // Validation
    if (!empty($error)) {
        // Error already set (e.g. from upload), do not proceed
    } elseif (empty($year) || empty($title) || empty($description)) {
        $error = "Vul alle verplichte velden in.";
    } elseif (!preg_match('/^\d{4}(-\d{4})?$/', $year)) {
        $error = "Ongeldig jaar formaat. Gebruik: 1950 of 1900-1910";
    } else {
        // Save event
        if ($isEdit) {
            $gameTypeEscaped = mysqli_real_escape_string($conn, $gameType);
            $query = "UPDATE timeline_events SET 
                year = '$year',
                title = '$title',
                description = '$description',
                historical_context = '$historical_context',
                category = '$category',
                is_active = $is_active,
                has_puzzle = $has_puzzle,
                puzzle_image_url = '$puzzle_image_url',
                game_type = '$gameTypeEscaped',
                has_key_moments = $has_key_moments,
                use_detailed_modal = 1
                WHERE id = $eventId";
        } else {
            $gameTypeEscaped = mysqli_real_escape_string($conn, $gameType);
            $query = "INSERT INTO timeline_events (year, title, description, historical_context, category, is_active, has_puzzle, puzzle_image_url, game_type, has_key_moments, use_detailed_modal)
                VALUES ('$year', '$title', '$description', '$historical_context', '$category', $is_active, $has_puzzle, '$puzzle_image_url', '$gameTypeEscaped', $has_key_moments, 1)";
        }

        if (mysqli_query($conn, $query)) {
            $currentEventId = $isEdit ? $eventId : mysqli_insert_id($conn);

            // Save sections
            mysqli_query($conn, "DELETE FROM event_sections WHERE event_id = $currentEventId");
            if (isset($_POST['sections']) && is_array($_POST['sections'])) {
                foreach ($_POST['sections'] as $index => $section) {
                    if (!empty($section['title']) && !empty($section['content'])) {
                        $sTitle = mysqli_real_escape_string($conn, $section['title']);
                        $sContent = mysqli_real_escape_string($conn, $section['content']);
                        mysqli_query($conn, "INSERT INTO event_sections (event_id, section_title, section_content, section_order) VALUES ($currentEventId, '$sTitle', '$sContent', $index)");
                    }
                }
            }

            // Save key moments
            if ($has_key_moments) {
                mysqli_query($conn, "DELETE FROM event_key_moments WHERE event_id = $currentEventId");
                if (isset($_POST['key_moments']) && is_array($_POST['key_moments'])) {
                    foreach ($_POST['key_moments'] as $index => $moment) {
                        if (!empty($moment['year']) && !empty($moment['title'])) {
                            $mYear = intval($moment['year']);
                            $mTitle = mysqli_real_escape_string($conn, $moment['title']);
                            $mDesc = mysqli_real_escape_string($conn, $moment['description'] ?? '');
                            mysqli_query($conn, "INSERT INTO event_key_moments (event_id, year, title, short_description, display_order) VALUES ($currentEventId, $mYear, '$mTitle', '$mDesc', $index)");
                        }
                    }
                }
            }

            // Save quiz questions
            if ($gameType === 'quiz') {
                mysqli_query($conn, "DELETE FROM quiz_questions WHERE event_id = $currentEventId");
                $quizUploadDir = rtrim(str_replace('\\', '/', __DIR__), '/') . '/uploads/quiz/';
                if (!is_dir($quizUploadDir)) {
                    if (!@mkdir($quizUploadDir, 0755, true)) {
                        $error = "Kon map uploads/quiz niet aanmaken. Controleer rechten.";
                    }
                }

                if (isset($_POST['quiz_questions']) && is_array($_POST['quiz_questions'])) {
                    $hasQuizFiles = isset($_FILES['quiz_image']['error']) && is_array($_FILES['quiz_image']['error']);
                    foreach ($_POST['quiz_questions'] as $index => $question) {
                        if (empty($question['question']) || empty($question['correct_answer'])) {
                            continue;
                        }

                        $qQuestion = mysqli_real_escape_string($conn, $question['question']);
                        $qImageUrl = '';
                        $idx = is_numeric($index) ? (int)$index : $index;
                        if ($hasQuizFiles && isset($_FILES['quiz_image']['error'][$idx]) && (int)$_FILES['quiz_image']['error'][$idx] === UPLOAD_ERR_OK) {
                            $tmp = $_FILES['quiz_image']['tmp_name'][$idx] ?? '';
                            $name = $_FILES['quiz_image']['name'][$idx] ?? '';
                            if ($tmp && $name && is_uploaded_file($tmp)) {
                                $ext = strtolower(pathinfo($name, PATHINFO_EXTENSION));
                                if (in_array($ext, ['jpg', 'jpeg', 'png', 'gif', 'webp'], true)) {
                                    $safe = time() . '_' . $idx . '_' . preg_replace('/[^a-zA-Z0-9._-]/', '', basename($name));
                                    $target = $quizUploadDir . $safe;
                                    if (move_uploaded_file($tmp, $target)) {
                                        $qImageUrl = mysqli_real_escape_string($conn, 'quiz/' . $safe);
                                    } else {
                                        if (empty($error)) $error = "Kon quizafbeelding niet opslaan (maprechten?). Probeer een kleinere afbeelding.";
                                    }
                                }
                            }
                        }
                        if ($qImageUrl === '' && !empty(trim($question['image_url'] ?? ''))) {
                            $qImageUrl = mysqli_real_escape_string($conn, trim($question['image_url']));
                        }
                        $qOption1 = mysqli_real_escape_string($conn, $question['option_1'] ?? '');
                        $qOption2 = mysqli_real_escape_string($conn, $question['option_2'] ?? '');
                        $qOption3 = mysqli_real_escape_string($conn, $question['option_3'] ?? '');
                        $qOption4 = mysqli_real_escape_string($conn, $question['option_4'] ?? '');

                        // Get difficulty from question data, fallback to form selection
                        $qDifficulty = !empty($question['difficulty'])
                            ? mysqli_real_escape_string($conn, $question['difficulty'])
                            : mysqli_real_escape_string($conn, $_POST['quiz_difficulty'] ?? 'easy');

                        // Determine correct answer based on selection (USE RAW VALUES from POST)
                        $rawOption1 = $question['option_1'] ?? '';
                        $rawOption2 = $question['option_2'] ?? '';
                        $rawOption3 = $question['option_3'] ?? '';
                        $rawOption4 = $question['option_4'] ?? '';

                        $correctAnswerIndex = intval($question['correct_answer']);
                        $correctAnswerText = '';
                        switch ($correctAnswerIndex) {
                            case 1:
                                $correctAnswerText = $rawOption1;
                                break;
                            case 2:
                                $correctAnswerText = $rawOption2;
                                break;
                            case 3:
                                $correctAnswerText = $rawOption3;
                                break;
                            case 4:
                                $correctAnswerText = $rawOption4;
                                break;
                        }

                        if (empty($correctAnswerText)) {
                            continue;
                        }

                        $correctAnswerEscaped = mysqli_real_escape_string($conn, $correctAnswerText);

                        $insertQuery = "INSERT INTO quiz_questions (event_id, question, image_url, correct_answer, option_1, option_2, option_3, option_4, difficulty) 
                            VALUES ($currentEventId, '$qQuestion', '$qImageUrl', '$correctAnswerEscaped', '$qOption1', '$qOption2', '$qOption3', " . ($qOption4 ? "'$qOption4'" : "NULL") . ", '$qDifficulty')";

                        mysqli_query($conn, $insertQuery);
                    }
                }
            }
            // Process new photos
            if (isset($_FILES['new_photos']) && is_array($_FILES['new_photos']['name'])) {
                $mediaDir = __DIR__ . '/uploads/event_media/';
                if (!file_exists($mediaDir)) mkdir($mediaDir, 0755, true);

                foreach ($_FILES['new_photos']['name'] as $idx => $fileName) {
                    if ($_FILES['new_photos']['error'][$idx] === UPLOAD_ERR_OK && !empty($fileName)) {
                        // Ensure it's an image
                        $fileType = $_FILES['new_photos']['type'][$idx];
                        if (strpos($fileType, 'image') === false) continue;

                        $cleanName = time() . '_img_' . $idx . '_' . preg_replace('/[^a-zA-Z0-9._-]/', '', $fileName);
                        $targetPath = $mediaDir . $cleanName;

                        if (move_uploaded_file($_FILES['new_photos']['tmp_name'][$idx], $targetPath)) {
                            $caption = mysqli_real_escape_string($conn, $_POST['new_photos_caption'][$idx] ?? '');
                            mysqli_query($conn, "INSERT INTO event_media (event_id, media_type, file_url, caption, display_order) VALUES ($currentEventId, 'image', '$cleanName', '$caption', 999)");
                        }
                    }
                }
            }

            // Process new videos
            if (isset($_FILES['new_videos']) && is_array($_FILES['new_videos']['name'])) {
                $mediaDir = __DIR__ . '/uploads/event_media/';
                if (!file_exists($mediaDir)) mkdir($mediaDir, 0755, true);

                foreach ($_FILES['new_videos']['name'] as $idx => $fileName) {
                    if ($_FILES['new_videos']['error'][$idx] === UPLOAD_ERR_OK && !empty($fileName)) {
                        // Ensure it's a video
                        $fileType = $_FILES['new_videos']['type'][$idx];
                        if (strpos($fileType, 'video') === false) continue;

                        $cleanName = time() . '_vid_' . $idx . '_' . preg_replace('/[^a-zA-Z0-9._-]/', '', $fileName);
                        $targetPath = $mediaDir . $cleanName;

                        if (move_uploaded_file($_FILES['new_videos']['tmp_name'][$idx], $targetPath)) {
                            $caption = mysqli_real_escape_string($conn, $_POST['new_videos_caption'][$idx] ?? '');
                            mysqli_query($conn, "INSERT INTO event_media (event_id, media_type, file_url, caption, display_order) VALUES ($currentEventId, 'video', '$cleanName', '$caption', 999)");
                        }
                    }
                }
            }

            // Handle media deletions
            if (isset($_POST['delete_media']) && is_array($_POST['delete_media'])) {
                foreach ($_POST['delete_media'] as $mediaId) {
                    mysqli_query($conn, "DELETE FROM event_media WHERE id = " . intval($mediaId) . " AND event_id = $currentEventId");
                }
            }

            // Update media captions (existing media)
            if (isset($_POST['media_caption']) && is_array($_POST['media_caption'])) {
                foreach ($_POST['media_caption'] as $mediaId => $caption) {
                    $caption = mysqli_real_escape_string($conn, $caption);
                    mysqli_query($conn, "UPDATE event_media SET caption = '$caption' WHERE id = " . intval($mediaId));
                }
            }

            // Update has_video based on actual content
            $videoCountResult = mysqli_query($conn, "SELECT COUNT(*) as count FROM event_media WHERE event_id = $currentEventId AND media_type = 'video'");
            $videoCountRow = mysqli_fetch_assoc($videoCountResult);
            $has_video = ($videoCountRow['count'] > 0) ? 1 : 0;

            // Ensure column exists
            $checkColumn = mysqli_query($conn, "SHOW COLUMNS FROM timeline_events LIKE 'has_video'");
            if (mysqli_num_rows($checkColumn) == 0) {
                mysqli_query($conn, "ALTER TABLE timeline_events ADD COLUMN has_video BOOLEAN DEFAULT FALSE");
            }
            mysqli_query($conn, "UPDATE timeline_events SET has_video = $has_video WHERE id = $currentEventId");

            // Stay on edit page with success message instead of redirecting
            $success = "Event succesvol opgeslagen";

            // CRITICAL FIX: Ensure we are in edit mode for the (possibly new) event
            $isEdit = true;
            $eventId = $currentEventId;

            // Reload event data to show updated information (ALWAYS reload after save)
            $result = mysqli_query($conn, "SELECT * FROM timeline_events WHERE id = $eventId");
            if ($result && mysqli_num_rows($result) > 0) {
                $event = mysqli_fetch_assoc($result);
            }

            // Reload media
            $eventMedia = [];
            $mediaResult = mysqli_query($conn, "SELECT * FROM event_media WHERE event_id = $eventId ORDER BY display_order ASC");
            while ($mediaResult && $row = mysqli_fetch_assoc($mediaResult)) {
                $eventMedia[] = $row;
            }

            // Reload sections
            $eventSections = [];
            $sectionsResult = mysqli_query($conn, "SELECT * FROM event_sections WHERE event_id = $eventId ORDER BY section_order ASC");
            while ($sectionsResult && $row = mysqli_fetch_assoc($sectionsResult)) {
                $eventSections[] = $row;
            }

            // Reload key moments
            $eventKeyMoments = [];
            $momentsResult = mysqli_query($conn, "SELECT * FROM event_key_moments WHERE event_id = $eventId ORDER BY display_order ASC");
            while ($momentsResult && $row = mysqli_fetch_assoc($momentsResult)) {
                $eventKeyMoments[] = $row;
            }

            // Update gameType based on reloaded data to ensure UI matches DB
            $gameType = $event['game_type'] ?? 'none';
            if ($gameType === 'none' || empty($gameType)) {
                // Legacy fallback logic
                if ($event['has_puzzle'] && !empty($event['puzzle_image_url'])) {
                    $gameType = 'puzzle';
                } elseif ($event['has_puzzle']) {
                    $gameType = 'memory';
                }
            }
        } else {
            $error = "Database fout: " . mysqli_error($conn);
        }
    }
}
?>
<!DOCTYPE html>
<html lang="nl">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?= $isEdit ? 'Event bewerken' : 'Nieuw event' ?> - Admin</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>
        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }

        body {
            font-family: 'Inter', -apple-system, sans-serif;
            background: #f8fafc;
            min-height: 100vh;
            color: #1e293b;
            padding-bottom: 100px;
        }

        /* Header */
        .header {
            background: white;
            border-bottom: 1px solid #e2e8f0;
            padding: 16px 32px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            position: sticky;
            top: 0;
            z-index: 100;
        }

        .header h1 {
            font-size: 18px;
            font-weight: 600;
        }

        .breadcrumb {
            font-size: 14px;
            color: #64748b;
        }

        .breadcrumb a {
            color: #2563eb;
            text-decoration: none;
        }

        .breadcrumb a:hover {
            text-decoration: underline;
        }

        /* Container */
        .container {
            max-width: 800px;
            margin: 32px auto;
            padding: 0 24px;
        }

        /* Alert */
        .alert {
            padding: 14px 18px;
            border-radius: 8px;
            margin-bottom: 24px;
            font-size: 14px;
        }

        .alert-error {
            background: #fee2e2;
            color: #dc2626;
            border: 1px solid #fecaca;
        }

        .alert-success {
            background: #dcfce7;
            color: #166534;
            border: 1px solid #bbf7d0;
        }

        /* Card */
        .card {
            background: white;
            border-radius: 12px;
            border: 1px solid #e2e8f0;
            margin-bottom: 24px;
            overflow: hidden;
        }

        .card-header {
            padding: 18px 24px;
            border-bottom: 1px solid #e2e8f0;
            background: #f8fafc;
        }

        .card-header h2 {
            font-size: 15px;
            font-weight: 600;
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .card-body {
            padding: 24px;
        }

        /* Form */
        .form-group {
            margin-bottom: 20px;
        }

        .form-group:last-child {
            margin-bottom: 0;
        }

        label {
            display: block;
            font-size: 13px;
            font-weight: 500;
            color: #374151;
            margin-bottom: 6px;
        }

        label .required {
            color: #dc2626;
        }

        label .hint {
            font-weight: 400;
            color: #94a3b8;
            margin-left: 4px;
        }

        input[type="text"],
        input[type="number"],
        textarea,
        select {
            width: 100%;
            padding: 10px 14px;
            border: 1px solid #d1d5db;
            border-radius: 8px;
            font-size: 14px;
            font-family: inherit;
            transition: border-color 0.2s, box-shadow 0.2s;
        }

        input:focus,
        textarea:focus,
        select:focus {
            outline: none;
            border-color: #2563eb;
            box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
        }

        textarea {
            min-height: 100px;
            resize: vertical;
        }

        .form-row {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 16px;
        }

        @media (max-width: 600px) {
            .form-row {
                grid-template-columns: 1fr;
            }
        }

        /* Checkbox */
        .checkbox-label {
            display: flex;
            align-items: center;
            gap: 10px;
            cursor: pointer;
            font-size: 14px;
            padding: 12px 16px;
            background: #f8fafc;
            border-radius: 8px;
            border: 1px solid #e2e8f0;
        }

        .checkbox-label input[type="checkbox"] {
            width: 18px;
            height: 18px;
            accent-color: #2563eb;
        }

        /* Radio Cards */
        .radio-cards {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 12px;
        }

        @media (max-width: 600px) {
            .radio-cards {
                grid-template-columns: 1fr;
            }
        }

        .radio-card {
            position: relative;
            cursor: pointer;
        }

        .radio-card input {
            position: absolute;
            opacity: 0;
        }

        .radio-card-content {
            padding: 16px;
            border: 2px solid #e2e8f0;
            border-radius: 10px;
            text-align: center;
            transition: all 0.2s;
        }

        .radio-card input:checked+.radio-card-content {
            border-color: #2563eb;
            background: #eff6ff;
        }

        .radio-card-content .icon {
            font-size: 24px;
            margin-bottom: 8px;
        }

        .radio-card-content .title {
            font-weight: 600;
            font-size: 14px;
        }

        .radio-card-content .desc {
            font-size: 12px;
            color: #64748b;
            margin-top: 4px;
        }

        /* Media Grid */
        .media-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
            gap: 16px;
            margin-bottom: 16px;
        }

        .media-item {
            position: relative;
            background: #f1f5f9;
            border-radius: 8px;
            overflow: hidden;
            aspect-ratio: 1;
        }

        .media-item img,
        .media-item video {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }

        .media-item .overlay {
            position: absolute;
            inset: 0;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            gap: 8px;
            opacity: 0;
            transition: opacity 0.2s;
        }

        .media-item:hover .overlay {
            opacity: 1;
        }

        .media-item .delete-btn {
            background: #dc2626;
            color: white;
            border: none;
            padding: 6px 12px;
            border-radius: 6px;
            font-size: 12px;
            cursor: pointer;
        }

        .media-item .caption-input {
            width: calc(100% - 16px);
            padding: 6px;
            font-size: 11px;
            border-radius: 4px;
            border: none;
        }

        .media-placeholder {
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 32px;
            color: #94a3b8;
        }

        /* Sections & Moments */
        .repeater-item {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 16px;
            margin-bottom: 12px;
        }

        .repeater-item .remove-btn {
            background: #fee2e2;
            color: #dc2626;
            border: none;
            padding: 6px 12px;
            border-radius: 6px;
            font-size: 12px;
            cursor: pointer;
            float: right;
        }

        .add-btn {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 10px 16px;
            background: #eff6ff;
            color: #2563eb;
            border: 1px dashed #2563eb;
            border-radius: 8px;
            font-size: 13px;
            font-weight: 500;
            cursor: pointer;
        }

        .add-btn:hover {
            background: #dbeafe;
        }

        /* Upload Area */
        .upload-area {
            border: 2px dashed #d1d5db;
            border-radius: 10px;
            padding: 32px;
            text-align: center;
            cursor: pointer;
            transition: all 0.2s;
        }

        .upload-area:hover {
            border-color: #2563eb;
            background: #f8fafc;
        }

        .upload-area input {
            display: none;
        }

        .upload-area .icon {
            font-size: 32px;
            margin-bottom: 8px;
        }

        .upload-area .text {
            font-size: 14px;
            color: #64748b;
        }

        /* Footer */
        .footer {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            background: white;
            border-top: 1px solid #e2e8f0;
            padding: 16px 32px;
            display: flex;
            justify-content: flex-end;
            gap: 12px;
            z-index: 100;
        }

        .btn {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 10px 20px;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 500;
            text-decoration: none;
            border: none;
            cursor: pointer;
            transition: all 0.2s;
        }

        .btn-primary {
            background: #2563eb;
            color: white;
        }

        .btn-primary:hover {
            background: #1d4ed8;
        }

        .btn-secondary {
            background: #f1f5f9;
            color: #475569;
        }

        .btn-secondary:hover {
            background: #e2e8f0;
        }

        /* Puzzle upload area */
        .puzzle-upload {
            display: none;
            margin-top: 16px;
        }

        .puzzle-upload.show {
            display: block;
        }

        .quiz-questions {
            display: none;
            margin-top: 16px;
        }

        .quiz-questions.show {
            display: block;
        }

        .quiz-item {
            background: #f8fafc;
            padding: 20px;
            border-radius: 8px;
            border-left: 4px solid #3b82f6;
        }

        .current-image {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 12px;
            background: #f0fdf4;
            border: 1px solid #bbf7d0;
            border-radius: 8px;
            margin-top: 12px;
        }

        .current-image img {
            width: 60px;
            height: 60px;
            object-fit: cover;
            border-radius: 6px;
        }

        /* Radio button for correct answer selection in quiz questions */
        .correct-dot-label { cursor: pointer; flex-shrink: 0; display: inline-flex; align-items: center; }
        .correct-dot-label input { position: absolute; opacity: 0; width: 0; height: 0; }
        .correct-dot { display: inline-block; width: 22px; height: 22px; border-radius: 50%; border: 2px solid #94a3b8; transition: background 0.2s, border-color 0.2s; }
        .correct-dot-label input:checked + .correct-dot { background: #22c55e; border-color: #22c55e; }
        .quiz-answer-row { display: flex; align-items: center; gap: 10px; }

        /* Media Tabs */
        .media-tabs { display: flex; gap: 10px; margin-bottom: 20px; border-bottom: 2px solid #e2e8f0; }
        .media-tab { padding: 10px 20px; cursor: pointer; font-weight: 600; color: #64748b; border-bottom: 2px solid transparent; margin-bottom: -2px; transition: all 0.2s; }
        .media-tab:hover { color: #334155; }
        .media-tab.active { color: #2563eb; border-bottom-color: #2563eb; }
        .media-content { display: none; }
        .media-content.active { display: block; }
    </style>
</head>

<body>
    <header class="header">
        <div>
            <div class="breadcrumb">
                <a href="index.php">Dashboard</a> / <?= $isEdit ? 'Event bewerken' : 'Nieuw event' ?>
            </div>
            <h1><?= $isEdit ? 'Event bewerken' : 'Nieuw event aanmaken' ?></h1>
        </div>
    </header>

    <form method="POST" enctype="multipart/form-data" class="container">
        <?php if ($error): ?>
            <div class="alert alert-error"><?= htmlspecialchars($error) ?></div>
        <?php endif; ?>
        <?php if ($success): ?>
            <div class="alert alert-success"><?= htmlspecialchars($success) ?></div>
        <?php endif; ?>

        <!-- Basic Info -->
        <div class="card">
            <div class="card-header">
                <h2>📝 Basis informatie</h2>
            </div>
            <div class="card-body">
                <div class="form-row">
                    <div class="form-group">
                        <label>Jaar <span class="required">*</span> <span class="hint">(bijv. 1950 of 1900-1910)</span></label>
                        <input type="text" name="year" value="<?= htmlspecialchars($event['year']) ?>" required pattern="^\d{4}(-\d{4})?$" autocomplete="off">
                    </div>
                    <div class="form-group">
                        <label>Categorie</label>
                        <select name="category">
                            <option value="museum" <?= $event['category'] === 'museum' ? 'selected' : '' ?>>Museum</option>
                            <option value="landbouw" <?= $event['category'] === 'landbouw' ? 'selected' : '' ?>>Landbouw</option>
                            <option value="maatschappelijk" <?= $event['category'] === 'maatschappelijk' ? 'selected' : '' ?>>Maatschappelijk</option>
                        </select>
                    </div>
                </div>

                <div class="form-group">
                    <label>Titel <span class="required">*</span></label>
                    <input type="text" name="title" value="<?= htmlspecialchars($event['title']) ?>" required autocomplete="off">
                </div>

                <div class="form-group">
                    <label>Beschrijving <span class="required">*</span></label>
                    <textarea name="description" required autocomplete="off"><?= htmlspecialchars($event['description']) ?></textarea>
                </div>

                <div class="form-group">
                    <label>Historische context <span class="hint">(optioneel)</span></label>
                    <textarea name="historical_context"><?= htmlspecialchars($event['historical_context'] ?? '') ?></textarea>
                </div>

                <div class="form-group">
                    <label class="checkbox-label">
                        <input type="checkbox" name="is_active" <?= $event['is_active'] ? 'checked' : '' ?>>
                        <span>Event is zichtbaar op de timeline</span>
                    </label>
                </div>
            </div>
        </div>

        <!-- Media -->
        <div class="card">
            <div class="card-header">
                <h2>🖼️ Media</h2>
            </div>
            <div class="card-body">
                <?php
                $images = [];
                $videos = [];
                if (!empty($eventMedia)) {
                    foreach ($eventMedia as $media) {
                        if ($media['media_type'] === 'video') $videos[] = $media;
                        else $images[] = $media;
                    }
                }
                ?>

                <div class="media-tabs">
                    <div class="media-tab active" data-tab="photos" onclick="switchMediaTab('photos')">Foto's</div>
                    <div class="media-tab" data-tab="videos" onclick="switchMediaTab('videos')">Video's</div>
                </div>

                <!-- Photos Tab -->
                <div id="media-photos" class="media-content active">
                    <?php if (!empty($images)): ?>
                        <div class="media-grid">
                            <?php foreach ($images as $media): ?>
                                <div class="media-item">
                                    <img src="uploads/event_media/<?= htmlspecialchars($media['file_url']) ?>" alt="">
                                    <div class="overlay">
                                        <input type="text" class="caption-input" name="media_caption[<?= $media['id'] ?>]" value="<?= htmlspecialchars($media['caption'] ?? '') ?>" placeholder="Bijschrift">
                                        <label style="color:white;font-size:12px;display:flex;align-items:center;gap:4px;">
                                            <input type="checkbox" name="delete_media[]" value="<?= $media['id'] ?>"> Verwijderen
                                        </label>
                                    </div>
                                </div>
                            <?php endforeach; ?>
                        </div>
                    <?php endif; ?>

                    <div class="upload-area" onclick="document.getElementById('upload-photos').click()">
                        <input type="file" id="upload-photos" name="new_photos[]" multiple accept="image/*" style="display:none" onchange="updateFileList(this, 'file-list-photos', 'new_photos_caption')">
                        <div class="icon">📷</div>
                        <div class="text">Klik om foto's te uploaden<br><small>JPG, PNG, GIF</small></div>
                    </div>
                    <div id="file-list-photos" style="margin-top:12px;font-size:13px;color:#64748b;"></div>
                </div>

                <!-- Videos Tab -->
                <div id="media-videos" class="media-content">
                    <?php if (!empty($videos)): ?>
                        <div class="media-grid">
                            <?php foreach ($videos as $media): ?>
                                <div class="media-item">
                                    <video src="uploads/event_media/<?= htmlspecialchars($media['file_url']) ?>"></video>
                                    <div class="media-placeholder" style="position:absolute;inset:0;display:flex;">🎬</div>
                                    <div class="overlay">
                                        <input type="text" class="caption-input" name="media_caption[<?= $media['id'] ?>]" value="<?= htmlspecialchars($media['caption'] ?? '') ?>" placeholder="Bijschrift">
                                        <label style="color:white;font-size:12px;display:flex;align-items:center;gap:4px;">
                                            <input type="checkbox" name="delete_media[]" value="<?= $media['id'] ?>"> Verwijderen
                                        </label>
                                    </div>
                                </div>
                            <?php endforeach; ?>
                        </div>
                    <?php endif; ?>

                    <div class="upload-area" onclick="document.getElementById('upload-videos').click()">
                        <input type="file" id="upload-videos" name="new_videos[]" multiple accept="video/*" style="display:none" onchange="updateFileList(this, 'file-list-videos', 'new_videos_caption')">
                        <div class="icon">🎬</div>
                        <div class="text">Klik om video's te uploaden<br><small>MP4, WEBM</small></div>
                    </div>
                    <div id="file-list-videos" style="margin-top:12px;font-size:13px;color:#64748b;"></div>
                </div>
            </div>
        </div>

        <!-- Extra Sections -->
        <div class="card">
            <div class="card-header">
                <h2>📄 Extra secties <span style="font-weight:400;color:#64748b;font-size:13px;">(optioneel)</span></h2>
            </div>
            <div class="card-body">
                <div id="sections-container">
                    <?php foreach ($eventSections as $idx => $section): ?>
                        <div class="repeater-item">
                            <button type="button" class="remove-btn" onclick="this.parentElement.remove()">Verwijderen</button>
                            <div class="form-group">
                                <label>Sectie titel</label>
                                <input type="text" name="sections[<?= $idx ?>][title]" value="<?= htmlspecialchars($section['section_title']) ?>">
                            </div>
                            <div class="form-group">
                                <label>Inhoud</label>
                                <textarea name="sections[<?= $idx ?>][content]"><?= htmlspecialchars($section['section_content']) ?></textarea>
                            </div>
                        </div>
                    <?php endforeach; ?>
                </div>
                <button type="button" class="add-btn" onclick="addSection()">+ Sectie toevoegen</button>
            </div>
        </div>

        <!-- Key Moments -->
        <div class="card">
            <div class="card-header">
                <h2>⏱️ Belangrijke momenten <span style="font-weight:400;color:#64748b;font-size:13px;">(mini-timeline)</span></h2>
            </div>
            <div class="card-body">
                <div class="form-group">
                    <label class="checkbox-label">
                        <input type="checkbox" name="has_key_moments" id="has_key_moments" <?= $event['has_key_moments'] ? 'checked' : '' ?> onchange="toggleMoments()">
                        <span>Dit event heeft belangrijke momenten</span>
                    </label>
                </div>

                <div id="moments-section" style="<?= $event['has_key_moments'] ? '' : 'display:none' ?>;margin-top:16px;">
                    <div id="moments-container">
                        <?php foreach ($eventKeyMoments as $idx => $moment): ?>
                            <div class="repeater-item">
                                <button type="button" class="remove-btn" onclick="this.parentElement.remove()">Verwijderen</button>
                                <div class="form-row">
                                    <div class="form-group">
                                        <label>Jaar</label>
                                        <input type="number" name="key_moments[<?= $idx ?>][year]" value="<?= htmlspecialchars($moment['year']) ?>" min="1000" max="2100">
                                    </div>
                                    <div class="form-group">
                                        <label>Titel</label>
                                        <input type="text" name="key_moments[<?= $idx ?>][title]" value="<?= htmlspecialchars($moment['title']) ?>">
                                    </div>
                                </div>
                                <div class="form-group">
                                    <label>Korte beschrijving</label>
                                    <input type="text" name="key_moments[<?= $idx ?>][description]" value="<?= htmlspecialchars($moment['short_description'] ?? '') ?>">
                                </div>
                            </div>
                        <?php endforeach; ?>
                    </div>
                    <button type="button" class="add-btn" onclick="addMoment()">+ Moment toevoegen</button>
                </div>
            </div>
        </div>

        <!-- Game -->
        <div class="card">
            <div class="card-header">
                <h2>🎮 Spel</h2>
            </div>
            <div class="card-body">
                <div class="radio-cards">
                    <label class="radio-card">
                        <input type="radio" name="game_type" value="none" <?= $gameType === 'none' ? 'checked' : '' ?> onchange="updateGameType()">
                        <div class="radio-card-content">
                            <div class="icon">❌</div>
                            <div class="title">Geen spel</div>
                        </div>
                    </label>
                    <label class="radio-card">
                        <input type="radio" name="game_type" value="puzzle" <?= $gameType === 'puzzle' ? 'checked' : '' ?> onchange="updateGameType()">
                        <div class="radio-card-content">
                            <div class="icon">🧩</div>
                            <div class="title">Puzzel</div>
                            <div class="desc">Schuifpuzzel</div>
                        </div>
                    </label>
                    <label class="radio-card">
                        <input type="radio" name="game_type" value="memory" <?= $gameType === 'memory' ? 'checked' : '' ?> onchange="updateGameType()">
                        <div class="radio-card-content">
                            <div class="icon">🃏</div>
                            <div class="title">Memory</div>
                            <div class="desc">Vind de paren</div>
                        </div>
                    </label>
                    <label class="radio-card">
                        <input type="radio" name="game_type" value="quiz" <?= $gameType === 'quiz' ? 'checked' : '' ?> onchange="updateGameType()">
                        <div class="radio-card-content">
                            <div class="icon">❓</div>
                            <div class="title">Quiz</div>
                            <div class="desc">Herken het werktuig</div>
                        </div>
                    </label>
                </div>

                <div id="puzzle-upload" class="puzzle-upload <?= $gameType === 'puzzle' ? 'show' : '' ?>">
                    <label>Upload puzzel afbeelding <span class="hint">(optioneel - kan ook foto's van het event gebruiken)</span></label>
                    <div style="display:flex;align-items:center;gap:8px;margin-top:8px;flex-wrap:wrap;">
                        <input type="file" id="puzzle_image_input" name="puzzle_image" accept="image/*" style="position:absolute;opacity:0;width:0.1px;height:0.1px;overflow:hidden" onchange="var n=document.getElementById('puzzle_file_name');n.textContent=this.files.length?this.files[0].name:'Geen bestand gekozen';">
                        <button type="button" onclick="document.getElementById('puzzle_image_input').click()" style="padding:8px 16px;background:#475569;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:14px;">Kies bestand</button>
                        <span id="puzzle_file_name" style="color:#64748b;font-size:14px;">Geen bestand gekozen</span>
                    </div>

                    <?php if (!empty($event['puzzle_image_url'])): ?>
                        <div class="current-image">
                            <img src="uploads/<?= htmlspecialchars($event['puzzle_image_url']) ?>" alt="">
                            <div>
                                <strong>Huidige afbeelding</strong><br>
                                <small><?= htmlspecialchars($event['puzzle_image_url']) ?></small>
                            </div>
                        </div>
                    <?php endif; ?>


                </div>

                <div id="quiz-questions" class="quiz-questions <?= $gameType === 'quiz' ? 'show' : '' ?>">
                    <?php
                    // Fetch existing quiz questions for this event (before rendering form)
                    $quizQuestions = [];
                    $currentQuizDifficulty = '';
                    if ($isEdit && $gameType === 'quiz') {
                        $quizQuery = mysqli_query($conn, "SELECT * FROM quiz_questions WHERE event_id = $eventId ORDER BY id ASC");
                        while ($row = mysqli_fetch_assoc($quizQuery)) {
                            $quizQuestions[] = $row;
                            if (empty($currentQuizDifficulty)) {
                                $currentQuizDifficulty = $row['difficulty'];
                            }
                        }
                    }

                    if (empty($quizQuestions)) {
                        $quizQuestions = [['id' => '', 'question' => '', 'image_url' => '', 'correct_answer' => '', 'option_1' => '', 'option_2' => '', 'option_3' => '', 'option_4' => '', 'difficulty' => '']];
                    }

                    // Separate questions by difficulty
                    $easyQuestions = [];
                    $hardQuestions = [];
                    foreach ($quizQuestions as $q) {
                        if (empty($q['difficulty']) || $q['difficulty'] === 'easy') {
                            $easyQuestions[] = $q;
                        } else {
                            $hardQuestions[] = $q;
                        }
                    }
                    ?>

                    <div class="form-group">
                        <label>Selecteer niveau</label>
                        <div class="radio-group-horizontal" style="display:flex;gap:16px;margin-top:8px;">
                            <label class="radio-label" style="display:flex;align-items:center;gap:8px;cursor:pointer;">
                                <input type="radio" name="quiz_difficulty" value="easy" <?= $currentQuizDifficulty === 'easy' ? 'checked' : '' ?> onchange="toggleQuizForm()">
                                <span>Makkelijk</span>
                            </label>
                            <label class="radio-label" style="display:flex;align-items:center;gap:8px;cursor:pointer;">
                                <input type="radio" name="quiz_difficulty" value="hard" <?= $currentQuizDifficulty === 'hard' ? 'checked' : '' ?> onchange="toggleQuizForm()">
                                <span>Moeilijk</span>
                            </label>
                        </div>
                    </div>

                    <div id="quiz-form" style="<?= !empty($currentQuizDifficulty) ? '' : 'display:none;' ?>margin-top:24px;">
                        <div id="quiz-container">
                            <!-- Easy questions -->
                            <div id="quiz-easy" class="quiz-difficulty-group" style="<?= $currentQuizDifficulty === 'hard' ? 'display:none;' : '' ?>">
                                <?php foreach ($easyQuestions as $idx => $question): ?>
                                    <div class="repeater-item quiz-item" data-difficulty="easy">
                                        <button type="button" class="remove-btn" onclick="this.parentElement.remove()">Verwijderen</button>
                                        <input type="hidden" name="quiz_questions[<?= $idx ?>][id]" value="<?= htmlspecialchars($question['id']) ?>">
                                        <input type="hidden" name="quiz_questions[<?= $idx ?>][difficulty]" value="easy">

                                        <div class="form-group">
                                            <label>Vraag</label>
                                            <input type="text" name="quiz_questions[<?= $idx ?>][question]" value="<?= htmlspecialchars($question['question']) ?>" placeholder="Waarvoor werd dit werktuig gebruikt?" autocomplete="off">
                                        </div>

                                        <div class="form-group">
                                            <label>Afbeelding</label>
                                            <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
                                                <input type="file" name="quiz_image[<?= $idx ?>]" accept="image/*" style="position:absolute;opacity:0;width:0.1px;height:0.1px;overflow:hidden" onchange="var n=this.closest('.form-group').querySelector('.quiz-file-name');if(n)n.textContent=this.files.length?this.files[0].name:'Geen bestand gekozen';">
                                                <button type="button" onclick="this.previousElementSibling.click()" style="padding:6px 14px;background:#475569;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:14px;">Kies bestand</button>
                                                <span class="quiz-file-name" style="color:#64748b;font-size:14px;">Geen bestand gekozen</span>
                                            </div>
                                            <input type="hidden" name="quiz_questions[<?= $idx ?>][image_url]" value="<?= htmlspecialchars($question['image_url']) ?>">
                                        </div>

                                        <div class="form-row">
                                            <div class="form-group quiz-answer-row" style="flex:1;">
                                                <label class="correct-dot-label" title="Klik om als juiste antwoord te markeren">
                                                    <input type="radio" name="quiz_questions[<?= $idx ?>][correct_answer]" value="1" <?= $question['correct_answer'] === $question['option_1'] ? 'checked' : '' ?> required>
                                                    <span class="correct-dot"></span>
                                                </label>
                                                <div style="flex:1;">
                                                    <label>Antwoord 1</label>
                                                    <input type="text" name="quiz_questions[<?= $idx ?>][option_1]" value="<?= htmlspecialchars($question['option_1']) ?>" placeholder="Eerste optie" autocomplete="off">
                                                </div>
                                            </div>
                                            <div class="form-group quiz-answer-row" style="flex:1;">
                                                <label class="correct-dot-label" title="Klik om als juiste antwoord te markeren">
                                                    <input type="radio" name="quiz_questions[<?= $idx ?>][correct_answer]" value="2" <?= $question['correct_answer'] === $question['option_2'] ? 'checked' : '' ?>>
                                                    <span class="correct-dot"></span>
                                                </label>
                                                <div style="flex:1;">
                                                    <label>Antwoord 2</label>
                                                    <input type="text" name="quiz_questions[<?= $idx ?>][option_2]" value="<?= htmlspecialchars($question['option_2']) ?>" placeholder="Tweede optie" autocomplete="off">
                                                </div>
                                            </div>
                                        </div>

                                        <div class="form-row">
                                            <div class="form-group quiz-answer-row" style="flex:1;">
                                                <label class="correct-dot-label" title="Klik om als juiste antwoord te markeren">
                                                    <input type="radio" name="quiz_questions[<?= $idx ?>][correct_answer]" value="3" <?= $question['correct_answer'] === $question['option_3'] ? 'checked' : '' ?>>
                                                    <span class="correct-dot"></span>
                                                </label>
                                                <div style="flex:1;">
                                                    <label>Antwoord 3</label>
                                                    <input type="text" name="quiz_questions[<?= $idx ?>][option_3]" value="<?= htmlspecialchars($question['option_3']) ?>" placeholder="Derde optie" autocomplete="off">
                                                </div>
                                            </div>
                                            <div class="form-group quiz-answer-row" style="flex:1;">
                                                <label class="correct-dot-label" title="Klik om als juiste antwoord te markeren">
                                                    <input type="radio" name="quiz_questions[<?= $idx ?>][correct_answer]" value="4" <?= !empty($question['option_4']) && $question['correct_answer'] === $question['option_4'] ? 'checked' : '' ?>>
                                                    <span class="correct-dot"></span>
                                                </label>
                                                <div style="flex:1;">
                                                    <label>Antwoord 4 (optioneel)</label>
                                                    <input type="text" name="quiz_questions[<?= $idx ?>][option_4]" value="<?= htmlspecialchars($question['option_4']) ?>" placeholder="Vierde optie (optioneel)" autocomplete="off">
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                <?php endforeach; ?>
                            </div>

                            <!-- Hard questions -->
                            <div id="quiz-hard" class="quiz-difficulty-group" style="<?= $currentQuizDifficulty === 'easy' ? 'display:none;' : '' ?>">
                                <?php
                                $hardIndexOffset = count($easyQuestions);
                                foreach ($hardQuestions as $idx => $question):
                                ?>
                                    <div class="repeater-item quiz-item" data-difficulty="hard">
                                        <button type="button" class="remove-btn" onclick="this.parentElement.remove()">Verwijderen</button>
                                        <input type="hidden" name="quiz_questions[<?= $hardIndexOffset + $idx ?>][id]" value="<?= htmlspecialchars($question['id']) ?>">
                                        <input type="hidden" name="quiz_questions[<?= $hardIndexOffset + $idx ?>][difficulty]" value="hard">

                                        <div class="form-group">
                                            <label>Vraag</label>
                                            <input type="text" name="quiz_questions[<?= $hardIndexOffset + $idx ?>][question]" value="<?= htmlspecialchars($question['question']) ?>" placeholder="Waarvoor werd dit werktuig gebruikt?" autocomplete="off">
                                        </div>

                                        <div class="form-group">
                                            <label>Afbeelding</label>
                                            <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
                                                <input type="file" name="quiz_image[<?= $hardIndexOffset + $idx ?>]" accept="image/*" style="position:absolute;opacity:0;width:0.1px;height:0.1px;overflow:hidden" onchange="var n=this.closest('.form-group').querySelector('.quiz-file-name');if(n)n.textContent=this.files.length?this.files[0].name:'Geen bestand gekozen';">
                                                <button type="button" onclick="this.previousElementSibling.click()" style="padding:6px 14px;background:#475569;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:14px;">Kies bestand</button>
                                                <span class="quiz-file-name" style="color:#64748b;font-size:14px;">Geen bestand gekozen</span>
                                            </div>
                                            <input type="hidden" name="quiz_questions[<?= $hardIndexOffset + $idx ?>][image_url]" value="<?= htmlspecialchars($question['image_url']) ?>">
                                        </div>

                                        <div class="form-row">
                                            <div class="form-group quiz-answer-row" style="flex:1;">
                                                <label class="correct-dot-label" title="Klik om als juiste antwoord te markeren">
                                                    <input type="radio" name="quiz_questions[<?= $hardIndexOffset + $idx ?>][correct_answer]" value="1" <?= $question['correct_answer'] === $question['option_1'] ? 'checked' : '' ?> required>
                                                    <span class="correct-dot"></span>
                                                </label>
                                                <div style="flex:1;">
                                                    <label>Antwoord 1</label>
                                                    <input type="text" name="quiz_questions[<?= $hardIndexOffset + $idx ?>][option_1]" value="<?= htmlspecialchars($question['option_1']) ?>" placeholder="Eerste optie" autocomplete="off">
                                                </div>
                                            </div>
                                            <div class="form-group quiz-answer-row" style="flex:1;">
                                                <label class="correct-dot-label" title="Klik om als juiste antwoord te markeren">
                                                    <input type="radio" name="quiz_questions[<?= $hardIndexOffset + $idx ?>][correct_answer]" value="2" <?= $question['correct_answer'] === $question['option_2'] ? 'checked' : '' ?>>
                                                    <span class="correct-dot"></span>
                                                </label>
                                                <div style="flex:1;">
                                                    <label>Antwoord 2</label>
                                                    <input type="text" name="quiz_questions[<?= $hardIndexOffset + $idx ?>][option_2]" value="<?= htmlspecialchars($question['option_2']) ?>" placeholder="Tweede optie" autocomplete="off">
                                                </div>
                                            </div>
                                        </div>

                                        <div class="form-row">
                                            <div class="form-group quiz-answer-row" style="flex:1;">
                                                <label class="correct-dot-label" title="Klik om als juiste antwoord te markeren">
                                                    <input type="radio" name="quiz_questions[<?= $hardIndexOffset + $idx ?>][correct_answer]" value="3" <?= $question['correct_answer'] === $question['option_3'] ? 'checked' : '' ?>>
                                                    <span class="correct-dot"></span>
                                                </label>
                                                <div style="flex:1;">
                                                    <label>Antwoord 3</label>
                                                    <input type="text" name="quiz_questions[<?= $hardIndexOffset + $idx ?>][option_3]" value="<?= htmlspecialchars($question['option_3']) ?>" placeholder="Derde optie" autocomplete="off">
                                                </div>
                                            </div>
                                            <div class="form-group quiz-answer-row" style="flex:1;">
                                                <label class="correct-dot-label" title="Klik om als juiste antwoord te markeren">
                                                    <input type="radio" name="quiz_questions[<?= $hardIndexOffset + $idx ?>][correct_answer]" value="4" <?= !empty($question['option_4']) && $question['correct_answer'] === $question['option_4'] ? 'checked' : '' ?>>
                                                    <span class="correct-dot"></span>
                                                </label>
                                                <div style="flex:1;">
                                                    <label>Antwoord 4 (optioneel)</label>
                                                    <input type="text" name="quiz_questions[<?= $hardIndexOffset + $idx ?>][option_4]" value="<?= htmlspecialchars($question['option_4']) ?>" placeholder="Vierde optie (optioneel)" autocomplete="off">
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                <?php endforeach; ?>
                            </div>
                        </div>
                        <button type="button" class="add-btn" onclick="addQuizQuestion()">+ Vraag toevoegen</button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Footer -->
        <div class="footer">
            <a href="index.php" class="btn btn-secondary">Annuleren</a>
            <button type="submit" class="btn btn-primary">💾 Opslaan</button>
        </div>
    </form>

    <script>
        let sectionIndex = <?= count($eventSections) ?>;
        let momentIndex = <?= count($eventKeyMoments) ?>;

        function addSection() {
            const container = document.getElementById('sections-container');
            const html = `
                <div class="repeater-item">
                    <button type="button" class="remove-btn" onclick="this.parentElement.remove()">Verwijderen</button>
                    <div class="form-group">
                        <label>Sectie titel</label>
                        <input type="text" name="sections[${sectionIndex}][title]">
                    </div>
                    <div class="form-group">
                        <label>Inhoud</label>
                        <textarea name="sections[${sectionIndex}][content]"></textarea>
                    </div>
                </div>
            `;
            container.insertAdjacentHTML('beforeend', html);
            sectionIndex++;
        }

        function addMoment() {
            const container = document.getElementById('moments-container');
            const html = `
                <div class="repeater-item">
                    <button type="button" class="remove-btn" onclick="this.parentElement.remove()">Verwijderen</button>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Jaar</label>
                            <input type="number" name="key_moments[${momentIndex}][year]" min="1000" max="2100">
                        </div>
                        <div class="form-group">
                            <label>Titel</label>
                            <input type="text" name="key_moments[${momentIndex}][title]">
                        </div>
                    </div>
                    <div class="form-group">
                        <label>Korte beschrijving</label>
                        <input type="text" name="key_moments[${momentIndex}][description]">
                    </div>
                </div>
            `;
            container.insertAdjacentHTML('beforeend', html);
            momentIndex++;
        }

        function toggleMoments() {
            const section = document.getElementById('moments-section');
            const checkbox = document.getElementById('has_key_moments');
            section.style.display = checkbox.checked ? 'block' : 'none';
        }

        function updateGameType() {
            const puzzleUpload = document.getElementById('puzzle-upload');
            const quizQuestions = document.getElementById('quiz-questions');
            const selectedType = document.querySelector('input[name="game_type"]:checked').value;
            puzzleUpload.classList.toggle('show', selectedType === 'puzzle');
            quizQuestions.classList.toggle('show', selectedType === 'quiz');

            // Reset quiz form when switching game type
            if (selectedType !== 'quiz') {
                document.getElementById('quiz-form').style.display = 'none';
            } else {
                toggleQuizForm();
            }
        }

        function toggleQuizForm() {
            const quizForm = document.getElementById('quiz-form');
            const selectedDifficulty = document.querySelector('input[name="quiz_difficulty"]:checked');

            if (!selectedDifficulty) {
                quizForm.style.display = 'none';
                return;
            }

            quizForm.style.display = 'block';

            // Show/hide questions based on difficulty
            const easyGroup = document.getElementById('quiz-easy');
            const hardGroup = document.getElementById('quiz-hard');

            if (selectedDifficulty.value === 'easy') {
                if (easyGroup) easyGroup.style.display = 'block';
                if (hardGroup) hardGroup.style.display = 'none';
            } else if (selectedDifficulty.value === 'hard') {
                if (easyGroup) easyGroup.style.display = 'none';
                if (hardGroup) hardGroup.style.display = 'block';
            }
        }

        // Initialize quiz form visibility on page load
        document.addEventListener('DOMContentLoaded', function() {
            toggleQuizForm();

            // Set custom validation messages in Dutch
            const form = document.querySelector('form');
            if (form) {
                form.addEventListener('invalid', function(e) {
                    const element = e.target;
                    if (element.tagName === 'SELECT' && element.hasAttribute('required')) {
                        element.setCustomValidity('Selecteer het juiste antwoord uit de lijst');
                    } else {
                        element.setCustomValidity('');
                    }
                }, true);

                form.addEventListener('input', function(e) {
                    e.target.setCustomValidity('');
                });
            }
        });

        function addQuizQuestion() {
            const selectedDifficulty = document.querySelector('input[name="quiz_difficulty"]:checked');
            if (!selectedDifficulty) {
                alert('Selecteer eerst een niveau (Makkelijk of Moeilijk)');
                return;
            }

            const difficulty = selectedDifficulty.value;
            const container = difficulty === 'easy' ?
                document.getElementById('quiz-easy') :
                document.getElementById('quiz-hard');

            if (!container) {
                alert('Kon container niet vinden');
                return;
            }

            // Count existing questions in both groups to get correct index
            const easyGroup = document.getElementById('quiz-easy');
            const hardGroup = document.getElementById('quiz-hard');
            const easyCount = easyGroup ? easyGroup.querySelectorAll('.quiz-item').length : 0;
            const hardCount = hardGroup ? hardGroup.querySelectorAll('.quiz-item').length : 0;
            const index = difficulty === 'easy' ? easyCount : easyCount + hardCount;

            const html = `
                <div class="repeater-item quiz-item" data-difficulty="${difficulty}">
                    <button type="button" class="remove-btn" onclick="this.parentElement.remove()">Verwijderen</button>
                    <input type="hidden" name="quiz_questions[${index}][id]" value="">
                    <input type="hidden" name="quiz_questions[${index}][difficulty]" value="${difficulty}">
                    
                    <div class="form-group">
                        <label>Vraag</label>
                        <input type="text" name="quiz_questions[${index}][question]" placeholder="Waarvoor werd dit werktuig gebruikt?" autocomplete="off">
                    </div>

                    <div class="form-group">
                        <label>Afbeelding</label>
                        <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
                            <input type="file" name="quiz_image[${index}]" accept="image/*" style="position:absolute;opacity:0;width:0.1px;height:0.1px;overflow:hidden" onchange="var n=this.closest('.form-group').querySelector('.quiz-file-name');if(n)n.textContent=this.files.length?this.files[0].name:'Geen bestand gekozen';">
                            <button type="button" onclick="this.previousElementSibling.click()" style="padding:6px 14px;background:#475569;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:14px;">Kies bestand</button>
                            <span class="quiz-file-name" style="color:#64748b;font-size:14px;">Geen bestand gekozen</span>
                        </div>
                        <input type="hidden" name="quiz_questions[${index}][image_url]" value="">
                    </div>

                    <div class="form-row">
                        <div class="form-group quiz-answer-row" style="flex:1;">
                            <label class="correct-dot-label" title="Klik om als juiste antwoord te markeren">
                                <input type="radio" name="quiz_questions[${index}][correct_answer]" value="1" required>
                                <span class="correct-dot"></span>
                            </label>
                            <div style="flex:1;">
                                <label>Antwoord 1</label>
                                <input type="text" name="quiz_questions[${index}][option_1]" placeholder="Eerste optie" autocomplete="off">
                            </div>
                        </div>
                        <div class="form-group quiz-answer-row" style="flex:1;">
                            <label class="correct-dot-label" title="Klik om als juiste antwoord te markeren">
                                <input type="radio" name="quiz_questions[${index}][correct_answer]" value="2">
                                <span class="correct-dot"></span>
                            </label>
                            <div style="flex:1;">
                                <label>Antwoord 2</label>
                                <input type="text" name="quiz_questions[${index}][option_2]" placeholder="Tweede optie" autocomplete="off">
                            </div>
                        </div>
                    </div>

                    <div class="form-row">
                        <div class="form-group quiz-answer-row" style="flex:1;">
                            <label class="correct-dot-label" title="Klik om als juiste antwoord te markeren">
                                <input type="radio" name="quiz_questions[${index}][correct_answer]" value="3">
                                <span class="correct-dot"></span>
                            </label>
                            <div style="flex:1;">
                                <label>Antwoord 3</label>
                                <input type="text" name="quiz_questions[${index}][option_3]" placeholder="Derde optie" autocomplete="off">
                            </div>
                        </div>
                        <div class="form-group quiz-answer-row" style="flex:1;">
                            <label class="correct-dot-label" title="Klik om als juiste antwoord te markeren">
                                <input type="radio" name="quiz_questions[${index}][correct_answer]" value="4">
                                <span class="correct-dot"></span>
                            </label>
                            <div style="flex:1;">
                                <label>Antwoord 4 (optioneel)</label>
                                <input type="text" name="quiz_questions[${index}][option_4]" placeholder="Vierde optie (optioneel)" autocomplete="off">
                            </div>
                        </div>
                    </div>
                </div>
            `;
            container.insertAdjacentHTML('beforeend', html);
        }

        function updateFileList(input, targetListId = 'file-list', inputNamePrefix = 'new_media_caption') {
            const list = document.getElementById(targetListId);
            list.innerHTML = '';
            
            if (input.files.length > 0) {
                for (let i = 0; i < input.files.length; i++) {
                    const file = input.files[i];
                    const div = document.createElement('div');
                    div.style.marginBottom = '12px';
                    div.innerHTML = `
                        <div style="font-weight:500;margin-bottom:4px;">${file.name} (${(file.size/1024/1024).toFixed(2)} MB)</div>
                        <input type="text" name="${inputNamePrefix}[${i}]" placeholder="Bijschrift voor ${file.name}" style="width:100%;padding:8px;border:1px solid #e2e8f0;border-radius:6px;font-size:13px;">
                    `;
                    list.appendChild(div);
                }
            }
        }

        // Initialize on page load
        function switchMediaTab(tabName) {
            // Update tabs
            document.querySelectorAll('.media-tab').forEach(t => t.classList.remove('active'));
            document.querySelector(`.media-tab[data-tab="${tabName}"]`).classList.add('active');
            
            // Update content
            document.querySelectorAll('.media-content').forEach(c => c.classList.remove('active'));
            document.getElementById(`media-${tabName}`).classList.add('active');
        }

        document.addEventListener('DOMContentLoaded', function() {
            // toggleVideoUpload(); // Removed as we no longer use the checkbox
        });
    </script>
</body>

</html>
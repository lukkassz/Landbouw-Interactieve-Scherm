<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);
ini_set('upload_max_filesize', '100M');
ini_set('post_max_size', '100M');
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
    $puzzle_image_url = $event['puzzle_image_url'] ?? '';

    // For harvest game, we don't need has_puzzle or puzzle_image_url
    if ($gameType === 'harvest') {
        $has_puzzle = 0;
        $puzzle_image_url = '';
    }

    // Handle puzzle image upload
    if ($gameType === 'puzzle' && isset($_FILES['puzzle_image']) && $_FILES['puzzle_image']['error'] === UPLOAD_ERR_OK) {
        $uploadDir = __DIR__ . '/uploads/';
        if (!file_exists($uploadDir)) mkdir($uploadDir, 0755, true);

        $fileName = time() . '_' . preg_replace('/[^a-zA-Z0-9._-]/', '', $_FILES['puzzle_image']['name']);
        $targetPath = $uploadDir . $fileName;

        if (move_uploaded_file($_FILES['puzzle_image']['tmp_name'], $targetPath)) {
            $puzzle_image_url = $fileName;
        }
    }

    if ($gameType !== 'puzzle') {
        $puzzle_image_url = '';
    }

    // Validation
    if (empty($year) || empty($title) || empty($description)) {
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
                // Debug logging
                error_log("Quiz game type detected");
                error_log("Quiz difficulty: " . print_r($_POST['quiz_difficulty'] ?? 'NOT SET', true));
                error_log("Quiz questions: " . print_r($_POST['quiz_questions'] ?? 'NOT SET', true));
                
                mysqli_query($conn, "DELETE FROM quiz_questions WHERE event_id = $currentEventId");
                $quizDifficulty = mysqli_real_escape_string($conn, $_POST['quiz_difficulty'] ?? 'easy');
                if (isset($_POST['quiz_questions']) && is_array($_POST['quiz_questions'])) {
                    foreach ($_POST['quiz_questions'] as $index => $question) {
                        error_log("Processing question $index: " . print_r($question, true));
                        if (!empty($question['question']) && !empty($question['image_url']) && !empty($question['correct_answer'])) {
                            $qQuestion = mysqli_real_escape_string($conn, $question['question']);
                            $qImageUrl = mysqli_real_escape_string($conn, $question['image_url']);
                            $qOption1 = mysqli_real_escape_string($conn, $question['option_1'] ?? '');
                            $qOption2 = mysqli_real_escape_string($conn, $question['option_2'] ?? '');
                            $qOption3 = mysqli_real_escape_string($conn, $question['option_3'] ?? '');
                            $qOption4 = mysqli_real_escape_string($conn, $question['option_4'] ?? '');

                            // Determine correct answer based on selection
                            $correctAnswerIndex = intval($question['correct_answer']);
                            $correctAnswerText = '';
                            switch ($correctAnswerIndex) {
                                case 1:
                                    $correctAnswerText = $qOption1;
                                    break;
                                case 2:
                                    $correctAnswerText = $qOption2;
                                    break;
                                case 3:
                                    $correctAnswerText = $qOption3;
                                    break;
                                case 4:
                                    $correctAnswerText = $qOption4;
                                    break;
                            }

                            if (!empty($correctAnswerText)) {
                                $insertQuery = "INSERT INTO quiz_questions (event_id, question, image_url, correct_answer, option_1, option_2, option_3, option_4, difficulty) 
                                    VALUES ($currentEventId, '$qQuestion', '$qImageUrl', '$correctAnswerText', '$qOption1', '$qOption2', '$qOption3', " . ($qOption4 ? "'$qOption4'" : "NULL") . ", '$quizDifficulty')";
                                error_log("Executing insert: " . $insertQuery);
                                $result = mysqli_query($conn, $insertQuery);
                                if (!$result) {
                                    error_log("MySQL Error: " . mysqli_error($conn));
                                } else {
                                    error_log("Question saved successfully!");
                                }
                            } else {
                                error_log("Skipped question - empty correct answer");
                            }
                        }
                    }
                } else {
                    error_log("No quiz_questions array found in POST");
                }
            }

            // Handle media uploads
            if (isset($_FILES['new_media']) && is_array($_FILES['new_media']['name'])) {
                $mediaDir = __DIR__ . '/uploads/event_media/';
                if (!file_exists($mediaDir)) mkdir($mediaDir, 0755, true);

                foreach ($_FILES['new_media']['name'] as $idx => $fileName) {
                    if ($_FILES['new_media']['error'][$idx] === UPLOAD_ERR_OK && !empty($fileName)) {
                        $fileType = $_FILES['new_media']['type'][$idx];
                        $cleanName = time() . '_' . $idx . '_' . preg_replace('/[^a-zA-Z0-9._-]/', '', $fileName);
                        $targetPath = $mediaDir . $cleanName;

                        if (move_uploaded_file($_FILES['new_media']['tmp_name'][$idx], $targetPath)) {
                            $mediaType = (strpos($fileType, 'video') !== false) ? 'video' : 'image';
                            $caption = mysqli_real_escape_string($conn, $_POST['new_media_caption'][$idx] ?? '');
                            mysqli_query($conn, "INSERT INTO event_media (event_id, media_type, file_url, caption, display_order) VALUES ($currentEventId, '$mediaType', '$cleanName', '$caption', 999)");
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

            // Update media captions
            if (isset($_POST['media_caption']) && is_array($_POST['media_caption'])) {
                foreach ($_POST['media_caption'] as $mediaId => $caption) {
                    $caption = mysqli_real_escape_string($conn, $caption);
                    mysqli_query($conn, "UPDATE event_media SET caption = '$caption' WHERE id = " . intval($mediaId));
                }
            }

            header("Location: index.php?success=Event succesvol opgeslagen");
            exit;
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

        <!-- Basic Info -->
        <div class="card">
            <div class="card-header">
                <h2>📝 Basis informatie</h2>
            </div>
            <div class="card-body">
                <div class="form-row">
                    <div class="form-group">
                        <label>Jaar <span class="required">*</span> <span class="hint">(bijv. 1950 of 1900-1910)</span></label>
                        <input type="text" name="year" value="<?= htmlspecialchars($event['year']) ?>" required pattern="^\d{4}(-\d{4})?$">
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
                    <input type="text" name="title" value="<?= htmlspecialchars($event['title']) ?>" required>
                </div>

                <div class="form-group">
                    <label>Beschrijving <span class="required">*</span></label>
                    <textarea name="description" required><?= htmlspecialchars($event['description']) ?></textarea>
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
                <h2>🖼️ Media (foto's & video's)</h2>
            </div>
            <div class="card-body">
                <?php if (!empty($eventMedia)): ?>
                    <div class="media-grid">
                        <?php foreach ($eventMedia as $media): ?>
                            <div class="media-item">
                                <?php if ($media['media_type'] === 'video'): ?>
                                    <video src="uploads/event_media/<?= htmlspecialchars($media['file_url']) ?>"></video>
                                    <div class="media-placeholder" style="position:absolute;inset:0;display:flex;">🎬</div>
                                <?php else: ?>
                                    <img src="uploads/event_media/<?= htmlspecialchars($media['file_url']) ?>" alt="">
                                <?php endif; ?>
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

                <div class="upload-area" onclick="document.getElementById('media-upload').click()">
                    <input type="file" id="media-upload" name="new_media[]" multiple accept="image/*,video/*" onchange="updateFileList(this)">
                    <div class="icon">📁</div>
                    <div class="text">Klik om bestanden te uploaden<br><small>Foto's (JPG, PNG) of Video's (MP4)</small></div>
                </div>
                <div id="file-list" style="margin-top:12px;font-size:13px;color:#64748b;"></div>
                <div id="caption-inputs"></div>
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
                    <label>Upload puzzel afbeelding</label>
                    <input type="file" name="puzzle_image" accept="image/*" style="margin-top:8px;">

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
                    ?>
                    
                    <!-- Debug info -->
                    <div style="background:#fff3cd;padding:12px;border-radius:8px;margin-bottom:16px;border:1px solid #ffc107;">
                        <strong>Debug Info:</strong><br>
                        - Gevonden vragen: <?= count($quizQuestions) ?><br>
                        - Huidige niveau: <?= !empty($currentQuizDifficulty) ? $currentQuizDifficulty : 'NIET INGESTELD' ?><br>
                        - Game type: <?= $gameType ?><br>
                        - Event ID: <?= $eventId ?? 'nieuw' ?>
                    </div>
                    
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
                            <?php foreach ($quizQuestions as $idx => $question):
                            ?>
                                <div class="repeater-item quiz-item">
                                    <button type="button" class="remove-btn" onclick="this.parentElement.remove()">Verwijderen</button>
                                    <input type="hidden" name="quiz_questions[<?= $idx ?>][id]" value="<?= htmlspecialchars($question['id']) ?>">

                                    <div class="form-group">
                                        <label>Vraag</label>
                                        <input type="text" name="quiz_questions[<?= $idx ?>][question]" value="<?= htmlspecialchars($question['question']) ?>" placeholder="Waarvoor werd dit werktuig gebruikt?">
                                    </div>

                                    <div class="form-group">
                                        <label>Afbeelding URL</label>
                                        <input type="text" name="quiz_questions[<?= $idx ?>][image_url]" value="<?= htmlspecialchars($question['image_url']) ?>" placeholder="https://...">
                                        <small style="color:#64748b;display:block;margin-top:4px;">Direct link naar afbeelding of upload via media library</small>
                                    </div>

                                    <div class="form-row">
                                        <div class="form-group" style="flex:1;">
                                            <label>Antwoord 1</label>
                                            <input type="text" name="quiz_questions[<?= $idx ?>][option_1]" value="<?= htmlspecialchars($question['option_1']) ?>" placeholder="Eerste optie">
                                        </div>
                                        <div class="form-group" style="flex:1;">
                                            <label>Antwoord 2</label>
                                            <input type="text" name="quiz_questions[<?= $idx ?>][option_2]" value="<?= htmlspecialchars($question['option_2']) ?>" placeholder="Tweede optie">
                                        </div>
                                    </div>

                                    <div class="form-row">
                                        <div class="form-group" style="flex:1;">
                                            <label>Antwoord 3</label>
                                            <input type="text" name="quiz_questions[<?= $idx ?>][option_3]" value="<?= htmlspecialchars($question['option_3']) ?>" placeholder="Derde optie">
                                        </div>
                                        <div class="form-group" style="flex:1;">
                                            <label>Antwoord 4 (optioneel)</label>
                                            <input type="text" name="quiz_questions[<?= $idx ?>][option_4]" value="<?= htmlspecialchars($question['option_4']) ?>" placeholder="Vierde optie (optioneel)">
                                        </div>
                                    </div>

                                    <div class="form-group">
                                        <label>Juiste antwoord</label>
                                        <select name="quiz_questions[<?= $idx ?>][correct_answer]" required>
                                            <option value="">Kies het juiste antwoord</option>
                                            <option value="1" <?= $question['correct_answer'] === $question['option_1'] ? 'selected' : '' ?>>Antwoord 1</option>
                                            <option value="2" <?= $question['correct_answer'] === $question['option_2'] ? 'selected' : '' ?>>Antwoord 2</option>
                                            <option value="3" <?= $question['correct_answer'] === $question['option_3'] ? 'selected' : '' ?>>Antwoord 3</option>
                                            <option value="4" <?= !empty($question['option_4']) && $question['correct_answer'] === $question['option_4'] ? 'selected' : '' ?>>Antwoord 4</option>
                                        </select>
                                    </div>
                                </div>
                            <?php endforeach; ?>
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
            quizForm.style.display = selectedDifficulty ? 'block' : 'none';
        }

        // Initialize quiz form visibility on page load
        document.addEventListener('DOMContentLoaded', function() {
            toggleQuizForm();
        });

        function addQuizQuestion() {
            const container = document.getElementById('quiz-container');
            const index = container.children.length;
            const html = `
                <div class="repeater-item quiz-item">
                    <button type="button" class="remove-btn" onclick="this.parentElement.remove()">Verwijderen</button>
                    <input type="hidden" name="quiz_questions[${index}][id]" value="">
                    
                    <div class="form-group">
                        <label>Vraag</label>
                        <input type="text" name="quiz_questions[${index}][question]" placeholder="Waarvoor werd dit werktuig gebruikt?">
                    </div>

                    <div class="form-group">
                        <label>Afbeelding URL</label>
                        <input type="text" name="quiz_questions[${index}][image_url]" placeholder="https://...">
                        <small style="color:#64748b;display:block;margin-top:4px;">Direct link naar afbeelding of upload via media library</small>
                    </div>

                    <div class="form-row">
                        <div class="form-group" style="flex:1;">
                            <label>Antwoord 1</label>
                            <input type="text" name="quiz_questions[${index}][option_1]" placeholder="Eerste optie">
                        </div>
                        <div class="form-group" style="flex:1;">
                            <label>Antwoord 2</label>
                            <input type="text" name="quiz_questions[${index}][option_2]" placeholder="Tweede optie">
                        </div>
                    </div>

                    <div class="form-row">
                        <div class="form-group" style="flex:1;">
                            <label>Antwoord 3</label>
                            <input type="text" name="quiz_questions[${index}][option_3]" placeholder="Derde optie">
                        </div>
                        <div class="form-group" style="flex:1;">
                            <label>Antwoord 4 (optioneel)</label>
                            <input type="text" name="quiz_questions[${index}][option_4]" placeholder="Vierde optie (optioneel)">
                        </div>
                    </div>

                    <div class="form-group">
                        <label>Juiste antwoord</label>
                        <select name="quiz_questions[${index}][correct_answer]" required>
                            <option value="">Kies het juiste antwoord</option>
                            <option value="1">Antwoord 1</option>
                            <option value="2">Antwoord 2</option>
                            <option value="3">Antwoord 3</option>
                            <option value="4">Antwoord 4</option>
                        </select>
                    </div>
                </div>
            `;
            container.insertAdjacentHTML('beforeend', html);
        }

        function updateFileList(input) {
            const fileList = document.getElementById('file-list');
            const captionInputs = document.getElementById('caption-inputs');

            if (input.files.length > 0) {
                let html = '<strong>Geselecteerde bestanden:</strong><br>';
                let captionHtml = '';

                for (let i = 0; i < input.files.length; i++) {
                    html += `• ${input.files[i].name}<br>`;
                    captionHtml += `
                        <div class="form-group" style="margin-top:8px;">
                            <label>Bijschrift voor ${input.files[i].name}</label>
                            <input type="text" name="new_media_caption[]" placeholder="Optioneel bijschrift">
                        </div>
                    `;
                }

                fileList.innerHTML = html;
                captionInputs.innerHTML = captionHtml;
            } else {
                fileList.innerHTML = '';
                captionInputs.innerHTML = '';
            }
        }
    </script>
</body>

</html>
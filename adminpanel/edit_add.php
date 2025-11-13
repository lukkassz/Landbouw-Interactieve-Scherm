<?php
// Enable error reporting for debugging (remove in production)
error_reporting(E_ALL);
ini_set('display_errors', 0); // Don't display errors to users, but log them
ini_set('log_errors', 1);


include 'includes/db.php';
include 'includes/auth.php';
include 'includes/functions.php';

// Check if we are editing
$isEdit = isset($_GET['id']);
    $event = [
        'jaar' => '',
        'titel' => '',
        'text' => '',
        'icon' => '🌾',
        'gradient' => '',
        'museum_gradient' => '',
        'stage' => '1',
        'puzzle' => 0,
        'puzzle_image' => '',
        'detailed_modal' => 0,
        'context' => '',
        'volgorde' => '1',
        'actief' => 1,
        'category' => 'museum',
        'has_key_moments' => 0
    ];

// Get event sections (only when editing)
$eventSections = [];
if ($isEdit) {
    $id = intval($_GET['id']);
    $result = mysqli_query($conn, "SELECT * FROM timeline_events WHERE id = $id");
    if ($result && mysqli_num_rows($result) > 0) {
        $event = mysqli_fetch_assoc($result);
        // Map database columns to form fields
        // Extract first year from range if exists (for backwards compatibility)
        $yearValue = $event['year'];
        if (preg_match('/^(\d{4})/', $yearValue, $matches)) {
            $yearValue = $matches[1]; // Take first 4-digit year
        }
        $event['jaar'] = $yearValue;
        $event['titel'] = $event['title'];
        $event['text'] = $event['description'];
        $event['puzzle'] = $event['has_puzzle'];
        $event['puzzle_image'] = $event['puzzle_image_url'] ?? '';
        $event['detailed_modal'] = $event['use_detailed_modal'];
        $event['context'] = $event['historical_context'] ?? '';
        $event['volgorde'] = $event['sort_order'];
        $event['actief'] = $event['is_active'];
        $event['category'] = $event['category'] ?? 'museum';
        $event['has_key_moments'] = $event['has_key_moments'] ?? 0;

        // Get event sections
        $sectionsResult = mysqli_query($conn, "SELECT * FROM event_sections WHERE event_id = $id ORDER BY section_order ASC");
        if ($sectionsResult) {
            while ($section = mysqli_fetch_assoc($sectionsResult)) {
                $eventSections[] = $section;
            }
        }

        // Get event media (photos)
        $eventMedia = [];
        $mediaResult = mysqli_query($conn, "SELECT * FROM event_media WHERE event_id = $id ORDER BY display_order ASC");
        if ($mediaResult) {
            while ($media = mysqli_fetch_assoc($mediaResult)) {
                $eventMedia[] = $media;
            }
        }

        // Get event key moments
        $eventKeyMoments = [];
        $keyMomentsResult = mysqli_query($conn, "SELECT * FROM event_key_moments WHERE event_id = $id ORDER BY display_order ASC, year ASC");
        if ($keyMomentsResult) {
            while ($moment = mysqli_fetch_assoc($keyMomentsResult)) {
                $eventKeyMoments[] = $moment;
            }
        }
    }
}

// Process form submission
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $jaar = mysqli_real_escape_string($conn, $_POST['jaar']);
    $titel = mysqli_real_escape_string($conn, $_POST['titel']);
    $text = mysqli_real_escape_string($conn, $_POST['text']);
    $icon = mysqli_real_escape_string($conn, $_POST['icon']);
    $gradient = mysqli_real_escape_string($conn, $_POST['gradient']);
    $museum_gradient = mysqli_real_escape_string($conn, $_POST['museum_gradient']);
    $stage = intval($_POST['stage']);
    $puzzle = isset($_POST['puzzle']) ? 1 : 0;
    $detailed_modal = isset($_POST['detailed_modal']) ? 1 : 0;
    $context = mysqli_real_escape_string($conn, $_POST['context']);
    $volgorde = intval($_POST['volgorde']);
    $actief = isset($_POST['actief']) ? 1 : 0;
    $category = mysqli_real_escape_string($conn, $_POST['category'] ?? 'museum');
    $has_key_moments = isset($_POST['has_key_moments']) ? 1 : 0;

    // Upload puzzle image
    $puzzle_image = $event['puzzle_image'];
    if (isset($_FILES['puzzle_image']) && $_FILES['puzzle_image']['error'] === 0) {
        $uploadDir = 'uploads/';
        if (!file_exists($uploadDir)) mkdir($uploadDir);
        $fileName = time() . '_' . basename($_FILES['puzzle_image']['name']);
        $targetPath = $uploadDir . $fileName;
        move_uploaded_file($_FILES['puzzle_image']['tmp_name'], $targetPath);
        $puzzle_image = $fileName;
    }

    // Validate year format (must be 4 digits, between 1820-2025)
    $jaar = trim($jaar);
    if (!preg_match('/^\d{4}$/', $jaar) || intval($jaar) < 1820 || intval($jaar) > 2025) {
        $error = "Jaar moet een 4-cijferig getal zijn tussen 1820 en 2025 (bijv. 1950)";
    }

    // Validate required fields
    if (empty($error) && $jaar && $titel && $text && $volgorde) {
        if ($isEdit) {
            // Update existing event (table: timeline_events)
            $query = "UPDATE timeline_events SET 
                year='$jaar', title='$titel', description='$text',
                icon='$icon', gradient='$gradient', museum_gradient='$museum_gradient',
                stage='$stage', has_puzzle='$puzzle', puzzle_image_url='$puzzle_image',
                use_detailed_modal='$detailed_modal', historical_context='$context',
                sort_order='$volgorde', is_active='$actief', category='$category',
                has_key_moments='$has_key_moments'
                WHERE id=$id";
        } else {
            // Add new event (table: timeline_events)
            $query = "INSERT INTO timeline_events (year, title, description, icon, gradient, museum_gradient, stage, has_puzzle, puzzle_image_url, use_detailed_modal, historical_context, sort_order, is_active, category, has_key_moments)
                VALUES ('$jaar','$titel','$text','$icon','$gradient','$museum_gradient','$stage','$puzzle','$puzzle_image','$detailed_modal','$context','$volgorde','$actief','$category','$has_key_moments')";
        }

        if (mysqli_query($conn, $query)) {
            // Get the event ID (new or existing)
            $eventId = $isEdit ? $id : mysqli_insert_id($conn);

            // Process event sections (only if they are filled in)
            if (isset($_POST['sections']) && is_array($_POST['sections'])) {
                // First remove all existing sections for this event
                mysqli_query($conn, "DELETE FROM event_sections WHERE event_id = $eventId");

                // Add new sections
                foreach ($_POST['sections'] as $index => $section) {
                    if (!empty($section['title']) && !empty($section['content'])) {
                        $sectionTitle = mysqli_real_escape_string($conn, $section['title']);
                        $sectionContent = mysqli_real_escape_string($conn, $section['content']);
                        $sectionOrder = intval($section['order']) ?: ($index + 1);

                        $sectionQuery = "INSERT INTO event_sections (event_id, section_title, section_content, section_order) 
                                        VALUES ($eventId, '$sectionTitle', '$sectionContent', $sectionOrder)";
                        mysqli_query($conn, $sectionQuery);
                    }
                }
            }

            // Process event key moments (only if has_key_moments is enabled)
            if ($has_key_moments && isset($_POST['key_moments']) && is_array($_POST['key_moments'])) {
                // First remove all existing key moments for this event
                mysqli_query($conn, "DELETE FROM event_key_moments WHERE event_id = $eventId");

                // Add new key moments (max 5)
                $momentCount = 0;
                foreach ($_POST['key_moments'] as $index => $moment) {
                    if ($momentCount >= 5) break; // Max 5 moments
                    
                    if (!empty($moment['year']) && !empty($moment['title'])) {
                        $momentYear = intval($moment['year']);
                        $momentTitle = mysqli_real_escape_string($conn, $moment['title']);
                        $momentShortDesc = mysqli_real_escape_string($conn, $moment['short_description'] ?? '');
                        $momentFullDesc = mysqli_real_escape_string($conn, $moment['full_description'] ?? '');
                        $momentOrder = intval($moment['order']) ?: ($index + 1);

                        $momentQuery = "INSERT INTO event_key_moments (event_id, year, title, short_description, full_description, display_order) 
                                       VALUES ($eventId, $momentYear, '$momentTitle', '$momentShortDesc', '$momentFullDesc', $momentOrder)";
                        mysqli_query($conn, $momentQuery);
                        $momentCount++;
                    }
                }
            } else {
                // If has_key_moments is disabled, remove all key moments
                mysqli_query($conn, "DELETE FROM event_key_moments WHERE event_id = $eventId");
            }

            // Process event media uploads (max 5 photos)
            $uploadDir = 'uploads/event_media/';
            if (!file_exists($uploadDir)) {
                mkdir($uploadDir, 0777, true);
            }

            // Remove media that are marked for deletion
            if (isset($_POST['delete_media']) && is_array($_POST['delete_media'])) {
                foreach ($_POST['delete_media'] as $mediaId) {
                    $mediaId = intval($mediaId);
                    $mediaQuery = mysqli_query($conn, "SELECT file_url FROM event_media WHERE id = $mediaId AND event_id = $eventId");
                    if ($mediaRow = mysqli_fetch_assoc($mediaQuery)) {
                        $filePath = $uploadDir . $mediaRow['file_url'];
                        if (file_exists($filePath)) {
                            unlink($filePath);
                        }
                    }
                    mysqli_query($conn, "DELETE FROM event_media WHERE id = $mediaId AND event_id = $eventId");
                }
            }

            // Update captions for existing media
            if (isset($_POST['update_media_caption']) && is_array($_POST['update_media_caption'])) {
                foreach ($_POST['update_media_caption'] as $mediaId => $caption) {
                    $mediaId = intval($mediaId);
                    $caption = mysqli_real_escape_string($conn, $caption);
                    mysqli_query($conn, "UPDATE event_media SET caption = '$caption' WHERE id = $mediaId AND event_id = $eventId");
                }
            }

            // Upload new media files
            if (isset($_FILES['event_media']) && is_array($_FILES['event_media']['name'])) {
                $remainingMediaQuery = mysqli_query($conn, "SELECT COUNT(*) as count FROM event_media WHERE event_id = $eventId");
                $remainingMediaRow = mysqli_fetch_assoc($remainingMediaQuery);
                $existingMediaCount = intval($remainingMediaRow['count']);
                $maxMedia = 5;

                $uploadErrors = [];
                $uploadSuccess = [];

                foreach ($_FILES['event_media']['name'] as $index => $fileName) {
                    if ($existingMediaCount >= $maxMedia) {
                        $uploadErrors[] = "Maximum aantal foto's (5) bereikt";
                        break;
                    }

                    $fileError = $_FILES['event_media']['error'][$index];
                    if ($fileError === 0) {
                        $fileExtension = strtolower(pathinfo($fileName, PATHINFO_EXTENSION));
                        $allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];

                        if (in_array($fileExtension, $allowedExtensions)) {
                            $newFileName = time() . '_' . $index . '_' . basename($fileName);
                            $targetPath = $uploadDir . $newFileName;

                            if (move_uploaded_file($_FILES['event_media']['tmp_name'][$index], $targetPath)) {
                                $caption = isset($_POST['media_caption'][$index]) ? mysqli_real_escape_string($conn, $_POST['media_caption'][$index]) : '';
                                $displayOrder = $existingMediaCount + 1;

                                $newFileNameEscaped = mysqli_real_escape_string($conn, $newFileName);
                                $captionEscaped = mysqli_real_escape_string($conn, $caption);

                                // Check if media_type column is ENUM - if so, use 'photo' instead of 'image'
                                $columnCheck = mysqli_query($conn, "SHOW COLUMNS FROM event_media WHERE Field = 'media_type'");
                                $columnInfo = mysqli_fetch_assoc($columnCheck);
                                $mediaTypeValue = 'image';

                                if ($columnInfo && stripos($columnInfo['Type'], 'enum') !== false) {
                                    if (stripos($columnInfo['Type'], 'photo') !== false) {
                                        $mediaTypeValue = 'photo';
                                    }
                                }

                                $mediaQuery = "INSERT INTO event_media (event_id, media_type, file_url, caption, display_order) 
                                              VALUES ($eventId, '$mediaTypeValue', '$newFileNameEscaped', '$captionEscaped', $displayOrder)";

                                if (mysqli_query($conn, $mediaQuery)) {
                                    $uploadSuccess[] = $fileName;
                                    $existingMediaCount++;
                                } else {
                                    $uploadErrors[] = "Database error voor $fileName: " . mysqli_error($conn);
                                    if (file_exists($targetPath)) {
                                        @unlink($targetPath);
                                    }
                                }
                            } else {
                                $uploadErrors[] = "Upload mislukt voor $fileName";
                            }
                        } else {
                            $uploadErrors[] = "Bestandstype niet toegestaan voor $fileName";
                        }
                    } else {
                        $uploadErrors[] = "Upload error voor $fileName (error code: $fileError)";
                    }
                }

                if (!empty($uploadErrors)) {
                    $error = ($error ?? '') . " " . implode("; ", $uploadErrors);
                }
            }

            // Redirect with success message
            if (!headers_sent()) {
                header("Location: index.php");
                exit;
            }
        } else {
            $error = "Databasefout: " . mysqli_error($conn);
        }
    } else {
        $error = "Vul alle verplichte velden in.";
    }
}
?>
<!DOCTYPE html>
<html lang="nl">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?= $isEdit ? 'Event Bewerken' : 'Nieuw Event Toevoegen' ?></title>
    <link rel="stylesheet" href="style.css">
    <style>
        /* Extra layout for form cards */
        .form-section {
            background: linear-gradient(135deg, #fff 0%, #f8f9fa 100%);
            border-radius: 16px;
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
            padding: 28px;
            flex: 1;
            min-width: 300px;
            border-left: 4px solid #440f0f;
            transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .form-section:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(0, 0, 0, 0.12);
        }

        .form-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(380px, 1fr));
            gap: 24px;
            margin-top: 30px;
        }

        .form-section h3 {
            margin-top: 0;
            margin-bottom: 20px;
            font-size: 20px;
            display: flex;
            align-items: center;
            gap: 10px;
            color: #440f0f;
            font-weight: 600;
            padding-bottom: 12px;
            border-bottom: 2px solid #f0f2f5;
        }

        .form-section label {
            display: block;
            margin-bottom: 8px;
            font-weight: 600;
            color: #333;
            font-size: 14px;
        }

        .form-section label[for] {
            margin-top: 16px;
        }

        input[type="text"],
        input[type="number"],
        textarea,
        select {
            width: 100%;
            padding: 12px 16px;
            margin-top: 5px;
            border: 2px solid #e5e7eb;
            border-radius: 10px;
            font-size: 14px;
            transition: border-color 0.3s ease, box-shadow 0.3s ease;
            background: white;
        }

        input[type="text"]:focus,
        input[type="number"]:focus,
        textarea:focus,
        select:focus {
            outline: none;
            border-color: #440f0f;
            box-shadow: 0 0 0 3px rgba(68, 15, 15, 0.1);
        }

        textarea {
            resize: vertical;
            min-height: 100px;
            font-family: inherit;
        }

        .checkbox-group {
            display: flex;
            align-items: center;
            gap: 10px;
            margin-top: 12px;
            padding: 12px;
            background: #f9fafb;
            border-radius: 10px;
            border: 2px solid #e5e7eb;
        }

        .checkbox-group input[type="checkbox"] {
            width: 20px;
            height: 20px;
            cursor: pointer;
            accent-color: #440f0f;
        }

        .checkbox-group label {
            margin: 0;
            cursor: pointer;
            font-weight: 500;
        }

        .form-actions {
            margin-top: 40px;
            padding-top: 30px;
            border-top: 2px solid #f0f2f5;
            display: flex;
            justify-content: flex-end;
            gap: 12px;
        }

        .btn-secondary {
            background-color: #657575;
            color: white;
            padding: 12px 24px;
            border-radius: 10px;
            font-weight: 500;
        }

        .btn-secondary:hover {
            background-color: #546464;
        }

        .file-drop {
            border: 2px dashed #c9a300;
            border-radius: 12px;
            padding: 30px;
            text-align: center;
            font-size: 14px;
            color: #666;
            background: #fffbf0;
            transition: all 0.3s ease;
            cursor: pointer;
        }

        .file-drop:hover {
            border-color: #440f0f;
            background: #fff8e7;
        }

        .file-drop label {
            cursor: pointer;
            color: #440f0f;
            font-weight: 500;
        }

        small {
            display: block;
            margin-top: 6px;
            color: #666;
            font-size: 12px;
            font-style: italic;
        }
    </style>
</head>

<body>
    <div class="dashboard-container">
        <div class="header">
            <h1><?= $isEdit ? '✏️ Event Bewerken' : '➕ Nieuw Event Toevoegen' ?></h1>
            <a href="index.php" class="btn btn-secondary">
                <i class="fa-solid fa-arrow-left"></i> Terug naar Dashboard
            </a>
        </div>
        <?php if (!empty($error)): ?>
            <div class="error"><?= htmlspecialchars($error) ?></div>
        <?php endif; ?>

        <form method="POST" enctype="multipart/form-data">
            <div class="form-grid">
                <!-- Basis Info -->
                <div class="form-section">
                    <h3>📘 Basis Info</h3>
                    <label>Jaar*</label>
                    <input type="number" name="jaar" value="<?= htmlspecialchars($event['jaar']) ?>" min="1820" max="2025" step="1" placeholder="np. 1950" required style="width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 6px;">
                    <small style="color: #666; display: block; margin-top: 5px;">Voer een enkel jaar in (bijv. 1950), geen bereik</small>

                    <label>Titel*</label>
                    <input type="text" name="titel" value="<?= htmlspecialchars($event['titel']) ?>" required>

                    <label>Beschrijving*</label>
                    <textarea name="text" required><?= htmlspecialchars($event['text']) ?></textarea>
                </div>

                <!-- Categorie -->
                <div class="form-section">
                    <h3>📂 Categorie</h3>
                    <label>Categorie*</label>
                    <select name="category" required>
                        <option value="museum" <?= ($event['category'] ?? 'museum') === 'museum' ? 'selected' : '' ?>>Museum</option>
                        <option value="landbouw" <?= ($event['category'] ?? 'museum') === 'landbouw' ? 'selected' : '' ?>>Landbouw</option>
                        <option value="maatschappelijk" <?= ($event['category'] ?? 'museum') === 'maatschappelijk' ? 'selected' : '' ?>>Maatschappelijk</option>
                    </select>
                    <small style="color: #666; display: block; margin-top: 5px;">Selecteer de categorie voor dit event</small>
                </div>

                <!-- Stage -->
                <div class="form-section">
                    <h3>📊 Stage</h3>
                    <label>Stage</label>
                    <select name="stage">
                        <?php for ($i = 1; $i <= 3; $i++): ?>
                            <option value="<?= $i ?>" <?= $event['stage'] == $i ? 'selected' : '' ?>><?= $i ?></option>
                        <?php endfor; ?>
                    </select>
                </div>

                <!-- Puzzle Game -->
                <div class="form-section">
                    <h3>🧩 Puzzle Game</h3>
                    <div class="checkbox-group">
                        <input type="checkbox" name="puzzle" <?= $event['puzzle'] ? 'checked' : '' ?>>
                        <label>Heeft puzzel?</label>
                    </div>

                    <label>Puzzel afbeelding upload</label>
                    <div class="file-drop">
                        <input type="file" name="puzzle_image" style="display:none;" id="fileUpload">
                        <label for="fileUpload" style="cursor:pointer;">Sleep bestand hierheen of klik om te uploaden</label>
                        <?php if (!empty($event['puzzle_image'])): ?>
                            <div style="margin-top:10px;">
                                <small>Huidig bestand: <?= htmlspecialchars($event['puzzle_image']) ?></small>
                            </div>
                        <?php endif; ?>
                    </div>
                </div>

                <!-- Geavanceerd -->
                <div class="form-section">
                    <h3>⚙️ Geavanceerd</h3>
                    <div class="checkbox-group">
                        <input type="checkbox" name="detailed_modal" <?= $event['detailed_modal'] ? 'checked' : '' ?>>
                        <label>Gebruik detailed modal?</label>
                    </div>

                    <div class="checkbox-group" style="margin-top: 16px;">
                        <input type="checkbox" name="has_key_moments" id="has_key_moments" <?= ($event['has_key_moments'] ?? 0) ? 'checked' : '' ?>>
                        <label for="has_key_moments">Heeft Belangrijke momenten?</label>
                    </div>
                    <small style="color: #666; display: block; margin-top: 5px;">Toon mini timeline met belangrijke momenten in detailed modal (max 5 momenten)</small>

                    <label>Historische context</label>
                    <textarea name="context"><?= htmlspecialchars($event['context']) ?></textarea>

                    <label>Volgorde*</label>
                    <input type="number" name="volgorde" value="<?= htmlspecialchars($event['volgorde']) ?>" required>

                    <div class="checkbox-group">
                        <input type="checkbox" name="actief" <?= $event['actief'] ? 'checked' : '' ?>>
                        <label>Actief?</label>
                    </div>
                </div>
            </div>

            <!-- Event Key Moments (alleen bij edit) -->
            <?php if ($isEdit && $id): ?>
                <div class="form-section" style="margin-top: 30px;">
                    <h3>⏱ Belangrijke Momenten (Mini Timeline)</h3>
                    <p style="color: #666; font-size: 14px; margin-bottom: 15px;">
                        Beheer de belangrijke momenten die worden weergegeven in de mini timeline in de detailed modal. Maximaal 5 momenten.
                    </p>
                    <div id="key-moments-container">
                        <?php if (!empty($eventKeyMoments)): ?>
                            <?php foreach ($eventKeyMoments as $index => $moment): ?>
                                <div class="moment-item" data-moment-index="<?= $index ?>" style="background: #f9f9f9; padding: 15px; border-radius: 8px; margin-bottom: 15px; border: 1px solid #ddd;">
                                    <div style="display: grid; grid-template-columns: 120px 1fr 100px auto; gap: 10px; margin-bottom: 15px; align-items: end;">
                                        <div>
                                            <label>Jaar*</label>
                                            <input type="number" name="key_moments[<?= $index ?>][year]" value="<?= htmlspecialchars($moment['year']) ?>" min="1000" max="9999" required style="width: 100%; padding: 8px 10px; border: 1px solid #ccc; border-radius: 6px;">
                                        </div>
                                        <div>
                                            <label>Titel*</label>
                                            <input type="text" name="key_moments[<?= $index ?>][title]" value="<?= htmlspecialchars($moment['title']) ?>" placeholder="Bijv. Opening Museum" required style="width: 100%; padding: 8px 10px; border: 1px solid #ccc; border-radius: 6px;">
                                        </div>
                                        <div>
                                            <label>Volgorde</label>
                                            <input type="number" name="key_moments[<?= $index ?>][order]" value="<?= htmlspecialchars($moment['display_order']) ?>" min="1" style="width: 100%; padding: 8px 10px; border: 1px solid #ccc; border-radius: 6px;">
                                        </div>
                                        <div style="display: flex; align-items: flex-end;">
                                            <button type="button" class="btn-remove-moment" style="background: #dc3545; color: white; border: none; padding: 8px 15px; border-radius: 6px; cursor: pointer;">Verwijderen</button>
                                        </div>
                                    </div>
                                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                                        <div>
                                            <label>Korte beschrijving</label>
                                            <input type="text" name="key_moments[<?= $index ?>][short_description]" value="<?= htmlspecialchars($moment['short_description'] ?? '') ?>" placeholder="Korte tekst voor timeline" style="width: 100%; padding: 8px 10px; border: 1px solid #ccc; border-radius: 6px;">
                                        </div>
                                        <div>
                                            <label>Volledige beschrijving</label>
                                            <textarea name="key_moments[<?= $index ?>][full_description]" rows="2" placeholder="Volledige tekst voor tooltip..." style="width: 100%; padding: 8px 10px; border: 1px solid #ccc; border-radius: 6px; resize: vertical;"><?= htmlspecialchars($moment['full_description'] ?? '') ?></textarea>
                                        </div>
                                    </div>
                                </div>
                            <?php endforeach; ?>
                        <?php else: ?>
                            <p style="color: #999; font-style: italic; padding: 20px; text-align: center; background: #f5f5f5; border-radius: 8px;">
                                Geen momenten toegevoegd. Klik op "+ Moment Toevoegen" om een moment toe te voegen.
                            </p>
                        <?php endif; ?>
                    </div>
                    <button type="button" id="add-moment-btn" style="margin-top: 15px; background: #28a745; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer;">+ Moment Toevoegen</button>
                    <small style="color: #666; display: block; margin-top: 5px;">Maximum 5 momenten per event</small>
                </div>
            <?php endif; ?>

            <!-- Event Media (alleen bij edit) -->
            <?php if ($isEdit && $id): ?>
                <div class="form-section" style="margin-top: 30px;">
                    <h3>📸 Event Media (Foto's)</h3>
                    <p style="color: #666; font-size: 14px; margin-bottom: 15px;">
                        Upload maximaal 5 foto's voor dit event. Deze worden weergegeven in de timeline modal.
                    </p>

                    <!-- Bestaande media -->
                    <?php if (!empty($eventMedia)): ?>
                        <div id="existing-media-container" style="margin-bottom: 20px;">
                            <?php foreach ($eventMedia as $media): ?>
                                <div class="media-item" data-media-id="<?= $media['id'] ?>" style="background: #f9f9f9; padding: 15px; border-radius: 8px; margin-bottom: 10px; border: 1px solid #ddd; display: flex; align-items: center; gap: 15px;">
                                    <div style="flex: 0 0 100px; height: 100px; overflow: hidden; border-radius: 6px;">
                                        <img src="uploads/event_media/<?= htmlspecialchars($media['file_url']) ?>" alt="Media" style="width: 100%; height: 100%; object-fit: cover;">
                                    </div>
                                    <div style="flex: 1;">
                                        <input type="text" name="update_media_caption[<?= $media['id'] ?>]" value="<?= htmlspecialchars($media['caption']) ?>" placeholder="Caption (optioneel)" style="width: 100%; padding: 8px 10px; border: 1px solid #ccc; border-radius: 6px; margin-bottom: 5px;">
                                        <small style="color: #666;"><?= htmlspecialchars($media['file_url']) ?></small>
                                    </div>
                                    <div>
                                        <button type="button" class="btn-remove-media" data-media-id="<?= $media['id'] ?>" style="background: #dc3545; color: white; border: none; padding: 8px 15px; border-radius: 6px; cursor: pointer;">Verwijderen</button>
                                    </div>
                                </div>
                            <?php endforeach; ?>
                        </div>
                    <?php endif; ?>

                    <!-- Nieuwe media upload -->
                    <?php
                    $currentMediaCount = isset($eventMedia) ? count($eventMedia) : 0;
                    $remainingSlots = 5 - $currentMediaCount;
                    ?>
                    <?php if ($remainingSlots > 0): ?>
                        <div id="new-media-container">
                            <label>Nieuwe foto's uploaden (<?= $remainingSlots ?> slots beschikbaar)</label>
                            <input type="file" name="event_media[]" id="event_media_upload" multiple accept="image/*" style="margin-top: 10px; padding: 10px; border: 1px solid #ccc; border-radius: 6px; width: 100%;">
                            <small style="color: #666; display: block; margin-top: 5px;">Selecteer maximaal <?= $remainingSlots ?> foto('s)</small>

                            <!-- Preview container -->
                            <div id="media-preview-container" style="margin-top: 15px; display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 10px;"></div>
                        </div>
                    <?php else: ?>
                        <p style="color: #dc3545; padding: 15px; background: #ffe6e6; border-radius: 6px;">
                            Maximum aantal foto's (5) bereikt. Verwijder eerst een foto om nieuwe toe te voegen.
                        </p>
                    <?php endif; ?>
                </div>
            <?php endif; ?>

            <!-- Event Sections (alleen bij edit) -->
            <?php if ($isEdit && $id): ?>
                <div class="form-section" style="margin-top: 30px;">
                    <h3>📄 Event Sections</h3>
                    <p style="color: #666; font-size: 14px; margin-bottom: 15px;">
                        Beheer de secties die worden weergegeven in de detailed modal voor dit event.
                    </p>
                    <div id="sections-container">
                        <?php if (!empty($eventSections)): ?>
                            <?php foreach ($eventSections as $index => $section): ?>
                                <div class="section-item" data-section-index="<?= $index ?>" style="background: #f9f9f9; padding: 15px; border-radius: 8px; margin-bottom: 15px; border: 1px solid #ddd;">
                                    <div style="display: flex; gap: 10px; margin-bottom: 15px;">
                                        <div style="flex: 1;">
                                            <label>Section Titel</label>
                                            <input type="text" name="sections[<?= $index ?>][title]" value="<?= htmlspecialchars($section['section_title']) ?>" placeholder="Bijv. Historische Context" style="width: 100%; padding: 8px 10px; border: 1px solid #ccc; border-radius: 6px;">
                                        </div>
                                        <div style="flex: 0 0 120px;">
                                            <label>Volgorde</label>
                                            <input type="number" name="sections[<?= $index ?>][order]" value="<?= htmlspecialchars($section['section_order']) ?>" min="1" style="width: 100%; padding: 8px 10px; border: 1px solid #ccc; border-radius: 6px;">
                                        </div>
                                        <div style="display: flex; align-items: flex-end;">
                                            <button type="button" class="btn-remove-section" style="background: #dc3545; color: white; border: none; padding: 8px 15px; border-radius: 6px; cursor: pointer;">Verwijderen</button>
                                        </div>
                                    </div>
                                    <div>
                                        <label>Section Content</label>
                                        <textarea name="sections[<?= $index ?>][content]" rows="4" placeholder="Inhoud van de sectie..." style="width: 100%; padding: 8px 10px; border: 1px solid #ccc; border-radius: 6px; resize: vertical;"><?= htmlspecialchars($section['section_content']) ?></textarea>
                                    </div>
                                </div>
                            <?php endforeach; ?>
                        <?php else: ?>
                            <p style="color: #999; font-style: italic; padding: 20px; text-align: center; background: #f5f5f5; border-radius: 8px;">
                                Geen sections toegevoegd. Klik op "+ Section Toevoegen" om een section toe te voegen.
                            </p>
                        <?php endif; ?>
                    </div>
                    <button type="button" id="add-section-btn" style="margin-top: 15px; background: #28a745; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer;">+ Section Toevoegen</button>
                </div>
            <?php endif; ?>

            <div class="form-actions">
                <a href="index.php" class="btn btn-secondary">Annuleren</a>
                <button type="submit" class="btn btn-primary">Opslaan</button>
            </div>
        </form>
    </div>

    <script>
        // Media management
        const maxMedia = 5;
        let currentMediaCount = <?= isset($eventMedia) ? count($eventMedia) : 0 ?>;

        // Remove media handler
        document.querySelectorAll('.btn-remove-media').forEach(btn => {
            btn.addEventListener('click', function() {
                const mediaId = this.getAttribute('data-media-id');
                const mediaItem = this.closest('.media-item');

                if (confirm('Weet je zeker dat je deze foto wilt verwijderen?')) {
                    // Create hidden input for deletion
                    const deleteInput = document.createElement('input');
                    deleteInput.type = 'hidden';
                    deleteInput.name = 'delete_media[]';
                    deleteInput.value = mediaId;
                    document.querySelector('form').appendChild(deleteInput);

                    // Remove from UI
                    mediaItem.remove();
                    currentMediaCount--;

                    // Update remaining slots
                    updateMediaSlots();
                }
            });
        });

        // Media upload preview
        const mediaUpload = document.getElementById('event_media_upload');
        const previewContainer = document.getElementById('media-preview-container');

        if (mediaUpload) {
            mediaUpload.addEventListener('change', function(e) {
                const files = Array.from(e.target.files);
                const remainingSlots = maxMedia - currentMediaCount;

                if (files.length > remainingSlots) {
                    alert(`Je kunt maximaal ${remainingSlots} foto('s) uploaden.`);
                    this.value = '';
                    previewContainer.innerHTML = '';
                    return;
                }

                previewContainer.innerHTML = '';
                files.forEach((file, index) => {
                    if (file.type.startsWith('image/')) {
                        const reader = new FileReader();
                        reader.onload = function(e) {
                            const previewDiv = document.createElement('div');
                            previewDiv.style.cssText = 'position: relative; border-radius: 6px; overflow: hidden;';
                            previewDiv.innerHTML = `
                                <img src="${e.target.result}" style="width: 100%; height: 150px; object-fit: cover; display: block;">
                                <input type="text" name="media_caption[]" placeholder="Caption (optioneel)" style="width: 100%; padding: 5px; margin-top: 5px; border: 1px solid #ccc; border-radius: 4px; font-size: 12px;">
                            `;
                            previewContainer.appendChild(previewDiv);
                        };
                        reader.readAsDataURL(file);
                    }
                });
            });
        }

        function updateMediaSlots() {
            const remainingSlots = maxMedia - currentMediaCount;
            const newMediaContainer = document.getElementById('new-media-container');
            if (newMediaContainer) {
                const label = newMediaContainer.querySelector('label');
                const small = newMediaContainer.querySelector('small');
                if (label) label.textContent = `Nieuwe foto's uploaden (${remainingSlots} slots beschikbaar)`;
                if (small) small.textContent = `Selecteer maximaal ${remainingSlots} foto('s)`;

                if (remainingSlots <= 0) {
                    newMediaContainer.style.display = 'none';
                } else {
                    newMediaContainer.style.display = 'block';
                }
            }
        }

        // Dynamic section management
        let sectionIndex = <?= count($eventSections) ?>;

        document.getElementById('add-section-btn')?.addEventListener('click', function() {
            const container = document.getElementById('sections-container');
            // Remove empty message if present
            const emptyMsg = container.querySelector('p[style*="color: #999"]');
            if (emptyMsg) emptyMsg.remove();

            const newSection = document.createElement('div');
            newSection.className = 'section-item';
            newSection.setAttribute('data-section-index', sectionIndex);

            newSection.style.cssText = 'background: #f9f9f9; padding: 15px; border-radius: 8px; margin-bottom: 15px; border: 1px solid #ddd;';
            newSection.innerHTML = `
                <div style="display: flex; gap: 10px; margin-bottom: 15px;">
                    <div style="flex: 1;">
                        <label>Section Titel</label>
                        <input type="text" name="sections[${sectionIndex}][title]" placeholder="Bijv. Historische Context" style="width: 100%; padding: 8px 10px; border: 1px solid #ccc; border-radius: 6px;">
                    </div>
                    <div style="flex: 0 0 120px;">
                        <label>Volgorde</label>
                        <input type="number" name="sections[${sectionIndex}][order]" value="${sectionIndex + 1}" min="1" style="width: 100%; padding: 8px 10px; border: 1px solid #ccc; border-radius: 6px;">
                    </div>
                    <div style="display: flex; align-items: flex-end;">
                        <button type="button" class="btn-remove-section" style="background: #dc3545; color: white; border: none; padding: 8px 15px; border-radius: 6px; cursor: pointer;">Verwijderen</button>
                    </div>
                </div>
                <div>
                    <label>Section Content</label>
                    <textarea name="sections[${sectionIndex}][content]" rows="4" placeholder="Inhoud van de sectie..." style="width: 100%; padding: 8px 10px; border: 1px solid #ccc; border-radius: 6px; resize: vertical;"></textarea>
                </div>
            `;

            container.appendChild(newSection);
            sectionIndex++;

            // Attach remove event to new button
            newSection.querySelector('.btn-remove-section').addEventListener('click', function() {
                newSection.remove();

                // If no sections left, show empty message
                const container = document.getElementById('sections-container');
                if (container.children.length === 0) {
                    container.innerHTML = '<p style="color: #999; font-style: italic; padding: 20px; text-align: center; background: #f5f5f5; border-radius: 8px;">Geen sections toegevoegd. Klik op "+ Section Toevoegen" om een section toe te voegen.</p>';
                }
            });
        });

        // Attach remove events to existing buttons
        document.querySelectorAll('.btn-remove-section').forEach(btn => {
            btn.addEventListener('click', function() {
                const item = this.closest('.section-item');
                item.remove();

                // If no sections left, show empty message
                const container = document.getElementById('sections-container');
                if (container.children.length === 0) {
                    container.innerHTML = '<p style="color: #999; font-style: italic; padding: 20px; text-align: center; background: #f5f5f5; border-radius: 8px;">Geen sections toegevoegd. Klik op "+ Section Toevoegen" om een section toe te voegen.</p>';
                }
            });
        });

        // Key Moments Management
        const hasKeyMomentsCheckbox = document.getElementById('has_key_moments');
        const keyMomentsContainer = document.getElementById('key-moments-container');
        let momentIndex = <?= isset($eventKeyMoments) ? count($eventKeyMoments) : 0 ?>;

        // Show/hide key moments section based on checkbox
        if (hasKeyMomentsCheckbox) {
            hasKeyMomentsCheckbox.addEventListener('change', function() {
                const keyMomentsSection = document.querySelector('.form-section h3')?.parentElement;
                // This will be handled by page reload after save, but we can add visual feedback
            });
        }

        // Add moment button
        document.getElementById('add-moment-btn')?.addEventListener('click', function() {
            const container = document.getElementById('key-moments-container');
            
            // Check max 5 moments
            const currentMoments = container.querySelectorAll('.moment-item').length;
            if (currentMoments >= 5) {
                alert('Maximum 5 momenten per event toegestaan.');
                return;
            }

            // Remove empty message if present
            const emptyMsg = container.querySelector('p[style*="color: #999"]');
            if (emptyMsg) emptyMsg.remove();

            const newMoment = document.createElement('div');
            newMoment.className = 'moment-item';
            newMoment.setAttribute('data-moment-index', momentIndex);

            newMoment.style.cssText = 'background: #f9f9f9; padding: 15px; border-radius: 8px; margin-bottom: 15px; border: 1px solid #ddd;';
            newMoment.innerHTML = `
                <div style="display: grid; grid-template-columns: 120px 1fr 100px auto; gap: 10px; margin-bottom: 15px; align-items: end;">
                    <div>
                        <label>Jaar*</label>
                        <input type="number" name="key_moments[${momentIndex}][year]" min="1000" max="9999" required style="width: 100%; padding: 8px 10px; border: 1px solid #ccc; border-radius: 6px;">
                    </div>
                    <div>
                        <label>Titel*</label>
                        <input type="text" name="key_moments[${momentIndex}][title]" placeholder="Bijv. Opening Museum" required style="width: 100%; padding: 8px 10px; border: 1px solid #ccc; border-radius: 6px;">
                    </div>
                    <div>
                        <label>Volgorde</label>
                        <input type="number" name="key_moments[${momentIndex}][order]" value="${momentIndex + 1}" min="1" style="width: 100%; padding: 8px 10px; border: 1px solid #ccc; border-radius: 6px;">
                    </div>
                    <div style="display: flex; align-items: flex-end;">
                        <button type="button" class="btn-remove-moment" style="background: #dc3545; color: white; border: none; padding: 8px 15px; border-radius: 6px; cursor: pointer;">Verwijderen</button>
                    </div>
                </div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                    <div>
                        <label>Korte beschrijving</label>
                        <input type="text" name="key_moments[${momentIndex}][short_description]" placeholder="Korte tekst voor timeline" style="width: 100%; padding: 8px 10px; border: 1px solid #ccc; border-radius: 6px;">
                    </div>
                    <div>
                        <label>Volledige beschrijving</label>
                        <textarea name="key_moments[${momentIndex}][full_description]" rows="2" placeholder="Volledige tekst voor tooltip..." style="width: 100%; padding: 8px 10px; border: 1px solid #ccc; border-radius: 6px; resize: vertical;"></textarea>
                    </div>
                </div>
            `;

            container.appendChild(newMoment);
            momentIndex++;

            // Attach remove event to new button
            newMoment.querySelector('.btn-remove-moment').addEventListener('click', function() {
                newMoment.remove();

                // If no moments left, show empty message
                const container = document.getElementById('key-moments-container');
                if (container.children.length === 0) {
                    container.innerHTML = '<p style="color: #999; font-style: italic; padding: 20px; text-align: center; background: #f5f5f5; border-radius: 8px;">Geen momenten toegevoegd. Klik op "+ Moment Toevoegen" om een moment toe te voegen.</p>';
                }
            });
        });

        // Attach remove events to existing moment buttons
        document.querySelectorAll('.btn-remove-moment').forEach(btn => {
            btn.addEventListener('click', function() {
                const item = this.closest('.moment-item');
                item.remove();

                // If no moments left, show empty message
                const container = document.getElementById('key-moments-container');
                if (container.children.length === 0) {
                    container.innerHTML = '<p style="color: #999; font-style: italic; padding: 20px; text-align: center; background: #f5f5f5; border-radius: 8px;">Geen momenten toegevoegd. Klik op "+ Moment Toevoegen" om een moment toe te voegen.</p>';
                }
            });
        });
    </script>
</body>

</html>
<?php
include 'includes/db.php';
include 'includes/auth.php';
include 'includes/functions.php';

// Handle delete request
if (isset($_GET['delete']) && is_numeric($_GET['delete'])) {
    $deleteId = intval($_GET['delete']);
    
    // Delete related data first
    mysqli_query($conn, "DELETE FROM event_media WHERE event_id = $deleteId");
    mysqli_query($conn, "DELETE FROM event_sections WHERE event_id = $deleteId");
    mysqli_query($conn, "DELETE FROM event_key_moments WHERE event_id = $deleteId");
    
    // Delete the event
    $deleteResult = mysqli_query($conn, "DELETE FROM timeline_events WHERE id = $deleteId");
    
    if ($deleteResult) {
        header("Location: index.php?success=Event succesvol verwijderd");
        exit;
    }
}

// Get category filter
$categoryFilter = isset($_GET['category']) ? mysqli_real_escape_string($conn, $_GET['category']) : 'all';

// Get statistics
$statsQuery = "SELECT 
    COUNT(*) as total,
    SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active,
    SUM(CASE WHEN category = 'museum' THEN 1 ELSE 0 END) as museum_count,
    SUM(CASE WHEN category = 'landbouw' THEN 1 ELSE 0 END) as landbouw_count,
    SUM(CASE WHEN category = 'maatschappelijk' THEN 1 ELSE 0 END) as maatschappelijk_count
FROM timeline_events";
$statsResult = mysqli_query($conn, $statsQuery);
$stats = mysqli_fetch_assoc($statsResult);

// Get events
$query = "SELECT * FROM timeline_events";
if ($categoryFilter !== 'all') {
    $query .= " WHERE category = '$categoryFilter'";
}
$query .= " ORDER BY year ASC";
$result = mysqli_query($conn, $query);
?>
<!DOCTYPE html>
<html lang="nl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin Panel - Fries Landbouwmuseum</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        
        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            background: #f8fafc;
            min-height: 100vh;
            color: #1e293b;
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
            font-size: 20px;
            font-weight: 700;
            color: #0f172a;
        }
        
        .header-actions {
            display: flex;
            gap: 12px;
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
        
        .btn-danger {
            background: #fee2e2;
            color: #dc2626;
        }
        
        .btn-danger:hover {
            background: #fecaca;
        }
        
        /* Main Container */
        .container {
            max-width: 1400px;
            margin: 0 auto;
            padding: 32px;
        }
        
        /* Alert */
        .alert {
            padding: 16px 20px;
            border-radius: 8px;
            margin-bottom: 24px;
            font-size: 14px;
            font-weight: 500;
        }
        
        .alert-success {
            background: #dcfce7;
            color: #166534;
            border: 1px solid #bbf7d0;
        }
        
        .alert-error {
            background: #fee2e2;
            color: #dc2626;
            border: 1px solid #fecaca;
        }
        
        /* Stats Grid */
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
            gap: 16px;
            margin-bottom: 32px;
        }
        
        .stat-card {
            background: white;
            border-radius: 12px;
            padding: 20px;
            border: 1px solid #e2e8f0;
        }
        
        .stat-value {
            font-size: 32px;
            font-weight: 700;
            color: #0f172a;
            line-height: 1;
        }
        
        .stat-label {
            font-size: 13px;
            color: #64748b;
            margin-top: 4px;
        }
        
        .stat-card.museum { border-left: 4px solid #a35514; }
        .stat-card.landbouw { border-left: 4px solid #22c55e; }
        .stat-card.maatschappelijk { border-left: 4px solid #eab308; }
        .stat-card.total { border-left: 4px solid #2563eb; }
        .stat-card.active { border-left: 4px solid #10b981; }
        
        /* Filters */
        .filters {
            display: flex;
            gap: 8px;
            margin-bottom: 24px;
            flex-wrap: wrap;
        }
        
        .filter-btn {
            padding: 8px 16px;
            border-radius: 6px;
            font-size: 13px;
            font-weight: 500;
            text-decoration: none;
            background: white;
            color: #64748b;
            border: 1px solid #e2e8f0;
            transition: all 0.2s;
        }
        
        .filter-btn:hover {
            background: #f8fafc;
            border-color: #cbd5e1;
        }
        
        .filter-btn.active {
            background: #0f172a;
            color: white;
            border-color: #0f172a;
        }
        
        /* Table */
        .table-card {
            background: white;
            border-radius: 12px;
            border: 1px solid #e2e8f0;
            overflow: hidden;
        }
        
        .table-header {
            padding: 20px 24px;
            border-bottom: 1px solid #e2e8f0;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .table-header h2 {
            font-size: 16px;
            font-weight: 600;
        }
        
        table {
            width: 100%;
            border-collapse: collapse;
        }
        
        th, td {
            padding: 14px 24px;
            text-align: left;
            border-bottom: 1px solid #f1f5f9;
        }
        
        th {
            background: #f8fafc;
            font-size: 12px;
            font-weight: 600;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        td {
            font-size: 14px;
        }
        
        tr:hover {
            background: #fafafa;
        }
        
        .badge {
            display: inline-flex;
            align-items: center;
            padding: 4px 10px;
            border-radius: 9999px;
            font-size: 12px;
            font-weight: 500;
        }
        
        .badge-museum { background: #fef3c7; color: #a35514; }
        .badge-landbouw { background: #dcfce7; color: #166534; }
        .badge-maatschappelijk { background: #fef9c3; color: #854d0e; }
        
        .badge-active { background: #dcfce7; color: #166534; }
        .badge-inactive { background: #fee2e2; color: #dc2626; }
        
        .badge-game { background: #dbeafe; color: #1e40af; }
        
        .actions {
            display: flex;
            gap: 8px;
        }
        
        .action-btn {
            width: 32px;
            height: 32px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            border-radius: 6px;
            text-decoration: none;
            font-size: 14px;
            transition: all 0.2s;
        }
        
        .action-btn.edit {
            background: #eff6ff;
            color: #2563eb;
        }
        
        .action-btn.edit:hover {
            background: #dbeafe;
        }
        
        .action-btn.delete {
            background: #fef2f2;
            color: #dc2626;
        }
        
        .action-btn.delete:hover {
            background: #fee2e2;
        }
        
        .event-title {
            font-weight: 500;
            color: #0f172a;
        }
        
        .event-desc {
            font-size: 13px;
            color: #64748b;
            margin-top: 2px;
            max-width: 300px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }
        
        /* Empty State */
        .empty-state {
            text-align: center;
            padding: 60px 20px;
            color: #64748b;
        }
        
        .empty-state svg {
            width: 48px;
            height: 48px;
            margin-bottom: 16px;
            opacity: 0.5;
        }
        
        /* Modal */
        .modal-backdrop {
            display: none;
            position: fixed;
            inset: 0;
            background: rgba(0,0,0,0.5);
            z-index: 1000;
            align-items: center;
            justify-content: center;
        }
        
        .modal-backdrop.show {
            display: flex;
        }
        
        .modal {
            background: white;
            border-radius: 12px;
            padding: 24px;
            max-width: 400px;
            width: 90%;
            text-align: center;
        }
        
        .modal h3 {
            font-size: 18px;
            margin-bottom: 8px;
        }
        
        .modal p {
            color: #64748b;
            font-size: 14px;
            margin-bottom: 24px;
        }
        
        .modal-actions {
            display: flex;
            gap: 12px;
            justify-content: center;
        }
    </style>
</head>
<body>
    <header class="header">
        <h1>🏛️ Fries Landbouwmuseum - Admin</h1>
        <div class="header-actions">
            <a href="edit_add.php" class="btn btn-primary">+ Nieuw Event</a>
            <a href="logout.php" class="btn btn-secondary">Uitloggen</a>
        </div>
    </header>
    
    <div class="container">
        <?php if (isset($_GET['success'])): ?>
            <div class="alert alert-success"><?= htmlspecialchars($_GET['success']) ?></div>
        <?php endif; ?>
        
        <!-- Stats -->
        <div class="stats-grid">
            <div class="stat-card total">
                <div class="stat-value"><?= $stats['total'] ?? 0 ?></div>
                <div class="stat-label">Totaal Events</div>
            </div>
            <div class="stat-card active">
                <div class="stat-value"><?= $stats['active'] ?? 0 ?></div>
                <div class="stat-label">Actief</div>
            </div>
            <div class="stat-card museum">
                <div class="stat-value"><?= $stats['museum_count'] ?? 0 ?></div>
                <div class="stat-label">Museum</div>
            </div>
            <div class="stat-card landbouw">
                <div class="stat-value"><?= $stats['landbouw_count'] ?? 0 ?></div>
                <div class="stat-label">Landbouw</div>
            </div>
            <div class="stat-card maatschappelijk">
                <div class="stat-value"><?= $stats['maatschappelijk_count'] ?? 0 ?></div>
                <div class="stat-label">Maatschappelijk</div>
            </div>
        </div>
        
        <!-- Filters -->
        <div class="filters">
            <a href="?category=all" class="filter-btn <?= $categoryFilter === 'all' ? 'active' : '' ?>">Alle</a>
            <a href="?category=museum" class="filter-btn <?= $categoryFilter === 'museum' ? 'active' : '' ?>">Museum</a>
            <a href="?category=landbouw" class="filter-btn <?= $categoryFilter === 'landbouw' ? 'active' : '' ?>">Landbouw</a>
            <a href="?category=maatschappelijk" class="filter-btn <?= $categoryFilter === 'maatschappelijk' ? 'active' : '' ?>">Maatschappelijk</a>
        </div>
        
        <!-- Table -->
        <div class="table-card">
            <div class="table-header">
                <h2>Events (<?= mysqli_num_rows($result) ?>)</h2>
            </div>
            
            <?php if (mysqli_num_rows($result) > 0): ?>
            <table>
                <thead>
                    <tr>
                        <th>Jaar</th>
                        <th>Event</th>
                        <th>Categorie</th>
                        <th>Status</th>
                        <th>Spel</th>
                        <th>Acties</th>
                    </tr>
                </thead>
                <tbody>
                    <?php while($row = mysqli_fetch_assoc($result)): ?>
                    <tr>
                        <td><strong><?= htmlspecialchars($row['year']) ?></strong></td>
                        <td>
                            <div class="event-title"><?= htmlspecialchars($row['title']) ?></div>
                            <div class="event-desc"><?= htmlspecialchars(mb_substr($row['description'], 0, 80)) ?><?= mb_strlen($row['description']) > 80 ? '...' : '' ?></div>
                        </td>
                        <td>
                            <span class="badge badge-<?= htmlspecialchars($row['category'] ?? 'museum') ?>">
                                <?= ucfirst(htmlspecialchars($row['category'] ?? 'museum')) ?>
                            </span>
                        </td>
                        <td>
                            <?php if ($row['is_active']): ?>
                                <span class="badge badge-active">Actief</span>
                            <?php else: ?>
                                <span class="badge badge-inactive">Inactief</span>
                            <?php endif; ?>
                        </td>
                        <td>
                            <?php 
                            // Check database game_type first, then fallback to legacy logic
                            $gameType = 'Geen';
                            $dbGameType = $row['game_type'] ?? null;
                            
                            if (!empty($dbGameType) && $dbGameType !== 'none') {
                                // Use database value (puzzle, memory, quiz, harvest, etc.)
                                $gameType = ucfirst($dbGameType);
                            } else {
                                // Legacy fallback logic
                                if ($row['has_puzzle'] && !empty($row['puzzle_image_url'])) {
                                    $gameType = 'Puzzle';
                                } elseif ($row['has_puzzle']) {
                                    $gameType = 'Memory';
                                }
                            }
                            ?>
                            <?php if ($gameType !== 'Geen'): ?>
                                <span class="badge badge-game"><?= $gameType ?></span>
                            <?php else: ?>
                                <span style="color: #94a3b8;">—</span>
                            <?php endif; ?>
                        </td>
                        <td class="actions">
                            <a href="edit_add.php?id=<?= $row['id'] ?>" class="action-btn edit" title="Bewerken">✏️</a>
                            <button class="action-btn delete" onclick="confirmDelete(<?= $row['id'] ?>, '<?= htmlspecialchars(addslashes($row['title'])) ?>')" title="Verwijderen">🗑️</button>
                        </td>
                    </tr>
                    <?php endwhile; ?>
                </tbody>
            </table>
            <?php else: ?>
            <div class="empty-state">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <p>Geen events gevonden</p>
                <a href="edit_add.php" class="btn btn-primary" style="margin-top: 16px;">+ Eerste event toevoegen</a>
            </div>
            <?php endif; ?>
        </div>
    </div>
    
    <!-- Delete Confirmation Modal -->
    <div class="modal-backdrop" id="deleteModal">
        <div class="modal">
            <h3>Event verwijderen?</h3>
            <p id="deleteMessage">Weet je zeker dat je dit event wilt verwijderen?</p>
            <div class="modal-actions">
                <button class="btn btn-secondary" onclick="closeModal()">Annuleren</button>
                <a href="#" id="deleteLink" class="btn btn-danger">Verwijderen</a>
            </div>
        </div>
    </div>
    
    <script>
        function confirmDelete(id, title) {
            document.getElementById('deleteMessage').textContent = `Weet je zeker dat je "${title}" wilt verwijderen?`;
            document.getElementById('deleteLink').href = `?delete=${id}`;
            document.getElementById('deleteModal').classList.add('show');
        }
        
        function closeModal() {
            document.getElementById('deleteModal').classList.remove('show');
        }
        
        document.getElementById('deleteModal').addEventListener('click', function(e) {
            if (e.target === this) closeModal();
        });
    </script>
</body>
</html>

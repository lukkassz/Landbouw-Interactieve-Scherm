<?php
include 'includes/db.php';
include 'includes/auth.php';
include 'includes/functions.php';


// Haal alle events op uit de database (tabel: timeline_events)
$query = "SELECT * FROM timeline_events ORDER BY sort_order ASC, year ASC";
$result = mysqli_query($conn, $query);
?>

<!DOCTYPE html>
<html lang="nl">
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css">


<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dashboard</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <div class="dashboard-container">
        <div class="header">
            <h1>Dashboard</h1>
            <a href="edit_add.php" class="btn btn-primary">+ Nieuw Event</a>
            <a href="logout.php" class="btn btn-logout">Logout</a>
        </div>

        <?php if (isset($_GET['success'])): ?>
            <div class="alert alert-success" style="background: #4CAF50; color: white; padding: 15px; margin: 20px 0; border-radius: 5px;">
                <?= htmlspecialchars($_GET['success']) ?>
            </div>
        <?php endif; ?>
        
        <?php if (isset($_SESSION['upload_errors'])): ?>
            <div class="alert alert-error" style="background: #f44336; color: white; padding: 15px; margin: 20px 0; border-radius: 5px;">
                <strong>Upload Fout:</strong> <?= htmlspecialchars($_SESSION['upload_errors']) ?>
            </div>
            <?php unset($_SESSION['upload_errors']); ?>
        <?php endif; ?>

        <div class="table-container">
            <h2>Events Overzicht</h2>
            <table>
                <thead>
                    <tr>
                        <th>Jaar</th>
                        <th>Titel</th>
                        <th>Beschrijving</th>
                        <th>Stage</th>
                        <th>Puzzle?</th>
                        <th>Actief?</th>
                        <th>Acties</th>
                    </tr>
                </thead>
                <tbody>
                    <?php while($row = mysqli_fetch_assoc($result)): ?>
                    <tr>
                        <td><?= htmlspecialchars($row['year']) ?></td>
                        <td><?= htmlspecialchars($row['title']) ?></td>
                        <td><?= htmlspecialchars(mb_substr($row['description'], 0, 100)) ?><?= mb_strlen($row['description']) > 100 ? '...' : '' ?></td>
                        <td><?= htmlspecialchars($row['stage']) ?></td>
                        <td><?= $row['has_puzzle'] ? '✅' : '❌' ?></td>
                        <td><?= $row['is_active'] ? '✅' : '❌' ?></td>
<td class="actions">
    <a href="edit_add.php?id=<?= $row['id'] ?>" class="btn-icon btn-edit" title="Bewerken">
        <i class="fa-solid fa-pen"></i>
    </a>
    <a href="delete.php?id=<?= $row['id'] ?>" class="btn-icon btn-delete" title="Verwijderen">
        <i class="fa-solid fa-trash"></i>
    </a>
</td>

                    </tr>
                    <?php endwhile; ?>
                </tbody>
            </table>
        </div>
    </div>
</body>
</html>

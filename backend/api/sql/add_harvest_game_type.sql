-- Add harvest game type support to timeline_events table
-- This script safely adds the game_type column if it doesn't exist
-- and updates it to support 'harvest' as a game type option

-- Check if column exists, if not add it
SET @dbname = DATABASE();
SET @tablename = "timeline_events";
SET @columnname = "game_type";
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (column_name = @columnname)
  ) > 0,
  "SELECT 'Column already exists.' AS result;",
  CONCAT("ALTER TABLE ", @tablename, " ADD COLUMN ", @columnname, " VARCHAR(20) DEFAULT 'none' AFTER has_puzzle;")
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Update existing events based on has_puzzle and puzzle_image_url (if game_type is 'none' or NULL)
UPDATE timeline_events 
SET game_type = CASE 
    WHEN has_puzzle = 1 AND puzzle_image_url IS NOT NULL AND puzzle_image_url != '' THEN 'puzzle'
    WHEN has_puzzle = 1 THEN 'memory'
    ELSE 'none'
END
WHERE game_type IS NULL OR game_type = '' OR game_type = 'none';

-- Show results
SELECT id, title, has_puzzle, puzzle_image_url, game_type FROM timeline_events ORDER BY id;


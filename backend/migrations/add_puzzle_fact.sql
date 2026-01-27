-- Add puzzle_fact column for puzzle game fun facts
ALTER TABLE timeline_events 
ADD COLUMN puzzle_fact TEXT DEFAULT NULL;

-- Example update (optional - you can add facts via admin panel)
-- UPDATE timeline_events SET puzzle_fact = 'Wist je dat de eerste tractor in Leeuwarden slechts 15 pk had?' WHERE id = 1;

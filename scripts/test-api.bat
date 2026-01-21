@echo off
REM API Testing Script for Windows
REM Tests all API endpoints

set API_BASE=http://localhost/backend/api

echo Testing API Endpoints...
echo.

REM Test GET endpoints
echo Testing GET endpoints...
curl -s -o nul -w "Get all events: %%{http_code}\n" "%API_BASE%/events.php"
curl -s -o nul -w "Get event by ID: %%{http_code}\n" "%API_BASE%/events.php?id=1"
curl -s -o nul -w "Get key moments: %%{http_code}\n" "%API_BASE%/key_moments_simple.php?event_id=1"
curl -s -o nul -w "Get quiz questions: %%{http_code}\n" "%API_BASE%/quiz_questions.php?event_id=1"

echo.
echo Testing POST endpoints...
curl -s -o nul -w "Save puzzle score: %%{http_code}\n" -X POST -H "Content-Type: application/json" -d "{\"event_id\":1,\"score\":100,\"time\":60}" "%API_BASE%/puzzle_scores.php"
curl -s -o nul -w "Save memory score: %%{http_code}\n" -X POST -H "Content-Type: application/json" -d "{\"event_id\":1,\"moves\":20,\"time\":120}" "%API_BASE%/memory_scores.php"
curl -s -o nul -w "Save quiz score: %%{http_code}\n" -X POST -H "Content-Type: application/json" -d "{\"event_id\":1,\"score\":8,\"total\":10}" "%API_BASE%/quiz_scores.php"

echo.
echo API tests completed!

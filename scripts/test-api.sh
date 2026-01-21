#!/bin/bash

# API Testing Script
# Tests all API endpoints

API_BASE="http://localhost/backend/api"

echo "🧪 Testing API Endpoints..."
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test function
test_endpoint() {
    local method=$1
    local endpoint=$2
    local description=$3
    local data=$4
    
    echo -n "Testing: $description ... "
    
    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "\n%{http_code}" "$API_BASE/$endpoint")
    else
        response=$(curl -s -w "\n%{http_code}" -X "$method" -H "Content-Type: application/json" -d "$data" "$API_BASE/$endpoint")
    fi
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$http_code" = "200" ] || [ "$http_code" = "201" ]; then
        echo -e "${GREEN}✓ PASS${NC} (HTTP $http_code)"
        return 0
    else
        echo -e "${RED}✗ FAIL${NC} (HTTP $http_code)"
        echo "Response: $body"
        return 1
    fi
}

# Test endpoints
echo "📡 Testing GET endpoints..."
test_endpoint "GET" "events.php" "Get all events"
test_endpoint "GET" "events.php?id=1" "Get event by ID"
test_endpoint "GET" "key_moments_simple.php?event_id=1" "Get key moments"
test_endpoint "GET" "quiz_questions.php?event_id=1" "Get quiz questions"

echo ""
echo "📝 Testing POST endpoints..."
test_endpoint "POST" "puzzle_scores.php" "Save puzzle score" '{"event_id":1,"score":100,"time":60}'
test_endpoint "POST" "memory_scores.php" "Save memory score" '{"event_id":1,"moves":20,"time":120}'
test_endpoint "POST" "quiz_scores.php" "Save quiz score" '{"event_id":1,"score":8,"total":10}'

echo ""
echo "✅ API tests completed!"

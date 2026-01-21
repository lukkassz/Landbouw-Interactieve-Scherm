#!/bin/bash

# Performance Testing Script
# Tests application performance using Lighthouse CI

echo "🧪 Starting Performance Tests..."
echo ""

# Check if lhci is installed
if ! command -v lhci &> /dev/null; then
    echo "❌ Lighthouse CI not installed. Installing..."
    npm install -g @lhci/cli
fi

# Check if server is running
echo "📡 Checking if server is running..."
if ! curl -s http://localhost:5000 > /dev/null; then
    echo "⚠️  Server not running on port 5000"
    echo "Please start the dev server first: npm run dev"
    exit 1
fi

# Run Lighthouse CI
echo "🚀 Running Lighthouse CI..."
lhci autorun --collect.url=http://localhost:5000

echo ""
echo "✅ Performance tests completed!"
echo "Check the results in .lighthouseci/ directory"

#!/bin/bash

# Build script for local deployment
# Usage: ./build-local.sh

echo "🏗️  Building frontend for local deployment..."

cd frontend

# Build with local API URL
VITE_API_URL=http://localhost/timeline/backend/api npm run build

echo "✅ Build complete!"
echo ""
echo "📁 Next steps:"
echo "1. Copy frontend/dist/* to C:/xampp/htdocs/timeline/frontend/ (Windows)"
echo "   or /var/www/html/timeline/frontend/ (Linux)"
echo "2. Copy backend/api/* to C:/xampp/htdocs/timeline/backend/api/"
echo "3. Configure database.php with local credentials"
echo "4. Test: http://localhost/timeline/frontend/"

#!/bin/bash

# Test API endpoints
API_URL="http://localhost:3000"

echo "Testing Leadscout API endpoints..."
echo "================================"
echo ""

# Test health endpoint
echo "1. Testing /health endpoint:"
curl -s "$API_URL/health" | python3 -m json.tool
echo ""

# Test stats endpoint
echo "2. Testing /stats endpoint:"
curl -s "$API_URL/stats" | python3 -m json.tool
echo ""

# Test leads stats endpoint
echo "3. Testing /api/leads/stats/summary endpoint:"
curl -s "$API_URL/api/leads/stats/summary" | python3 -m json.tool
echo ""

# Test leads list endpoint
echo "4. Testing /api/leads endpoint (first 5):"
curl -s "$API_URL/api/leads?limit=5" | python3 -m json.tool
echo ""

# Test keywords endpoint
echo "5. Testing /api/keywords endpoint:"
curl -s "$API_URL/api/keywords" | python3 -m json.tool
echo ""

# Test analytics overview endpoint
echo "6. Testing /api/analytics/overview endpoint:"
curl -s "$API_URL/api/analytics/overview" | python3 -m json.tool
echo ""

# Test settings config endpoint
echo "7. Testing /api/settings/config endpoint:"
curl -s "$API_URL/api/settings/config" | python3 -m json.tool
echo ""

echo "================================"
echo "API test complete!"
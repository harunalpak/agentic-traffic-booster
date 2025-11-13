#!/bin/bash
# Shell script to start required services for tweet-scout-service testing

echo ""
echo "========================================"
echo "🚀 Tweet Scout Service - Test Environment"
echo "========================================"
echo ""

# Navigate to project root
PROJECT_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$PROJECT_ROOT"

echo "📍 Project root: $PROJECT_ROOT"
echo ""

# Start services
echo "📦 Starting required services..."
echo "   - Zookeeper"
echo "   - Kafka"
echo "   - PostgreSQL"
echo "   - Campaign Service"
echo ""

docker-compose up -d zookeeper kafka postgres campaign-service

if [ $? -ne 0 ]; then
    echo "❌ Failed to start services"
    exit 1
fi

# Wait for services
echo "⏳ Waiting for services to be ready..."
echo "   (This takes about 30-40 seconds)"
echo ""

for i in {30..1}; do
    printf "\r   ⏱️  $i seconds remaining..."
    sleep 1
done
echo ""
echo ""

# Check service status
echo "🔍 Checking service status..."
echo ""
docker-compose ps zookeeper kafka postgres campaign-service
echo ""

# Verify each service
echo "🧪 Running verification tests..."
echo ""

# Test Kafka
printf "   Testing Kafka..."
if docker exec atb-kafka kafka-broker-api-versions --bootstrap-server localhost:9092 &>/dev/null; then
    echo " ✅"
else
    echo " ⚠️  (may need more time)"
fi

# Test PostgreSQL
printf "   Testing PostgreSQL..."
if docker exec atb-postgres pg_isready -U postgres | grep -q "accepting connections"; then
    echo " ✅"
else
    echo " ⚠️  (may need more time)"
fi

# Test Campaign Service
printf "   Testing Campaign Service..."
sleep 5
if curl -s -o /dev/null -w "%{http_code}" http://localhost:8082/api/campaigns | grep -q "200\|404"; then
    echo " ✅"
else
    echo " ⚠️  (starting up, try again in 10 seconds)"
fi

echo ""
echo "========================================"
echo "✅ Services are starting up!"
echo "========================================"
echo ""

# Display service URLs
echo "📋 Service URLs:"
echo "   Kafka:            localhost:9092"
echo "   PostgreSQL:       localhost:5432"
echo "   Campaign Service: http://localhost:8082"
echo ""

# Display useful commands
echo "🔍 Useful Commands:"
echo ""
echo "   List Kafka topics:"
echo "   docker exec atb-kafka kafka-topics --list --bootstrap-server localhost:9092"
echo ""
echo "   View Kafka messages:"
echo "   docker exec atb-kafka kafka-console-consumer --bootstrap-server localhost:9092 --topic new_tweets --from-beginning"
echo ""
echo "   View logs:"
echo "   docker-compose logs -f campaign-service"
echo ""
echo "   Stop services:"
echo "   docker-compose down"
echo ""

# Create test campaign
echo "🎯 Creating a test campaign..."
sleep 5

CAMPAIGN_RESPONSE=$(curl -s -X POST http://localhost:8082/api/campaigns \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Campaign - '"$(date +%H:%M:%S)"'",
    "status": "ACTIVE",
    "mode": "SEMI_AUTO",
    "hashtags": ["#handmade", "#jewelry", "#gift"],
    "keywords": ["artisan", "handcrafted"],
    "searchMode": "LATEST",
    "minFollowerCount": 100,
    "recentWindowMinutes": 15,
    "dailyLimit": 10
  }' 2>/dev/null)

if [ $? -eq 0 ] && [ -n "$CAMPAIGN_RESPONSE" ]; then
    echo "   ✅ Created test campaign"
    echo "   📍 Response: $CAMPAIGN_RESPONSE"
else
    echo "   ⚠️  Could not create test campaign (service still starting)"
    echo "   💡 You can create one manually later"
fi

echo ""
echo "========================================"
echo "🎉 Ready to test tweet-scout-service!"
echo "========================================"
echo ""

# Show next steps
echo "📝 Next Steps:"
echo ""
echo "1. Open a new terminal and run:"
echo "   cd backend/tweet-scout-service"
echo "   npm run dev"
echo ""
echo "2. Check the logs for:"
echo "   ✅ Kafka connection"
echo "   ✅ Campaign fetched"
echo "   ✅ Tweets published"
echo ""
echo "3. Monitor Kafka messages in another terminal:"
echo "   docker exec atb-kafka kafka-console-consumer --bootstrap-server localhost:9092 --topic new_tweets --from-beginning"
echo ""

echo "📚 Documentation:"
echo "   - TESTING.md              (comprehensive testing guide)"
echo "   - START_DEPENDENCIES.md   (this guide)"
echo "   - QUICK_START.md          (quick start guide)"
echo ""


#!/bin/bash

echo "============================================="
echo "   FAULT TOLERANCE TEST: NOTIFICATION PIPELINE"
echo "============================================="
echo ""
echo "This test verifies that if the non-critical Notification Service goes down,"
echo "the rest of the system (API Gateway, Flight Search, Booking) remains operational."
echo ""

# Get the container ID or name (adjust grep match based on your docker ps names)
TARGET_CONTAINER=$(docker ps | grep notification-service | awk '{print $1}')

if [ -z "$TARGET_CONTAINER" ]; then
  echo "Error: Notification Service container is not running!"
  exit 1
fi

echo "Killing notification-service (Container ID: $TARGET_CONTAINER) to simulate failure..."
docker kill $TARGET_CONTAINER

echo ""
echo "Sending Health Check to API Gateway..."
sleep 2
curl -s http://localhost:4000/health | grep '"status":"OK"' > /dev/null

if [ $? -eq 0 ]; then
  echo "✅ API Gateway is still UP and routing traffic."
else
  echo "❌ API Gateway failed!"
fi

echo ""
echo "Sending Flight Search Request..."
HTTP_STATUS=$(curl -o /dev/null -s -w "%{http_code}\n" "http://localhost:4000/api/flights/search?source=JFK&destination=LHR&date=2024-12-01")

if [ "$HTTP_STATUS" == "200" ]; then
  echo "✅ Flight Search succeeded!"
else
  echo "❌ Flight Search failed! Status: $HTTP_STATUS"
fi

echo ""
echo "Test completed. You may restart the container using 'docker-compose restart notification-service'."

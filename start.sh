#!/bin/bash
echo "🚀 Starting CMS-360..."
echo ""

# Start backend
cd /home/kevob/church/backend
npm run dev &
BACKEND_PID=$!
echo "✅ Backend PID: $BACKEND_PID"

# Start frontend
cd /home/kevob/church/frontend
npm run dev &
FRONTEND_PID=$!
echo "✅ Frontend PID: $FRONTEND_PID"

echo ""
echo "════════════════════════════════════════════"
echo "  CMS-360 is running!"
echo "  Frontend: http://localhost:3000"
echo "  Backend:  http://localhost:5000"
echo ""
echo "  SuperAdmin:   helvinotechltd@gmail.com / Mycat@95"
echo "  Demo Church:  admin@gracechurch.demo / Demo@2024"
echo "════════════════════════════════════════════"
echo ""
echo "Press Ctrl+C to stop..."
wait

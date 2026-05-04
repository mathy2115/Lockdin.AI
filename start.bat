@echo off
echo Starting Client and Server...
start cmd /k "cd client && npm install && npm run dev"
start cmd /k "cd server && set NODE_TLS_REJECT_UNAUTHORIZED=0 && npm install && npm start"

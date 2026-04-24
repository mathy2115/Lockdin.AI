@echo off
echo Starting Client and Server...
start cmd /k "cd client && npm install && npm run dev"
start cmd /k "cd server && npm install && npm start"

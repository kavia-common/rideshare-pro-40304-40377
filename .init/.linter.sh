#!/bin/bash
cd /home/kavia/workspace/code-generation/rideshare-pro-40304-40377/ride_booking_frontend
npm run build
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
   exit 1
fi


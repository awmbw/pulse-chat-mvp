# Development Hurdles & Solutions

## Hurdle 1: MongoDB querySrv ENOTFOUND Error
**Symptom:** Server crashed on boot with `Error: querySrv ENOTFOUND _mongodb._tcp...`
**Diagnosis:** The Node.js application failed to resolve the DNS SRV record for the MongoDB Atlas cluster. This means the computer couldn't locate the database on the internet.
**Root Cause & Solution:** The local Linux DNS resolver (127.0.0.53) / private Wi-Fi router was blocking DNS SRV queries, resulting in an NXDOMAIN error. 
Solution: Bypassed the local network restrictions by either switching to a mobile hotspot or changing the OS DNS server to Google's public DNS (8.8.8.8).

## Hurdle 2: Silent Message Deletion on WebSocket Send
**Symptom:** When clicking "Send" in the React chat UI, the message immediately disappeared from the screen and was never sent over the WebSocket.
**Diagnosis:** The React code was hitting an early `return` (abort) statement because the user's MongoDB `_id` was `undefined` in the React State. 
**Root Cause & Solution:** A classic API Data Contract mismatch. The Node.js backend sent the login token and user profile as a flat JSON object (`{ _id, username, token }`), but the React frontend (TypeScript) expected a nested object (`{ token, user: { id, username } }`). Because the `user` object was missing, the frontend stored an incomplete profile in `localStorage`. 
**Solution:** Updated the frontend TypeScript interfaces and Auth contexts to correctly match the flat JSON structure emitted by the backend.

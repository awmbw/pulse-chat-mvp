# Pulse Chat: Interview Cheat Sheet & Architecture Guide

This document contains the core architectural talking points for the "Pulse Chat" project. Use this to prepare for your senior engineering interviews.

## 1. End-to-End Encryption (E2EE) Architecture
**The Challenge:** Encrypting real-time WebSocket traffic so that the backend database has absolute zero-knowledge of the message contents.
**The Solution:**
- Leveraged the native **WebCrypto API** to generate ECDH (Elliptic Curve Diffie-Hellman) key pairs on the client side.
- When two users open a chat, their public keys are exchanged, and a **Shared Secret** is derived locally.
- Used **AES-GCM** (Advanced Encryption Standard - Galois/Counter Mode) to encrypt message payloads using the Shared Secret and a random Initialization Vector (IV) before transmission.
- The Node.js backend only stores and forwards the encrypted blob and the IV.

## 2. Cloud File Storage (Zero-Knowledge AWS S3)
**The Challenge:** Securely transferring images and documents without the server being able to intercept or view them.
**The Solution:**
- Implemented **AWS S3 Presigned URLs**. The client requests an upload URL from the backend, allowing it to upload files directly to S3, bypassing the Node server to reduce bandwidth bottlenecks.
- Before uploading to S3, the client generates a random, single-use symmetric encryption key and encrypts the file byte-array.
- The raw, encrypted file is uploaded to S3.
- The decryption key is then embedded into a standard chat message, encrypted with the ECDH Shared Secret, and sent to the recipient.
- The recipient downloads the encrypted blob from S3 and decrypts it locally in memory.

## 3. Real-Time AI Translation (Client-Side Proxy)
**The Challenge:** Utilizing a Large Language Model (Gemini) to translate messages without exposing the plaintext chat history to the backend database.
**The Solution:**
- Engineered a **Client-Side Proxy Pattern**.
- The React frontend receives the encrypted message, decrypts it locally, and then POSTs the plaintext directly to a stateless `/api/ai/translate` endpoint.
- The Node backend forwards the text to Google Gemini (using the ultra-low latency `gemini-2.5-flash` model), returns the translated text, and immediately drops it from memory. No translated text is ever saved to MongoDB.

## 4. AI Smart Catch-Up Engine
**The Challenge:** Summarizing unread messages while maintaining strict Zero-Knowledge E2EE compliance.
**The Solution:**
- The frontend dynamically maps the last 50 decrypted messages from React state into a structured transcript string.
- This transcript is sent to a stateless `/api/ai/summarize` proxy endpoint.
- The Gemini LLM parses the transcript, extracts key bullet points, ignores small talk, and returns the summary to the client.

## 5. Scheduled Send (Distributed Background Workers)
**The Challenge:** Allowing users to schedule messages for the future in a system primarily driven by real-time WebSocket events.
**The Solution:**
- Created a background worker system using `node-cron`.
- Scheduled messages are saved to MongoDB as "Pending" (e.g. `isScheduled: true`, `scheduledFor: timestamp`).
- A background worker thread sweeps the database every 60 seconds, looking for due messages.
- Due messages are dispatched over the global Socket.io instance directly to the recipient rooms, and marked as complete to prevent duplicate sends.

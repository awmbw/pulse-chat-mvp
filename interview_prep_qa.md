# System Design & Architecture

## Q: Why do we need a dedicated backend server and database for a chat application instead of relying purely on frontend logic?

**My Initial Thought:** The backend contains the logic for handling frontend tasks, and the database handles CRUD operations.

**The "Big Tech" Answer:**
1. **Trust Boundary (Security):** The client environment is inherently insecure and can be manipulated by the user. The backend acts as a secure, centralized gatekeeper that validates and authenticates all incoming requests before processing them.
2. **Centralized Routing:** The backend serves as a persistent hub for WebSocket connections. It solves the problem of clients not being able to easily locate and connect to each other directly across the internet.
3. **Persistence & Availability:** The database acts as the single source of truth. It allows for offline message queuing, ensuring data is not lost if a client disconnects, and handles the persistent storage of user profiles and chat history.
## Q: When pushing a backend project to a public repository, which file must absolutely be included in `.gitignore` and why?
**A:** The `.env` file must be ignored. It contains sensitive secrets like Database URIs (passwords) and API keys. If pushed to a public repo, automated scraping bots will instantly steal these credentials, leading to severe security breaches, data theft, or massive financial charges on cloud provider accounts.
## Q: Why choose MongoDB (NoSQL) over PostgreSQL (SQL) for a chat application?
**A:** Two main reasons:
1. **Schema Flexibility:** Chat messages are polymorphic. One message might be pure text, another might contain an image payload, a video, or metadata for a scheduled send. Relational SQL databases require rigid schemas that are hard to alter dynamically. MongoDB's document model handles unstructured, varied data effortlessly.
2. **Scalability for Write-Heavy Workloads:** Chat applications have extreme write velocities (thousands of messages per second). NoSQL databases like MongoDB are designed to scale *horizontally* (adding more servers to distribute the load, known as Sharding) out-of-the-box, whereas SQL databases typically scale *vertically* (buying a bigger, more expensive server), which hits a hardware limit quickly.
## Q: How do you perform server-side AI translation on End-to-End Encrypted (E2EE) messages without compromising zero-knowledge storage?
**A:** By using **Ephemeral Server-Side Processing**. 
1. The database (Data at Rest) only stores mathematically encrypted cipher-text. The server never reads the chat history.
2. The client browser decrypts the message locally.
3. If the user requests a translation, the client sends a volatile, secure request containing the decrypted text to a dedicated backend proxy route.
4. The backend sends it to the AI API, returns the translation to the client, and immediately deletes the text from its memory. It is never logged or saved to the database.
## Q: How does MongoDB instantly verify if a field is unique (like an email) among millions of records without scanning the whole database?
**A:** By using **Database Indexing**. When a field is marked as unique, the database creates a separate, highly optimized data structure (like the index at the back of a textbook). Instead of performing a slow sequential scan of every document, the database checks the index to instantly verify uniqueness or locate the document.

## Q: Why do we use a hashing algorithm (like bcrypt) for passwords instead of an encryption algorithm (like AES)?
**A:** Encryption is a two-way function (reversible if you have the key). Hashing is a one-way mathematical function. We hash passwords because even if our database is compromised and the attacker steals the hashes, they cannot 'decrypt' them back into plain text. When a user logs in, we simply hash their input again and compare the two hashes.

## Q: In REST API design, why is it critical to use a POST request for registration/login rather than a GET request?
**A:** In a GET request, data is sent in the URL string itself (e.g., `/login?password=mysecret`), meaning the password will be saved in browser history, server logs, and intercepted easily. In a POST request, the data is sent in the hidden 'body' of the HTTP request, which is encrypted during transit (if using HTTPS) and never stored in logs or browser history.

## Q: What is the difference between a JWT (JSON Web Token) and a traditional Session Cookie, and why do modern apps prefer JWTs?
**A:** Traditional Sessions are 'Stateful'. The backend server must store the user's login state in memory or a database, making it hard to scale across multiple servers (Server A doesn't know about the session created on Server B). JWTs are 'Stateless'. The token itself contains the user's verified identity, cryptographically signed by the server. Any server can instantly verify the signature without needing to check a central database, making horizontal scaling effortless.

## Q: When setting up Socket.io, why do we wrap our Express 'app' inside a raw Node.js 'http' server instead of just using 'app.listen'?
**A:** Express is designed purely for HTTP Request/Response cycles. WebSockets require 'upgrading' an initial HTTP connection into a persistent TCP stream. By creating the raw HTTP server manually, we can attach the Socket.io server to the exact same port. Socket.io intercepts the initial HTTP request and performs the protocol upgrade, allowing both standard API routes and WebSockets to run on the same server instance.

## Q: What is an API Data Contract mismatch, and how can it lead to silent failures in a Full-Stack application?
**A:** A data contract mismatch occurs when the backend sends JSON data in a structure (e.g., a flat object) that the frontend is not expecting (e.g., a nested object). In weakly typed environments, the frontend might silently accept `undefined` for missing fields instead of crashing. This leads to subtle logic bugs—like an `if (!userId) return;` statement secretly aborting a function—because the application state is corrupted without throwing a loud error. Using strict typings (like TypeScript) aligned with backend schemas (or using tools like GraphQL/tRPC) helps catch these contract violations at compile time.

## Q: If a chat application implements 1-on-1 End-to-End Encryption, how does the architecture change when introducing Group Chats and File Sharing?
**A:** It increases complexity exponentially. 1-on-1 E2EE relies on a simple key exchange (like Diffie-Hellman) where two users derive a shared secret. 
- **Group Chats:** You cannot easily share one secret among 50 people securely. You must implement "Sender Keys" (like the Signal Protocol), where every member generates a unique symmetric key and sends it individually to every other member over their private 1-on-1 channels. 
- **File Sharing:** You cannot send a 50MB video over WebSockets efficiently. Instead, the sender generates a random, one-time symmetric key, encrypts the file locally, uploads the encrypted blob to an S3 bucket, and then sends the URL and the one-time key to the recipient over the standard E2EE text channel.

## Q: How do you handle reliable execution of background tasks, like scheduled messages, in a Node.js environment?
**A:** Using a background worker queue or a specialized CRON daemon. In our application, we utilized `node-cron` integrated directly into the backend server. The cron job runs periodically to query MongoDB for messages where the `scheduledFor` timestamp has passed, formats them, emits them over WebSockets, and marks them as sent. For extreme scale, this would be decoupled into a separate microservice using a message broker like RabbitMQ or Redis Pub/Sub to prevent blocking the main HTTP event loop.

## Q: Why is containerization (Docker) critical for modern application deployment?
**A:** Containerization solves the "it works on my machine" problem. A Docker container packages the application code along with its exact dependencies, libraries, and runtime environment into a single, immutable artifact. This ensures that the application runs identically on a developer's laptop, in a CI pipeline, and in a production cloud environment, drastically reducing deployment failures and environment-specific bugs.

## Q: Explain the purpose of a Multi-Stage Docker build for a React application.
**A:** A multi-stage build optimizes the final Docker image size and security. Stage 1 uses a heavy Node.js image to install dependencies and run the build process (Vite/Webpack), generating static HTML/JS files. Stage 2 uses a lightweight, production-ready web server (like Nginx Alpine) and *only* copies the compiled static files from Stage 1. This prevents shipping gigabytes of unnecessary source code and `node_modules` to production, reducing the attack surface and deployment times.

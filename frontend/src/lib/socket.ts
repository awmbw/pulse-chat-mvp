import { io } from 'socket.io-client';

// Point to the same Node.js backend URL we use for API calls
const URL = (import.meta.env.VITE_API_URL as string) || "http://localhost:5000";

// Create the socket connection, but DO NOT connect automatically.
// We only want to connect AFTER the user has successfully logged in.
export const socket = io(URL, {
  autoConnect: false,
});

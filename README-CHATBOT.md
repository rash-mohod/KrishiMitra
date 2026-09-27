# KrishiMitra Assistant integration

This package contains the chatbot integration files for the current KrishiMitra project.

## Setup
1. Copy these files into the matching paths in the project.
2. In `server/.env`, add:
   `GEMINI_API_KEY=your_key`
   `GEMINI_MODEL=gemini-3.8-flash`
3. Run `npm install` inside `server` so `@google/genai` is installed for the backend.
4. Start the backend and frontend using the project's existing commands.
5. Log in and open **KrishiMitra Assistant**.

Do not put the Gemini key in React or any `VITE_*` variable.

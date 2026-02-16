# Hand Cricket: India vs Pakistan (AI Powered)

## Challenge Vertical: Entertainment & Games

### Overview
This is a browser-based implementation of the classic "Hand Cricket" game, enhanced with Google's Gemini API. The player takes on the role of Team India playing against Pakistan. The application demonstrates how Generative AI can transform a simple static game into a dynamic experience by providing real-time, context-aware commentary and strategic coaching advice.

### Features
*   **Smart Assistant (Coach Gemini)**: Analyzes the game state (score, wickets, balls remaining) to provide strategic advice to the player.
*   **Dynamic Commentary**: Uses Gemini to generate exciting, cricket-style commentary for boundaries and wickets, replacing repetitive static text.
*   **Accessibility**: Designed with ARIA labels and keyboard navigation support.
*   **Responsive UI**: Built with React and Tailwind CSS for a seamless mobile and desktop experience.

### How it Works
1.  **Game Loop**: The core logic is a React state machine handling innings, scoring, and wicket mechanics.
2.  **AI Integration**:
    *   When a significant event occurs (4, 6, Wicket), the app sends the event context to the Gemini API.
    *   Gemini generates a unique commentary line which is streamed to the UI.
    *   Periodically, the AI analyzes the required run rate and wickets in hand to generate a "Coach's Tip".
3.  **Fallback Mechanism**: To ensure efficiency and offline capability, the system seamlessly falls back to static commentary if the API is unavailable or slow.

### Assumptions
*   The environment provides a valid `process.env.API_KEY` for the Google GenAI SDK.
*   The game rules follow standard "Hand Cricket" conventions (1-6 inputs, same number = out).

### Tech Stack
*   **Frontend**: React, TypeScript, Tailwind CSS
*   **AI**: Google GenAI SDK (`@google/genai`), Gemini 2.5 Flash Model
*   **Audio**: Web Audio API (No external assets)

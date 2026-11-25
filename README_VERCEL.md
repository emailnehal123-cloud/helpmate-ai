# HelpMate AI — React + Vite Web App (Vercel Ready)

## Features
- **Multilingual AI Companion (7 Languages + RTL)**: English, Urdu (`اردو`), Hindi (`हिन्दी`), Arabic (`العربية`), French, Spanish, and Turkish, with automatic language matching and instant language-switch commands.
- **Agentic Gemini Tools (`/api/chat.ts`)**:
  - `set_alarm` & `set_recurring_reminder`: Interactive in-chat alarm/reminder cards with repeat days, Web Audio chime previews, live browser alerts, and `.ics` calendar export.
  - `search_google`: Real-time Google Search grounding with clickable source chips.
  - `search_google_maps`: Embedded Google Maps place cards with one-click Maps launch.
  - `switch_app_language`: Instant UI & RTL switching from chat.
- **Voice Input**: Web Speech API (`SpeechRecognition`) localized to the active language.
- **Responsive Navigation**: Bottom bar on mobile, Navigation Rail on desktop/tablet, plus Light/Dark/System themes.

## Deploy to Vercel
1. Push this repository to GitHub (or import in Vercel).
2. Vercel auto-detects `vite` from `vercel.json` (`npm run build` -> `dist`).
3. Add the environment variable **`GEMINI_API_KEY`** in **Vercel Project Settings -> Environment Variables**.
4. Redeploy and start chatting!

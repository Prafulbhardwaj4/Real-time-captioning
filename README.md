# CaptionAI

CaptionAI is a focused final year project with three main features:

- Real-time captioning
- Translation
- A popup AI assistant

## Run locally

```powershell
npm install
npm run dev
```

## Required environment variable

Create a `.env` file in the project root:

```env
VITE_SARVAM_API_KEY=your_api_key_here
```

The browser-based captioning feature works without the API key, but the translator and AI assistant need it.

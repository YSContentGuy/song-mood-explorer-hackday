# Flask Tutorial App with LLM

This is a tiny Flask app that lets you:
- Add simple items to an in-memory list
- Ask an LLM via a backend endpoint (`/api/llm`) using an OpenAI-compatible API

## Setup

1) Create a virtual environment (recommended)

```bash
python3 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
pip install Flask requests
```

If `venv` is missing, install it (Debian/Ubuntu):
```bash
sudo apt-get update && sudo apt-get install -y python3-venv
```

2) Configure environment variables

Copy `.env.example` to `.env` and edit:
```
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini
# Optional if you use a compatible server
# OPENAI_BASE_URL=https://api.openai.com/v1
```
Then export them in your shell (or use a dotenv loader):
```bash
export $(grep -v '^#' .env | xargs -d '\n')
```

3) Run the app

```bash
python app.py
```

Visit http://localhost:5000 and try the LLM card.

## Notes
- The LLM call uses a minimal stdlib HTTP client to avoid extra dependencies.
- The endpoint is OpenAI Chat Completions-compatible (`/v1/chat/completions`).
- Errors return JSON with `error`, `details`, and sometimes raw provider response.
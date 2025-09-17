from flask import Flask, render_template, request, redirect, url_for, jsonify
import os
import json
import urllib.request
import urllib.error

app = Flask(__name__)

# Simple in-memory store to keep items during runtime
items = []

@app.route('/')
def index():
    return render_template('index.html', items=items)

@app.post('/add')
def add_item():
    text = request.form.get('text', '').strip()
    if text:
        items.append(text)
    return redirect(url_for('index'))

@app.get('/api/items')
def get_items():
    return jsonify(items)

@app.post('/api/llm')
def api_llm():
    """Call an OpenAI-compatible LLM endpoint and return the response text.

    Expects JSON body:
      {
        "prompt": "...",            # required
        "system": "...",            # optional
        "model": "...",             # optional (defaults from env)
        "temperature": 0.7,          # optional
        "max_tokens": 256            # optional
      }

    Environment variables:
      OPENAI_API_KEY   (required)
      OPENAI_BASE_URL  (default: https://api.openai.com/v1)
      OPENAI_MODEL     (default: gpt-4o-mini)
    """
    body = request.get_json(silent=True) or {}
    user_prompt = (body.get('prompt') or '').strip()
    if not user_prompt:
        return jsonify({"error": "Missing 'prompt' in request body."}), 400

    system_prompt = body.get('system') or 'You are a helpful assistant.'
    model_name = body.get('model') or os.environ.get('OPENAI_MODEL', 'gpt-4o-mini')
    temperature = body.get('temperature', 0.7)
    max_tokens = body.get('max_tokens', 256)

    api_key = os.environ.get('OPENAI_API_KEY')
    if not api_key:
        return jsonify({"error": "OPENAI_API_KEY is not set in the environment."}), 400

    base_url = os.environ.get('OPENAI_BASE_URL', 'https://api.openai.com/v1')
    endpoint = f"{base_url.rstrip('/')}/chat/completions"

    payload = {
        "model": model_name,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ],
        "temperature": temperature,
        "max_tokens": max_tokens
    }
    data_bytes = json.dumps(payload).encode('utf-8')

    req = urllib.request.Request(
        endpoint,
        data=data_bytes,
        headers={
            'Authorization': f'Bearer {api_key}',
            'Content-Type': 'application/json'
        },
        method='POST'
    )

    try:
        with urllib.request.urlopen(req, timeout=60) as resp:
            resp_body = resp.read()
            resp_json = json.loads(resp_body.decode('utf-8'))
    except urllib.error.HTTPError as e:
        try:
            err_body = e.read().decode('utf-8')
        except Exception:
            err_body = str(e)
        return jsonify({
            "error": "LLM provider returned an error",
            "status": e.code,
            "details": err_body
        }), 502
    except urllib.error.URLError as e:
        return jsonify({
            "error": "Failed to reach LLM provider",
            "details": str(e)
        }), 502
    except Exception as e:
        return jsonify({"error": "Unexpected error", "details": str(e)}), 500

    # Try to extract text from OpenAI-style response
    text = None
    try:
        choices = resp_json.get('choices') or []
        if choices and 'message' in choices[0] and 'content' in choices[0]['message']:
            text = choices[0]['message']['content']
    except Exception:
        text = None

    if not text:
        return jsonify({
            "error": "Could not extract text from provider response",
            "raw": resp_json
        }), 502

    return jsonify({
        "text": text,
        "model": model_name
    })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
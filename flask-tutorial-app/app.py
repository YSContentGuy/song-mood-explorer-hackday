from flask import Flask, render_template, request, redirect, url_for, jsonify

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

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
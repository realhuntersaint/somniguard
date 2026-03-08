This script handles saving sleep logs and providing "Smart Suggestions" based on how well the user claims to be sleeping. 
from flask import Flask, request, jsonify, render_template, send_from_directory
import datetime
import os

app = Flask(__name__, template_folder='templates', static_folder='static')

# Database simulation (In a real app, use PostgreSQL/MongoDB)
sleep_logs = []

def get_ai_suggestion(data):
    # Simple Logic Engine for suggestions
    quality_score = data.get('quality', 0) 
    
    if quality_score < 3:
        return {
            "remedy": "Drink warm milk and try the 4-7-8 breathing technique.",
            "environment": "Ensure your room is dark and around 65°F (18°C).",
            "alert": "Avoid screens for at least 45 minutes before bed."
        }
    elif quality_score < 8:
        return {
            "remedy": "Try the 'body scan' meditation method.",
            "environment": "Check if your mattress is comfortable.",
            "alert": "Limit caffeine intake after 2 PM today."
        }
    else:
        return {
            "remedy": "You are doing great! Keep up the routine.",
            "environment": "Nothing to adjust tonight.",
            "alert": ""
        }

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/log', methods=['POST'])
def log_sleep():
    data = request.json
    
    timestamp = datetime.datetime.now()
    
    # In a real app, calculate 'quality' based on actual sleep data here.
    # For now, we accept user input or default to 5/10
    quality = data.get('quality', 5) 
    sleep_time = data.get('sleep_start')
    wake_time = data.get('wake_time')

    log_entry = {
        "date": timestamp.strftime("%Y-%m-%d"),
        "duration_hours": float(wake_time.replace('-', ' ')[2:]) - float(sleep_time.replace('-', ' ')[2:]), # Rough calc for demo
        "quality_score": quality,
        "timestamp": timestamp
    }

    sleep_logs.append(log_entry)
    
    suggestion = get_ai_suggestion({"quality": quality})

    return jsonify({
        "status": "success",
        "suggestions": suggestion,
        "last_log": log_entry
    })

@app.route('/api/history')
def get_history():
    # Returns sorted history newest first
    sleep_logs.sort(key=lambda x: x['timestamp'], reverse=True)
    return jsonify(sleep_logs)

if __name__ == '__main__':
    app.run(debug=True, port=5000)

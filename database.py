from flask_sqlalchemy import SQLAlchemy
from flask_login import UserMixin
from datetime import datetime

db = SQLAlchemy()

class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True)
    password_hash = db.Column(db.String(120))
    sleep_logs = db.relationship('SleepLog', backref='author', lazy=True)

class SleepLog(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    date = db.Column(db.DateTime, default=datetime.utcnow)
    bedtime = db.Column(db.Time)
    wake_time = db.Column(db.Time)
    quality_score = db.Column(db.Integer, default=5) # 1-10 scale
    notes = db.Column(db.String(500))

    def to_dict(self):
        return {
            'id': self.id,
            'date': self.date.strftime('%Y-%m-%d'),
            'bedtime': str(self.bedtime),
            'wake_time': str(self.wake_time),
            'quality_score': self.quality_score,
            'duration_hours': (self.wake_time.hour - self.bedtime.hour + 24) if hasattr(self, 'duration') else 0
        }

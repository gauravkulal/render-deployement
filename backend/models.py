from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

class Retailer(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    mallige_quantity = db.Column(db.Integer, default=0)
    jaji_quantity = db.Column(db.Integer, default=0)

    def __repr__(self):
        return f'<Retailer {self.name}>'

class Distribution(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    retailer_id = db.Column(db.Integer, db.ForeignKey('retailer.id'), nullable=False)
    flower_type = db.Column(db.String(50), nullable=False)
    quantity = db.Column(db.Integer, nullable=False)

    retailer = db.relationship('Retailer', backref=db.backref('distributions', lazy=True))

    def __repr__(self):
        return f'<Distribution {self.flower_type} for Retailer {self.retailer_id}>'

class Account(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    date = db.Column(db.String(20), nullable=False)
    retailer = db.Column(db.String(100), nullable=False)
    m_qty = db.Column(db.Float, default=0)
    j_qty = db.Column(db.Float, default=0)
    m_rate = db.Column(db.Float, default=0)
    j_rate = db.Column(db.Float, default=0)
    m_total = db.Column(db.Float, default=0)
    j_total = db.Column(db.Float, default=0)
    total = db.Column(db.Float, default=0)

class RateAcc(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    date = db.Column(db.String(20), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    given_m = db.Column(db.Float, default=0)
    taken_m = db.Column(db.Float, default=0)
    given_j = db.Column(db.Float, default=0)
    taken_j = db.Column(db.Float, default=0)
    m_rate = db.Column(db.Float, default=0)
    j_rate = db.Column(db.Float, default=0)
    given_m_total = db.Column(db.Float, default=0)
    taken_m_total = db.Column(db.Float, default=0)
    given_j_total = db.Column(db.Float, default=0)
    taken_j_total = db.Column(db.Float, default=0)
from flask import Blueprint, request, jsonify
from models import db, Retailer, Distribution, Account
from models import RateAcc

bp = Blueprint('routes', __name__)

@bp.route('/api/retailers', methods=['GET'])
def get_retailers():
    retailers = Retailer.query.all()
    return jsonify([{'id': retailer.id, 'name': retailer.name} for retailer in retailers])

@bp.route('/api/distributions', methods=['POST'])
def save_distribution():
    data = request.json
    new_distribution = Distribution(
        retailer_id=data['retailer_id'],
        flower_type=data['flower_type'],
        quantity=data['quantity']
    )
    db.session.add(new_distribution)
    db.session.commit()
    return jsonify({'message': 'Distribution saved successfully'}), 201

@bp.route('/api/totals', methods=['GET'])
def calculate_totals():
    totals = {
        'Mallige': db.session.query(db.func.sum(Distribution.quantity)).filter(Distribution.flower_type == 'Mallige').scalar() or 0,
        'Jaji': db.session.query(db.func.sum(Distribution.quantity)).filter(Distribution.flower_type == 'Jaji').scalar() or 0
    }
    return jsonify(totals)

# --- New endpoints for accounts and filter bills ---

@bp.route('/api/accounts', methods=['POST'])
def save_accounts():
    data = request.json
    date = data['date']
    rows = data['rows']
    # Remove existing for that date
    Account.query.filter_by(date=date).delete()
    for row in rows:
        acc = Account(
            date=date,
            retailer=row['retailer'],
            m_qty=row['m_qty'],
            j_qty=row['j_qty'],
            m_rate=row['m_rate'],
            j_rate=row['j_rate'],
            m_total=row['m_total'],
            j_total=row['j_total'],
            total=row['total']
        )
        db.session.add(acc)
    db.session.commit()
    return jsonify({'message': 'Accounts saved successfully'})

@bp.route('/api/accounts', methods=['GET'])
def get_accounts():
    date = request.args.get('date')
    accounts = Account.query.filter_by(date=date).all()
    return jsonify([{
        'date': acc.date,
        'retailer': acc.retailer,
        'm_qty': acc.m_qty,
        'j_qty': acc.j_qty,
        'm_rate': acc.m_rate,
        'j_rate': acc.j_rate,
        'm_total': acc.m_total,
        'j_total': acc.j_total,
        'total': acc.total
    } for acc in accounts])

@bp.route('/api/filter-bills', methods=['GET'])
def filter_bills():
    from_date = request.args.get('from')
    till_date = request.args.get('till')
    retailer = request.args.get('retailer')

    # Validate input
    if not from_date or not till_date:
        return jsonify({"error": "Both 'from' and 'till' dates are required."}), 400

    query = Account.query.filter(Account.date >= from_date, Account.date <= till_date)
    if retailer:
        query = query.filter_by(retailer=retailer)
    query = query.order_by(Account.date, Account.retailer)
    rows = query.all()
    result = []
    for row in rows:
        result.append({
            "date": row.date,
            "retailer": row.retailer,
            "m_qty": row.m_qty,
            "j_qty": row.j_qty,
            "m_rate": row.m_rate,
            "j_rate": row.j_rate,
            "m_total": row.m_total,
            "j_total": row.j_total,
            "total": row.total
        })
    return jsonify(result)



@bp.route('/api/rate-acc', methods=['POST'])
def save_rate_acc():
    data = request.json
    date = data['date']
    rows = data['rows']
    # Remove existing for that date
    RateAcc.query.filter_by(date=date).delete()
    for row in rows:
        rec = RateAcc(
            date=date,
            name=row['name'],
            given_m=row['givenM'],
            taken_m=row['takenM'],
            given_j=row['givenJ'],
            taken_j=row['takenJ'],
            m_rate=row['mRate'],
            j_rate=row['jRate'],
            given_m_total=row['givenMTotal'],
            taken_m_total=row['takenMTotal'],
            given_j_total=row['givenJTotal'],
            taken_j_total=row['takenJTotal']
        )
        db.session.add(rec)
    db.session.commit()
    return jsonify({'message': 'Rate Acc saved successfully'})

@bp.route('/api/rate-acc', methods=['GET'])
def get_rate_acc():
    from_date = request.args.get('from')
    till_date = request.args.get('till')
    name = request.args.get('name')
    query = RateAcc.query.filter(RateAcc.date >= from_date, RateAcc.date <= till_date)
    if name:
        query = query.filter_by(name=name)
    query = query.order_by(RateAcc.date, RateAcc.name)
    rows = query.all()
    result = []
    for row in rows:
        result.append({
            "date": row.date,
            "name": row.name,
            "givenM": row.given_m,
            "takenM": row.taken_m,
            "givenJ": row.given_j,
            "takenJ": row.taken_j,
            "mRate": row.m_rate,
            "jRate": row.j_rate,
            "givenMTotal": row.given_m_total,
            "takenMTotal": row.taken_m_total,
            "givenJTotal": row.given_j_total,
            "takenJTotal": row.taken_j_total
        })
    return jsonify(result)
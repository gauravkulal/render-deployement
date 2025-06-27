# Flower Distribution Tracker

## Overview
The Flower Distribution Tracker is a web application designed to manage the distribution of flowers to various retailers. It provides a user-friendly interface for inputting retailer data, calculating flower distributions, and storing this information in a SQLite database.

## Features
- Dynamic management of retailer information
- Calculation of total flower distributions (Mallige and Jaji)
- Data persistence using SQLite
- Simple and intuitive frontend interface

## Project Structure
```
flower-distribution-tracker
├── backend
│   ├── app.py               # Main entry point for the Flask application
│   ├── models.py            # Database models for Retailer and Distribution
│   ├── routes.py            # Route handlers for the Flask application
│   ├── database.db          # SQLite database file
│   └── requirements.txt     # Python dependencies for the backend
├── frontend
│   ├── index.html           # Main HTML layout for the application
│   ├── scripts
│   │   └── main.js          # JavaScript logic for dynamic behavior
│   └── styles
│       └── style.css        # CSS styles for the frontend layout
└── README.md                # Documentation for the project
```

## Setup Instructions
1. Clone the repository:
   ```
   git clone <repository-url>
   cd flower-distribution-tracker
   ```

2. Navigate to the backend directory and install the required dependencies:
   ```
   cd backend
   pip install -r requirements.txt
   ```

3. Run the Flask application:
   ```
   python app.py
   ```

4. Open your browser and go to `http://127.0.0.1:5000` to access the application.

## Usage
- Add retailer information in the provided input fields.
- Use the calculator to determine the total quantities of Mallige and Jaji.
- Save the data to the database for future reference.

## Contributing
Contributions are welcome! Please submit a pull request or open an issue for any enhancements or bug fixes.
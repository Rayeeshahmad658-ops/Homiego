# Homiego - Local Project Setup

## Requirements
- Windows 10/11
- Python 3.12 recommended

## Start backend
1. Open this `backend` folder in File Explorer.
2. Click the address bar, type `cmd`, press Enter.
3. Run:
   `py -3.12 -m pip install -r requirements.txt`
4. Run:
   `py -3.12 -m uvicorn main:app --reload`
5. Open `http://127.0.0.1:8000/docs` to verify the API.

## Start frontend
Keep the backend terminal running. Open a second terminal in the `slide2` folder and run:
`py -3.12 -m http.server 5500`
Then open `http://127.0.0.1:5500/html1.html`.

The frontend uses `api.js` and the FastAPI backend. Do not open the HTML file directly with `file://`.

## Test accounts
Register one account with role `owner` to publish listings, and another with role `student` to browse, favourite, and review. Use your own email/password.

## Database
The existing `homiego.db` is retained. Back it up before making manual database changes.

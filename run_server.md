# How to Run the Iron-Hub Backend Server

Follow these steps to start the Flask backend server.

### 1. Open a Terminal
Open PowerShell and navigate to the project folder:
```powershell
cd "C:\Users\patel\Desktop\6th Sem Project\Iron-Hub\Iron-Hub>"
```

### 2. Activate the Python Virtual Environment
If the project already has a `venv` folder, activate it:
```powershell
.\venv\Scripts\activate
```

If there is no `venv` yet, create one and activate it:
```powershell
python -m venv venv
.\venv\Scripts\activate
```

### 3. Install Python Dependencies
Install the required packages:
```powershell
pip install flask pymysql
```

If your project has a `requirements.txt` later, use:
```powershell
pip install -r requirements.txt
```

### 4. Prepare the Database
Make sure your MySQL server is running and the database is configured in either `connection.py` or `localhot.py`.

If you are using the local MySQL connection, open `app.py` and confirm the import is set correctly:
```python
from connection import db_connection  # local MySQL
# from localhot import db_connection  # cloud MySQL
```

If you want to run with the cloud database, keep:
```python
from localhot import db_connection
```

Then apply the schema if needed using MySQL:
```powershell
mysql -u your_user -p < schema.sql
```

### 5. Start the Flask Server
Run the backend with:
```powershell
python app.py
```

If the application uses the Flask development server, you should see output like:
```text
* Running on http://127.0.0.1:5000/
```

### 6. Open the Application
Open your browser and visit:
[http://127.0.0.1:5000](http://127.0.0.1:5000)

### 7. Confirm the Backend APIs
The backend is now running and should serve features such as:
- Membership expiry check
- Email notification preferences
- Live chat
- BMI calculator
- Report export

---

### Troubleshooting
- If activation fails, make sure PowerShell execution policy allows script execution.
- If dependencies are missing, rerun `pip install flask pymysql`.
- If the database connection fails, verify MySQL credentials in `connection.py` or `localhot.py`.
- If the port is already in use, stop the process using port 5000 or change the Flask port in `app.py`.

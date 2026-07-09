import pymysql.cursors

def db_connection():
    conn = pymysql.connect(
        host="your_host",
        user="your_username",
        password="your_password",
        database="your_database_name",
        cursorclass=pymysql.cursors.DictCursor
    )
    return conn 
import pymysql.cursors


def db_connection():
    conn = pymysql.connect(
        host="localhost",
        user="root",
        password="Patel@@2112",
        database="gym_management",
        cursorclass=pymysql.cursors.DictCursor
    )
    return conn 

import pymysql.cursors

def db_connection():
    conn = pymysql.connect(
        host="mysql-1e100372-developer1-e1bc.g.aivencloud.com",
        user="avnadmin",
        password="AVNS_7MCekzuveaCeqc69phB",
        database="gym_management",
        port=27075,
        ssl={"ssl": {}},
        cursorclass=pymysql.cursors.DictCursor
    )
    return conn

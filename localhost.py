import pymysql.cursors

def db_connection():
    conn = pymysql.connect(
        host="mysql-1e100372-developer1-e1bc.g.aivencloud.com",
        user="avnadmin",
        password="patel_pmp@0304",
        database="gym_management",
        port=27075,
        ssl={"ssl": {}},
        cursorclass=pymysql.cursors.DictCursor
        )
    return conn 

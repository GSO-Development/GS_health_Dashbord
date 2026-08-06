import pymysql
try:
    conn = pymysql.connect(host='localhost', user='root', password='', database='gsh_dashboard')
    print("MySQL Connection Success!")
    conn.close()
except Exception as e:
    print("MySQL Connection Error:", str(e))

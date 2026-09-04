from psycopg import AsyncConnection
from pathlib import Path
from dotenv import load_dotenv
import os

load_dotenv(Path(__file__).parent.parent / '.env')


async def connection():
    conn = await AsyncConnection.connect(
        host=os.getenv('DB_HOST'),
        user=os.getenv('DB_USER'),
        password=os.getenv('DB_PASS'),
        dbname=os.getenv('DB_NAME'),
        port=int(os.getenv('DB_PORT', 5432))
    )
    print('database successfully connected', os.getenv('DB_NAME'))
    return conn




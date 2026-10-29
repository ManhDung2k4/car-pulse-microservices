import requests
from bs4 import BeautifulSoup
import time
from apscheduler.schedulers.blocking import BlockingScheduler
from sqlalchemy import create_engine, text
from kafka import KafkaProducer
import json
import os
from dotenv import load_dotenv

# Load biến môi trường
load_dotenv()


DB_URL = os.getenv("DATABASE_URL")
KAFKA_SERVER = os.getenv("KAFKA_BOOTSTRAP_SERVERS", "localhost:9092")
RSS_URL = "https://vnexpress.net/rss/oto-xe-may.rss"

engine = create_engine(DB_URL)
producer = KafkaProducer(
    bootstrap_servers=[KAFKA_SERVER], 
    value_serializer=lambda v: json.dumps(v).encode('utf-8')
)

def run_crawler_job():
    print(f"[{time.strftime('%H:%M:%S')}] 🔄 Bắt đầu crawl dữ liệu báo chí...")
    try:
        response = requests.get(RSS_URL, timeout=15)
        soup = BeautifulSoup(response.content, 'xml')
        items = soup.find_all('item')
        
        new_articles_count = 0
        with engine.begin() as conn: # Dùng engine.begin() để auto-commit
            for item in items:
                link = item.link.text if item.link else ""
                
                # Check trùng lặp
                check_query = text("SELECT id FROM market_news WHERE link = :link")
                exists = conn.execute(check_query, {"link": link}).fetchone()
                
                if not exists:
                    title = item.title.text if item.title else ""
                    desc = BeautifulSoup(item.description.text, "html.parser").get_text(strip=True) if item.description else ""
                    pub_date = item.pubDate.text if item.pubDate else ""
                    
                    insert_query = text("""
                        INSERT INTO market_news (title, description, link, pub_date) 
                        VALUES (:title, :desc, :link, :pub_date)
                    """)
                    conn.execute(insert_query, {"title": title, "desc": desc, "link": link, "pub_date": pub_date})
                    new_articles_count += 1
        
        # Bắn sự kiện Kafka nếu có bài mới để AI Service (main.py) biết mà tải lại RAG
        if new_articles_count > 0:
            print(f"✅ Đã lưu {new_articles_count} bài báo mới!")
            producer.send('market_events', {"action": "REFRESH_RAG_KNOWLEDGE", "timestamp": time.time()})
            producer.flush()
        else:
            print("💤 Không có tin tức mới.")
            
    except Exception as e:
        print(f"❌ Lỗi Crawler: {e}")

if __name__ == "__main__":
    print("🚀 Nền tảng Crawler Service Đã Khởi Động...")
    run_crawler_job() # Chạy ngay mẻ đầu tiên
    
    # Dùng APScheduler thay vì while True: sleep() để quản lý tác vụ ngầm chuyên nghiệp hơn
    scheduler = BlockingScheduler()
    scheduler.add_job(run_crawler_job, 'interval', minutes=30)
    
    try:
        scheduler.start()
    except (KeyboardInterrupt, SystemExit):
        pass
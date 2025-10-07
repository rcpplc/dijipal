#!/usr/bin/env python3
"""
Tour Dates Status Update Cron Job
Bu script günlük olarak çalıştırılarak geçmiş tour tarihlerini pasif yapar
"""

import requests
import sys
import json
import logging
from datetime import datetime

# Logging ayarları
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('/app/logs/cron_tour_dates.log'),
        logging.StreamHandler(sys.stdout)
    ]
)

logger = logging.getLogger(__name__)

def update_tour_dates_status():
    """Cron job endpoint'ini çağırarak tour tarihlerini güncelle"""
    
    # Backend URL'i environment'dan al veya default kullan
    backend_url = "http://localhost:8001"  # Internal URL
    cron_endpoint = f"{backend_url}/api/cron/update-tour-dates-status"
    
    try:
        logger.info("🕒 Starting tour dates status update cron job...")
        
        # HTTP request gönder
        response = requests.post(
            cron_endpoint,
            headers={'Content-Type': 'application/json'},
            timeout=60  # 1 dakika timeout
        )
        
        if response.status_code == 200:
            result = response.json()
            
            if result.get('success'):
                stats = result.get('stats', {})
                logger.info("✅ Tour dates update completed successfully")
                logger.info(f"   - Total tour dates: {stats.get('total_tour_dates', 0)}")
                logger.info(f"   - Dates deactivated: {stats.get('dates_deactivated', 0)}")
                logger.info(f"   - Active dates remaining: {stats.get('active_dates_remaining', 0)}")
                logger.info(f"   - Execution date: {stats.get('execution_date', 'N/A')}")
                
                return True
            else:
                logger.error(f"❌ Cron job failed: {result.get('message', 'Unknown error')}")
                return False
        else:
            logger.error(f"❌ HTTP Error {response.status_code}: {response.text}")
            return False
            
    except requests.exceptions.Timeout:
        logger.error("❌ Cron job timeout (60s) - Backend may be slow")
        return False
    except requests.exceptions.ConnectionError:
        logger.error("❌ Connection error - Backend may be down")
        return False
    except Exception as e:
        logger.error(f"❌ Cron job error: {str(e)}")
        return False

if __name__ == "__main__":
    logger.info("=" * 50)
    logger.info("Tour Dates Status Update Cron Job Started")
    logger.info("=" * 50)
    
    success = update_tour_dates_status()
    
    if success:
        logger.info("✅ Cron job completed successfully")
        sys.exit(0)
    else:
        logger.error("❌ Cron job failed")
        sys.exit(1)
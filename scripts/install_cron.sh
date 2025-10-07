#!/bin/bash
"""
Tour Dates Cron Job Installer
Bu script günlük cron job'u sistem crontab'ına ekler
"""

echo "🕒 Installing tour dates status update cron job..."

# Log dizini oluştur
mkdir -p /app/logs

# Python script'i executable yap
chmod +x /app/scripts/update_tour_dates_cron.py

# Mevcut crontab'ı yedekle
echo "📦 Backing up current crontab..."
crontab -l > /app/scripts/crontab_backup.txt 2>/dev/null || echo "No existing crontab found"

# Yeni cron entry'i oluştur
CRON_ENTRY="0 2 * * * /usr/bin/python3 /app/scripts/update_tour_dates_cron.py >> /app/logs/cron_tour_dates.log 2>&1"

# Cron job'u ekle (eğer zaten yoksa)
echo "🔧 Adding cron job..."
(crontab -l 2>/dev/null; echo "$CRON_ENTRY") | crontab -

echo "✅ Cron job installed successfully!"
echo "📅 Schedule: Daily at 02:00 AM"
echo "📝 Logs: /app/logs/cron_tour_dates.log"
echo ""
echo "To verify installation, run: crontab -l"
echo "To manually test, run: python3 /app/scripts/update_tour_dates_cron.py"
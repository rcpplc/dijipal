import requests
import json

def test_specific_cabin_tour():
    """Test a specific cabin-based tour for detailed pricing"""
    base_url = "https://tourboost.preview.emergentagent.com"
    api_url = f"{base_url}/api"
    
    # Test the first cabin-based tour from our results
    tour_id = "3ded39ad-36a4-47d1-87b9-7baeb5f00f55"  # Fethiye – Göcek 3 Gece 4 Gün Kabin Turu
    
    print(f"🎯 DETAYLI KABIN BAZLI TUR TESTİ")
    print("=" * 70)
    print(f"Tur ID: {tour_id}")
    print("=" * 70)
    
    try:
        # Get tour details
        response = requests.get(f"{api_url}/tours/{tour_id}", timeout=30)
        
        if response.status_code == 200:
            tour_data = response.json()
            
            print(f"✅ Tur Detayları Alındı")
            print(f"📋 Tur Başlığı: {tour_data.get('title')}")
            print(f"📍 Lokasyon: {tour_data.get('location')}")
            print(f"🏷️  Rezervasyon Tipi: {tour_data.get('reservation_type')}")
            print(f"📝 Kısa Açıklama: {tour_data.get('short_description')}")
            
            # Check tour dates and pricing
            tour_dates = tour_data.get('tour_dates', [])
            print(f"\n📅 Toplam {len(tour_dates)} tarih bulundu:")
            
            for i, date in enumerate(tour_dates, 1):
                print(f"\n   {i}. Tarih: {date.get('start_date')}")
                print(f"      • Tek Kişilik Kabin: ₺{date.get('single_cabin_price', 0):,.0f}")
                print(f"      • Çift Kişilik Kabin: ₺{date.get('double_cabin_price', 0):,.0f}")
                print(f"      • Kabin Kapasitesi: {date.get('capacity', 0)}")
                print(f"      • Aktif: {'Evet' if date.get('is_active', True) else 'Hayır'}")
                print(f"      • Tarih ID: {date.get('id')}")
            
            # Test tour dates endpoint
            print(f"\n🔍 Tour Dates Endpoint Testi:")
            dates_response = requests.get(f"{api_url}/tours/{tour_id}/dates", timeout=30)
            
            if dates_response.status_code == 200:
                dates_data = dates_response.json()
                print(f"✅ GET /api/tours/{tour_id}/dates başarılı")
                print(f"📊 {len(dates_data)} tarih döndürüldü")
                
                # Show first date details
                if dates_data:
                    first_date = dates_data[0]
                    print(f"\n📋 İlk Tarih Detayları:")
                    print(f"   • ID: {first_date.get('id')}")
                    print(f"   • Başlangıç Tarihi: {first_date.get('start_date')}")
                    print(f"   • Tek Kabin Fiyatı: ₺{first_date.get('single_cabin_price', 0):,.0f}")
                    print(f"   • Çift Kabin Fiyatı: ₺{first_date.get('double_cabin_price', 0):,.0f}")
                    print(f"   • Mevcut Kabin: {first_date.get('available_cabins', 0)}")
                    print(f"   • Max Kişi: {first_date.get('max_persons', 0)}")
                    print(f"   • Kişi Başı Fiyat: ₺{first_date.get('person_price', 0):,.0f}")
            else:
                print(f"❌ GET /api/tours/{tour_id}/dates başarısız: {dates_response.status_code}")
            
            print(f"\n🛒 SEPETE EKLEME İÇİN ÖRNEK VERİ:")
            print("=" * 50)
            if tour_dates:
                example_date = tour_dates[0]
                print(f"Tour ID: {tour_id}")
                print(f"Tour Date ID: {example_date.get('id')}")
                print(f"Tarih: {example_date.get('start_date')}")
                print(f"Tek Kabin Fiyatı: ₺{example_date.get('single_cabin_price', 0):,.0f}")
                print(f"Çift Kabin Fiyatı: ₺{example_date.get('double_cabin_price', 0):,.0f}")
                print(f"Kabin Sayısı: 1 (örnek)")
                print(f"Kabin Tipi: single veya double")
                
                # Calculate example total prices
                single_total = example_date.get('single_cabin_price', 0) * 1
                double_total = example_date.get('double_cabin_price', 0) * 1
                print(f"\nÖrnek Toplam Fiyatlar:")
                print(f"• 1 Tek Kabin: ₺{single_total:,.0f}")
                print(f"• 1 Çift Kabin: ₺{double_total:,.0f}")
            
        else:
            print(f"❌ Tur detayları alınamadı: {response.status_code}")
            print(f"Response: {response.text}")
            
    except Exception as e:
        print(f"❌ Hata oluştu: {str(e)}")

if __name__ == "__main__":
    test_specific_cabin_tour()
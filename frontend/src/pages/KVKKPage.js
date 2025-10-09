import React from "react";
import { Shield, FileText, Mail, CheckCircle, Info } from "lucide-react";

const KVKKPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Kişisel Verilerin Korunması (KVKK) Politikası
          </h1>
          <p className="text-gray-700 leading-relaxed max-w-3xl mx-auto text-lg">
            CRP TURİZM OTOMOTİV GIDA İNŞAAT REKLAM E-TİCARET VE İTHALAT İHRACAT LTD.ŞTİ. olarak,
            kişisel verilerinizin güvenliği bizim için son derece önemlidir. Bu politika, 6698
            sayılı Kişisel Verilerin Korunması Kanunu (“KVKK”) kapsamında veri işleme süreçlerimizi
            açıklar.
          </p>
          <div className="mt-4 text-sm text-gray-500">Yürürlük Tarihi: 09.10.2025</div>
        </div>

        {/* Section 1 */}
        <div className="bg-white rounded-xl shadow-sm p-10 mb-12 text-left">
          <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3">
            <Info className="text-blue-600" /> 1. Veri Sorumlusu
          </h2>
          <p className="text-gray-700 text-lg leading-relaxed mb-4">
            Veri Sorumlusu sıfatıyla hareket eden şirketimiz aşağıdaki bilgilere sahiptir:
          </p>
          <ul className="list-none space-y-2 text-gray-700 text-lg">
            <li><strong>Şirket Adı:</strong> CRP TURİZM OTOMOTİV GIDA İNŞAAT REKLAM E-TİCARET VE İTHALAT İHRACAT LTD.ŞTİ.</li>
            <li><strong>Adres:</strong> İstiklal Mah. Kavaklidere Cad. Yalçın İş Hanı No: 3 İç Kapı No: 13 Ümraniye / İstanbul</li>
            <li><strong>E-posta:</strong> info@mavibilet.com</li>
            <li><strong>Acente Belge No:</strong> 8720</li>
          </ul>
        </div>

        {/* Section 2 */}
        <div className="bg-white rounded-xl shadow-sm p-10 mb-12 text-left">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">
            2. Kişisel Verilerin Toplanma Yöntemi ve Hukuki Sebebi
          </h2>
          <p className="text-gray-700 text-lg leading-relaxed mb-4">
            Kişisel verileriniz, elektronik veya fiziksel ortamlarda; web sitemiz, çağrı merkezimiz,
            mobil uygulamalar, e-posta veya müşteri hizmetleri aracılığıyla otomatik ya da manuel
            yollarla toplanabilir.
          </p>
          <p className="text-gray-700 text-lg leading-relaxed">
            Bu veriler; kanunlarda öngörülen nedenlerle, sözleşmenin kurulması ve ifası, hukuki
            yükümlülüklerin yerine getirilmesi, meşru menfaatin korunması veya açık rızanız
            doğrultusunda işlenmektedir.
          </p>
        </div>

        {/* Section 3 */}
        <div className="bg-white rounded-xl shadow-sm p-10 mb-12 text-left">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">
            3. İşlenen Kişisel Veri Kategorileri
          </h2>
          <ul className="list-disc pl-6 text-gray-700 text-lg space-y-2">
            <li>Kimlik Bilgileri (Ad, soyad, T.C. kimlik numarası, doğum tarihi vb.)</li>
            <li>İletişim Bilgileri (Telefon, e-posta, adres)</li>
            <li>Rezervasyon Bilgileri (tur, tekne, tarih, ödeme bilgileri)</li>
            <li>Finansal Bilgiler (fatura, IBAN, ödeme kayıtları)</li>
            <li>Görsel ve İşitsel Veriler (profil fotoğrafı, çağrı kayıtları)</li>
            <li>Elektronik Veri (IP adresi, cihaz bilgisi, çerez verileri)</li>
          </ul>
        </div>

        {/* Section 4 */}
        <div className="bg-white rounded-xl shadow-sm p-10 mb-12 text-left">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">
            4. Kişisel Verilerin İşlenme Amaçları
          </h2>
          <p className="text-gray-700 text-lg leading-relaxed mb-4">
            Şirketimiz kişisel verilerinizi aşağıdaki amaçlarla işlemektedir:
          </p>
          <ul className="list-disc pl-6 text-gray-700 text-lg space-y-2">
            <li>Rezervasyon ve satış işlemlerinin yürütülmesi</li>
            <li>Tur, ulaşım ve konaklama hizmetlerinin planlanması</li>
            <li>Müşteri memnuniyetinin ölçülmesi ve artırılması</li>
            <li>Yasal yükümlülüklerin yerine getirilmesi</li>
            <li>Finansal kayıtların tutulması ve denetim faaliyetleri</li>
            <li>Pazarlama faaliyetleri (onay alınmış olması halinde)</li>
          </ul>
        </div>

        {/* Section 5 */}
        <div className="bg-white rounded-xl shadow-sm p-10 mb-12 text-left">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">
            5. Kişisel Verilerin Aktarımı
          </h2>
          <p className="text-gray-700 text-lg leading-relaxed mb-4">
            Kişisel verileriniz, sadece yukarıda belirtilen amaçların yerine getirilmesi için;
          </p>
          <ul className="list-disc pl-6 text-gray-700 text-lg space-y-2">
            <li>İş ortakları ve tedarikçilerimize,</li>
            <li>Turizm, finans, bilişim hizmeti sağlayıcılarına,</li>
            <li>Yasal zorunluluk halinde resmi kurum ve kuruluşlara,</li>
            <li>Yurt dışı veri saklama sistemleri (bulut hizmetleri) sağlayıcılarına</li>
          </ul>
          <p className="text-gray-700 text-lg mt-4">
            aktarılabilir. Tüm aktarım süreçlerinde KVKK madde 8 ve 9 hükümlerine uygun hareket edilir.
          </p>
        </div>

        {/* Section 6 */}
        <div className="bg-white rounded-xl shadow-sm p-10 mb-12 text-left">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">
            6. Veri Saklama Süreleri
          </h2>
          <p className="text-gray-700 text-lg leading-relaxed mb-4">
            Kişisel verileriniz, ilgili mevzuatta öngörülen süreler boyunca veya işleme amacının
            gerektirdiği süre kadar saklanır. Süre sonunda veriler, anonim hale getirilir veya
            güvenli bir şekilde imha edilir.
          </p>
          <ul className="list-disc pl-6 text-gray-700 text-lg space-y-2">
            <li>Rezervasyon kayıtları: 10 yıl</li>
            <li>Faturalama ve mali veriler: 5 yıl</li>
            <li>Pazarlama onay verileri: 2 yıl</li>
            <li>Çerez kayıtları: 1 yıl</li>
          </ul>
        </div>

        {/* Section 7 */}
        <div className="bg-white rounded-xl shadow-sm p-10 mb-12 text-left">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">
            7. Veri Sahibi Olarak Haklarınız
          </h2>
          <p className="text-gray-700 text-lg leading-relaxed mb-4">
            6698 sayılı Kanun’un 11. maddesi uyarınca aşağıdaki haklara sahipsiniz:
          </p>
          <ul className="list-disc pl-6 text-gray-700 text-lg space-y-2">
            <li>Kişisel verilerinizin işlenip işlenmediğini öğrenme,</li>
            <li>İşlenen veriler hakkında bilgi talep etme,</li>
            <li>Verilerin işlenme amacını ve uygun kullanılıp kullanılmadığını öğrenme,</li>
            <li>Yurt içi/yurt dışı veri aktarımı yapılan kişileri bilme,</li>
            <li>Eksik veya yanlış işlenmiş verilerin düzeltilmesini talep etme,</li>
            <li>Verilerin silinmesini veya yok edilmesini isteme,</li>
            <li>İşleme sonuçlarına itiraz etme ve zararın giderilmesini talep etme.</li>
          </ul>
        </div>

        {/* Section 8 */}
        <div className="bg-white rounded-xl shadow-sm p-10 mb-12 text-left">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">
            8. Başvuru Yöntemleri
          </h2>
          <p className="text-gray-700 text-lg leading-relaxed mb-4">
            Haklarınızı kullanmak için aşağıdaki iletişim kanallarından bize başvurabilirsiniz:
          </p>
          <ul className="list-none text-gray-700 text-lg space-y-2">
            <li> E-posta: <a href="mailto:info@mavibilet.com" className="text-blue-600 font-semibold">info@mavibilet.com</a></li>
            <li> Adres: İstiklal Mah. Kavaklidere Cad. Yalçın İş Hanı No: 3 İç Kapı No: 13 Ümraniye / İstanbul</li>
            <li> Telefon: +90 (850) 309 1969</li>
          </ul>
          <p className="text-gray-700 text-lg leading-relaxed mt-4">
            Başvurularınız, en geç 30 gün içinde ücretsiz olarak sonuçlandırılır.
          </p>
        </div>

        {/* Section 9 */}
        <div className="bg-blue-600 rounded-xl p-10 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">Veri Güvenliği Taahhüdümüz</h2>
          <p className="text-xl text-blue-100 mb-8 max-w-3xl mx-auto">
            Tüm kişisel verileriniz, ulusal ve uluslararası güvenlik standartlarına uygun olarak
            korunmaktadır. Şirketimiz, gizlilik ve güvenlik konusunda tam sorumluluk taşımaktadır.
          </p>
          <button
            onClick={() => (window.location.href = "mailto:info@mavibilet.com")}
            className="bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-gray-100 transition-colors shadow-lg"
          >
            Bizimle İletişime Geçin
          </button>
        </div>
      </div>
    </div>
  );
};

export default KVKKPage;

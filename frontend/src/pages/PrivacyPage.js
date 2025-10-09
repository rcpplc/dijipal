import React from "react";
import { Shield, Mail, Database, Lock, UserCheck, Settings } from "lucide-react";

const PrivacyPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Gizlilik Politikası
          </h1>
          <p className="text-gray-700 leading-relaxed max-w-3xl mx-auto text-lg">
            Kişisel verilerinizin gizliliği ve güvenliği bizim için son derece önemlidir.
            Bu Gizlilik Politikası, mavibilet.com üzerinden elde edilen verilerin hangi amaçlarla
            işlendiğini, korunduğunu ve haklarınızı açıklar.
          </p>
          <div className="mt-4 text-sm text-gray-500">
            Yürürlük Tarihi: 09.10.2025
          </div>
        </div>

        {/* Data Controller */}
        <div className="bg-white rounded-xl shadow-sm p-10 mb-12 text-left">
          <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3">
            <Shield className="text-blue-600" /> Veri Sorumlusu
          </h2>
          <p className="text-gray-700 text-lg mb-4">
            6698 sayılı Kişisel Verilerin Korunması Kanunu (“KVKK”) uyarınca kişisel verilerinizin
            veri sorumlusu olarak;
          </p>
          <div className="space-y-2 text-gray-700 text-lg">
            <p>
              <strong>Şirket:</strong> CRP TURİZM OTOMOTİV GIDA İNŞAAT REKLAM
              E-TİCARET VE İTHALAT İHRACAT LTD. ŞTİ.
            </p>
            <p>
              <strong>Adres:</strong> İstiklal Mah. Kavaklıdere Cad. Yalçın İş Hanı No:3 İç Kapı No:13,
              Ümraniye / İstanbul
            </p>
            <p>
              <strong>E-posta:</strong> info@mavibilet.com
            </p>
            <p>
              <strong>Acente Bilgileri:</strong> Dijital Turizm Seyahat Acentası – Belge No: 8720
            </p>
          </div>
        </div>

        {/* Collected Data */}
        <div className="bg-white rounded-xl shadow-sm p-10 mb-12 text-left">
          <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3">
            <Database className="text-blue-600" /> Toplanan Kişisel Veriler
          </h2>
          <p className="text-gray-700 text-lg mb-6">
            Aşağıdaki kişisel verileriniz, sunulan hizmetlerden yararlanabilmeniz amacıyla toplanmaktadır:
          </p>
          <ul className="list-disc pl-8 space-y-3 text-gray-700 text-lg">
            <li>Kimlik Bilgileri (Ad, soyad, doğum tarihi, TC kimlik numarası)</li>
            <li>İletişim Bilgileri (Telefon, e-posta, adres)</li>
            <li>Ödeme Bilgileri (Kredi kartı, fatura adresi)</li>
            <li>Teknik Bilgiler (IP adresi, tarayıcı verileri, çerez kayıtları)</li>
          </ul>
        </div>

        {/* Processing Purposes */}
        <div className="bg-white rounded-xl shadow-sm p-10 mb-12 text-left">
          <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3">
            <Settings className="text-blue-600" /> Kişisel Verilerin İşlenme Amaçları
          </h2>
          <ul className="list-disc pl-8 space-y-3 text-gray-700 text-lg leading-relaxed">
            <li>Rezervasyon ve ödeme işlemlerinin gerçekleştirilmesi</li>
            <li>Müşteri hizmetleri ve destek faaliyetlerinin yürütülmesi</li>
            <li>Yasal yükümlülüklerin yerine getirilmesi</li>
            <li>Hizmet kalitesinin artırılması ve kullanıcı deneyiminin geliştirilmesi</li>
            <li>Kampanya, duyuru ve bilgilendirme yapılması (onay verilmişse)</li>
          </ul>
        </div>

        {/* Data Transfer */}
        <div className="bg-white rounded-xl shadow-sm p-10 mb-12 text-left">
          <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3">
            <Mail className="text-blue-600" /> Verilerin Aktarımı
          </h2>
          <p className="text-gray-700 text-lg leading-relaxed">
            Kişisel verileriniz yalnızca aşağıdaki durumlarda üçüncü kişilerle paylaşılabilir:
          </p>
          <ul className="list-disc pl-8 space-y-3 text-gray-700 text-lg leading-relaxed mt-4">
            <li>Yasal zorunluluklar gereği resmi kurumlara bildirim yapılması</li>
            <li>Rezervasyon sürecinde hizmet sağlayıcılarla gerekli bilgiler paylaşılması</li>
            <li>Finansal işlemler için ödeme altyapısı sağlayıcılarıyla veri aktarımı</li>
          </ul>
          <p className="text-gray-700 text-lg leading-relaxed mt-4">
            Şirket, verilerinizi yurt içinde veya yurt dışında güvenli sunucularda saklayabilir.
          </p>
        </div>

        {/* Data Security */}
        <div className="bg-white rounded-xl shadow-sm p-10 mb-12 text-left">
          <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3">
            <Lock className="text-blue-600" /> Veri Güvenliği
          </h2>
          <p className="text-gray-700 text-lg leading-relaxed mb-4">
            Şirketimiz, kişisel verilerinizin gizliliğini korumak amacıyla gerekli teknik ve idari
            tedbirleri almaktadır:
          </p>
          <ul className="list-disc pl-8 space-y-3 text-gray-700 text-lg leading-relaxed">
            <li>SSL sertifikası ile şifreli veri aktarımı</li>
            <li>Yetkisiz erişimlere karşı güvenlik duvarı koruması</li>
            <li>Düzenli sistem güncellemeleri ve güvenlik testleri</li>
            <li>Veri erişiminde yetkilendirme kontrolü</li>
          </ul>
        </div>

        {/* Data Retention */}
        <div className="bg-white rounded-xl shadow-sm p-10 mb-12 text-left">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">
            Kişisel Verilerin Saklanma Süresi
          </h2>
          <p className="text-gray-700 text-lg leading-relaxed">
            Kişisel verileriniz, ilgili mevzuatta belirtilen süreler boyunca saklanır. Süre bitiminde
            veya işleme amacı ortadan kalktığında, veriler güvenli şekilde imha edilir.
          </p>
          <ul className="list-disc pl-8 space-y-2 text-gray-700 text-lg mt-4">
            <li>Rezervasyon ve ödeme kayıtları: 10 yıl</li>
            <li>Fatura ve finansal belgeler: 5 yıl</li>
            <li>Pazarlama izinleri: 2 yıl</li>
            <li>Sunucu log kayıtları: 1 yıl</li>
          </ul>
        </div>

        {/* User Rights */}
        <div className="bg-white rounded-xl shadow-sm p-10 mb-12 text-left">
          <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3">
            <UserCheck className="text-blue-600" /> KVKK Kapsamındaki Haklarınız
          </h2>
          <p className="text-gray-700 text-lg leading-relaxed mb-4">
            6698 sayılı KVKK kapsamında aşağıdaki haklara sahipsiniz:
          </p>
          <ul className="list-disc pl-8 space-y-3 text-gray-700 text-lg leading-relaxed">
            <li>Kişisel verilerinizin işlenip işlenmediğini öğrenme</li>
            <li>İşlenen veriler hakkında bilgi talep etme</li>
            <li>Verilerin işlenme amacını ve kullanımını öğrenme</li>
            <li>Verilerin yurt içi veya yurt dışına aktarılıp aktarılmadığını öğrenme</li>
            <li>Eksik veya yanlış işlenen verilerin düzeltilmesini talep etme</li>
            <li>Verilerin silinmesini veya yok edilmesini isteme</li>
            <li>Otomatik sistemlerce analiz sonucu aleyhinize sonuç doğurmasına itiraz etme</li>
          </ul>
          <p className="text-gray-700 text-lg leading-relaxed mt-6">
            Bu haklarınızı kullanmak için kimliğinizi doğrulayan belgelerle birlikte{" "}
            <a
              href="mailto:mavibilet.com"
              className="text-blue-600 font-semibold hover:underline"
            >
              mailto:mavibilet.com
            </a>{" "}
            adresine yazılı olarak başvurabilirsiniz.
          </p>
        </div>

        {/* Cookie Policy */}
        <div className="bg-white rounded-xl shadow-sm p-10 mb-12 text-left">
          <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3">
            <Settings className="text-blue-600" /> Çerez (Cookie) Politikası
          </h2>
          <p className="text-gray-700 text-lg leading-relaxed mb-4">
            mavibilet.com, kullanıcı deneyimini geliştirmek amacıyla çerezleri (“cookies”) kullanır.
            Çerezler, tarayıcınız aracılığıyla cihazınıza kaydedilen küçük metin dosyalarıdır.
          </p>
          <ul className="list-disc pl-8 space-y-2 text-gray-700 text-lg">
            <li><strong>Gerekli Çerezler:</strong> Sitenin temel işlevlerinin çalışması için zorunludur.</li>
            <li><strong>Analitik Çerezler:</strong> Site performansını analiz etmek ve istatistik oluşturmak için kullanılır.</li>
            <li><strong>Pazarlama Çerezleri:</strong> Onay vermeniz halinde reklam deneyiminizi kişiselleştirmek için kullanılır.</li>
          </ul>
          <p className="text-gray-700 text-lg leading-relaxed mt-4">
            Tarayıcı ayarlarınızı değiştirerek çerezleri devre dışı bırakabilir veya silebilirsiniz.
          </p>
        </div>

        {/* Contact */}
        <div className="bg-blue-600 rounded-xl p-10 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">Gizlilik Hakkında Sorularınız</h2>
          <p className="text-xl text-blue-100 mb-8 max-w-3xl mx-auto">
            Kişisel verilerinizin korunmasıyla ilgili tüm taleplerinizi bizimle paylaşabilirsiniz.
          </p>
          <button
            onClick={() => (window.location.href = "/contact")}
            className="bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-gray-100 transition-colors shadow-lg"
          >
            Bizimle İletişime Geçin
          </button>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPage;

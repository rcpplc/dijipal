import React from "react";
import { Cookie, Settings, Shield, Info } from "lucide-react";

const CookiesPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">

          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Çerez (Cookie) Politikası
          </h1>
          <p className="text-gray-700 leading-relaxed max-w-3xl mx-auto text-lg">
            Bu politika, mavibilet.com üzerinden kullanılan çerezlerin türlerini, kullanım
            amaçlarını ve kullanıcıların çerez tercihlerini nasıl yönetebileceklerini açıklar.
          </p>
          <div className="mt-4 text-sm text-gray-500">
            Yürürlük Tarihi: 09.10.2025
          </div>
        </div>

        {/* What are cookies */}
        <div className="bg-white rounded-xl shadow-sm p-10 mb-12 text-left">
          <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3">
            <Info className="text-blue-600" /> Çerez Nedir?
          </h2>
          <p className="text-gray-700 text-lg leading-relaxed mb-4">
            Çerezler, bir web sitesini ziyaret ettiğinizde tarayıcınız aracılığıyla bilgisayarınıza
            veya mobil cihazınıza kaydedilen küçük metin dosyalarıdır. Bu dosyalar, web sitesinin
            çalışmasını sağlamak, tercihlerinizi hatırlamak, deneyiminizi kişiselleştirmek ve site
            performansını geliştirmek amacıyla kullanılır.
          </p>
          <p className="text-gray-700 text-lg leading-relaxed">
            Çerezler genellikle kullanıcı deneyimini geliştirmek, istatistiksel analiz yapmak,
            hizmet kalitesini artırmak ve kullanıcı davranışlarını anlamak için kullanılır.
          </p>
        </div>

        {/* Cookie Types */}
        <div className="bg-white rounded-xl shadow-sm p-10 mb-12 text-left">
          <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3">
            <Settings className="text-blue-600" /> Kullanılan Çerez Türleri
          </h2>

          <div className="space-y-8 text-gray-700 text-lg leading-relaxed">
            <div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-2">
                1. Gerekli (Zorunlu) Çerezler
              </h3>
              <p>
                Bu çerezler, web sitesinin temel işlevlerini yerine getirmesi için zorunludur.
                Oturum açma, güvenlik, form doldurma gibi işlemlerde kullanılır ve devre dışı
                bırakıldığında site düzgün çalışmaz.
              </p>
              <ul className="list-disc pl-6 mt-2">
                <li>Oturum yönetimi çerezleri</li>
                <li>Güvenlik doğrulama çerezleri</li>
                <li>Alışveriş sepeti ve dil tercihi çerezleri</li>
              </ul>
            </div>

            <div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-2">
                2. Analitik (Performans) Çerezleri
              </h3>
              <p>
                Ziyaretçilerin web sitesini nasıl kullandığını anlamak, performansı izlemek ve
                iyileştirmek için kullanılır. Bu çerezler anonim veriler toplar.
              </p>
              <ul className="list-disc pl-6 mt-2">
                <li>Google Analytics</li>
                <li>Sayfa görüntüleme ve tıklama istatistikleri</li>
                <li>Kullanıcı etkileşim analizleri</li>
              </ul>
            </div>

            <div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-2">
                3. Pazarlama (Reklam) Çerezleri
              </h3>
              <p>
                Kullanıcıların ilgi alanlarına göre reklam göstermek, kampanya performansını ölçmek
                ve reklam deneyimini kişiselleştirmek için kullanılır. Bu çerezler yalnızca açık
                onay ile etkinleştirilir.
              </p>
              <ul className="list-disc pl-6 mt-2">
                <li>Google Ads ve Facebook Pixel</li>
                <li>Yeniden hedefleme (retargeting) çerezleri</li>
                <li>Kişiselleştirilmiş reklam içerikleri</li>
              </ul>
            </div>

            <div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-2">
                4. Tercih (Fonksiyonel) Çerezleri
              </h3>
              <p>
                Web sitesindeki dil, bölge, tema gibi kullanıcı tercihlerini hatırlamak için
                kullanılır. Kullanıcı deneyimini kişiselleştirir ve siteyi tekrar ziyaret ettiğinizde
                daha kolay kullanım sağlar.
              </p>
              <ul className="list-disc pl-6 mt-2">
                <li>Dil ve bölge ayarları</li>
                <li>Arama filtreleri ve tercih kayıtları</li>
                <li>Tema ve görünüm tercihleri</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Cookie Management */}
        <div className="bg-white rounded-xl shadow-sm p-10 mb-12 text-left">
          <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3">
            <Shield className="text-blue-600" /> Çerez Yönetimi ve Kontrolü
          </h2>
          <p className="text-gray-700 text-lg leading-relaxed mb-4">
            Tarayıcı ayarlarınızı değiştirerek çerezleri kabul edebilir, reddedebilir veya mevcut
            çerezleri silebilirsiniz. Ancak gerekli çerezlerin devre dışı bırakılması durumunda
            web sitesinin bazı bölümleri düzgün çalışmayabilir.
          </p>

          <div className="grid md:grid-cols-3 gap-6 text-gray-700 text-lg">
            <div className="p-4 border border-gray-200 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-2">Google Chrome</h4>
              <p className="text-sm">
                Ayarlar → Gizlilik ve Güvenlik → Site Ayarları → Çerezler
              </p>
            </div>
            <div className="p-4 border border-gray-200 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-2">Mozilla Firefox</h4>
              <p className="text-sm">
                Seçenekler → Gizlilik ve Güvenlik → Çerezler ve Site Verileri
              </p>
            </div>
            <div className="p-4 border border-gray-200 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-2">Safari</h4>
              <p className="text-sm">
                Tercihler → Gizlilik → Çerezleri Yönet
              </p>
            </div>
          </div>

          <p className="text-gray-700 text-lg leading-relaxed mt-6">
            Ayrıca, çerez tercihlerinizi dilediğiniz zaman site üzerinde bulunan "Çerez Ayarları"
            panelinden değiştirebilirsiniz.
          </p>
        </div>

        {/* Legal Section */}
        <div className="bg-white rounded-xl shadow-sm p-10 mb-12 text-left">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Yasal Dayanak</h2>
          <p className="text-gray-700 text-lg leading-relaxed mb-4">
            Bu çerez politikası, 6698 sayılı Kişisel Verilerin Korunması Kanunu (“KVKK”) ve
            Avrupa Birliği Genel Veri Koruma Yönetmeliği (“GDPR”) hükümlerine uygun olarak
            hazırlanmıştır. Kullanıcılar, siteyi kullanmaya devam ederek bu politikayı kabul etmiş
            sayılır.
          </p>
          <p className="text-gray-700 text-lg leading-relaxed">
            Kişisel verilerinizin işlenmesi hakkında daha fazla bilgi için{" "}
            <a
              href="/privacy"
              className="text-blue-600 font-semibold hover:underline"
            >
              Gizlilik Politikamızı
            </a>{" "}
            inceleyebilirsiniz.
          </p>
        </div>

        {/* Contact Section */}
        <div className="bg-blue-600 rounded-xl p-10 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">Çerezlerle İlgili Sorularınız mı Var?</h2>
          <p className="text-xl text-blue-100 mb-8 max-w-3xl mx-auto">
            Çerez kullanımı, veri işleme veya gizlilikle ilgili tüm sorularınızı bizimle
            paylaşabilirsiniz.
          </p>
            <button
              onClick={() => window.location.href = '/contact'}
              className="bg-white text-blue-600 px-6 py-3 rounded-lg font-medium hover:bg-gray-100 transition-colors">
              İletişime geç
            </button>
        </div>
      </div>
    </div>
  );
};

export default CookiesPage;

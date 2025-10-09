import React from "react";
import {
  MapPin,
  Mail,
  Award,
} from "lucide-react";

const AboutPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Kullanım Şartları Sözleşmesi
          </h1>

          <div className="text-gray-700 leading-relaxed text-lg space-y-2 text-left max-w-2xl mx-auto">
            <p><strong>Yürürlük Tarihi:</strong> 09.10.2025</p>
          </div>
        </div>

        {/* Terms Sections */}
        <div className="bg-white rounded-xl shadow-sm p-12 mb-12 text-left space-y-10">
          <section>
            <h2 className="text-3xl font-bold text-gray-900 mb-6">1. Genel Hükümler</h2>
            <p className="text-gray-700 leading-relaxed text-lg">
              Bu Kullanım Şartları, mavibilet.com alan adı üzerinden hizmet veren web sitesi ve mobil
              platformları (bundan sonra “Site” olarak anılacaktır) üzerinden sunulan tüm hizmetlerin
              kullanımına ilişkin koşulları düzenler. Siteyi ziyaret eden, üye olan veya herhangi bir hizmeti
              kullanan her kişi (“Kullanıcı”) bu sözleşmede yer alan koşulları kabul etmiş sayılır.
            </p>
          </section>

          <section>
            <h2 className="text-3xl font-bold text-gray-900 mb-6">2. Hizmet Tanımı</h2>
            <p className="text-gray-700 text-lg leading-relaxed mb-4">
              mavibilet.com aşağıdaki dijital turizm çözümlerini sunan bir çevrimiçi platformdur:
            </p>
            <ul className="list-disc pl-8 space-y-2 text-gray-700 text-lg leading-relaxed">
              <li>Tekne kiralama</li>
              <li>Günübirlik tekne turları</li>
              <li>Kabin kiralama ve mavi yolculuk</li>
              <li>Etkinlik, ulaşım ve tur rezervasyon hizmetleri</li>
            </ul>
            <p className="text-gray-700 leading-relaxed text-lg mt-4">
              Site, kullanıcıların dijital ortamda rezervasyon yapabilmesini, ödeme işlemlerini gerçekleştirmesini ve
              hizmet sağlayıcılarla iletişim kurmasını sağlar.
            </p>
          </section>

          <section>
            <h2 className="text-3xl font-bold text-gray-900 mb-6">3. Kullanım Koşulları</h2>
            <ul className="list-disc pl-8 space-y-2 text-gray-700 text-lg leading-relaxed">
              <li>Kullanıcı, Site’yi yalnızca yasal ve kişisel amaçlarla kullanmayı kabul eder.</li>
              <li>Üyelik işlemlerinde beyan edilen tüm bilgiler doğru ve güncel olmalıdır.</li>
              <li>Kullanıcı, üçüncü kişilerin haklarını ihlal edecek hiçbir içerik paylaşamaz.</li>
              <li>Site’nin işleyişini engelleyecek veya manipüle edecek herhangi bir yazılım veya yöntem kullanamaz.</li>
              <li>Kullanıcı, hesabını başka kişilere devredemez veya satamaz.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-3xl font-bold text-gray-900 mb-6">4. Üyelik ve Hesap Güvenliği</h2>
            <ul className="list-disc pl-8 space-y-2 text-gray-700 text-lg leading-relaxed">
              <li>Kullanıcı adı ve şifre kişiye özeldir.</li>
              <li>Kullanıcı, hesabının güvenliğinden kendisi sorumludur.</li>
              <li>Şirket, kullanıcı hatalarından doğan kayıplardan sorumlu tutulamaz.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-3xl font-bold text-gray-900 mb-6">5. Rezervasyon ve Ödeme Koşulları</h2>
            <ul className="list-disc pl-8 space-y-2 text-gray-700 text-lg leading-relaxed">
              <li>Kullanıcı, yaptığı tüm rezervasyonların bağlayıcı olduğunu kabul eder.</li>
              <li>Ödemeler güvenli altyapı üzerinden gerçekleştirilir.</li>
              <li>İptal ve iade süreçleri, ilgili hizmetin “İptal ve İade Politikası”na tabidir.</li>
              <li>mavibilet.com fiyatlarda önceden haber vermeksizin değişiklik yapabilir.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-3xl font-bold text-gray-900 mb-6">6. İptal, Değişiklik ve İade Politikası</h2>
            <ul className="list-disc pl-8 space-y-2 text-gray-700 text-lg leading-relaxed">
              <li>Hizmet sağlayıcı tarafından belirlenen iptal koşulları geçerlidir.</li>
              <li>Kullanıcı iptal talebini sistem üzerinden iletmelidir.</li>
              <li>İade, ödeme yapılan yöntemle belirli bir süre içinde yapılır.</li>
              <li>Mücbir sebepler durumunda şirket sorumluluk kabul etmez.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-3xl font-bold text-gray-900 mb-6">7. Fikri ve Sınai Mülkiyet Hakları</h2>
            <p className="text-gray-700 text-lg leading-relaxed">
              Site içeriği (tasarım, logo, yazılım, metin, görsel vb.) CRP TURİZM LTD. ŞTİ.’ye aittir.
              İzinsiz kopyalanamaz, çoğaltılamaz veya ticari amaçla kullanılamaz. mavibilet.com markası tescillidir.
            </p>
          </section>

          <section>
            <h2 className="text-3xl font-bold text-gray-900 mb-6">8. Sorumluluk Reddi</h2>
            <p className="text-gray-700 text-lg leading-relaxed">
              mavibilet.com, kullanıcı ile hizmet sağlayıcı arasında aracılık hizmeti sunar.
              Şirket, hizmetin performansı veya içeriğiyle ilgili doğrudan sorumluluk taşımaz.
            </p>
          </section>

          <section>
            <h2 className="text-3xl font-bold text-gray-900 mb-6">9. Veri Gizliliği ve KVKK</h2>
            <p className="text-gray-700 text-lg leading-relaxed">
              Kullanıcı verileri 6698 sayılı Kişisel Verilerin Korunması Kanunu kapsamında korunur.
              Daha fazla bilgi için{" "}
              <a
                href="/kvkk"
                className="text-blue-600 hover:underline font-semibold"
              >
                Kişisel Verilerin Korunması Politikası
              </a>{" "}
              sayfasını ziyaret edebilirsiniz.
            </p>
          </section>

          <section>
            <h2 className="text-3xl font-bold text-gray-900 mb-6">10. İletişim ve Bildirimler</h2>
            <ul className="pl-8 text-gray-700 text-lg leading-relaxed space-y-2">
              <li> <strong>Adres:</strong> İstiklal Mah. Kavaklıdere Cad. Yalçın İş Hanı No: 3 İç Kapı No: 13, Ümraniye / İstanbul</li>
              <li> <strong>E-posta:</strong> info@mavibilet.com</li>
              <li> <strong>Telefon:</strong> +90 (850) 309 1969</li>
            </ul>
          </section>

          <section>
            <h2 className="text-3xl font-bold text-gray-900 mb-6">11. Uyuşmazlıkların Çözümü</h2>
            <p className="text-gray-700 text-lg leading-relaxed">
              Uyuşmazlık durumunda Türkiye Cumhuriyeti kanunları uygulanır ve İstanbul (Ümraniye)
              Mahkemeleri yetkilidir.
            </p>
          </section>

          <section>
            <h2 className="text-3xl font-bold text-gray-900 mb-6">12. Yürürlük</h2>
            <p className="text-gray-700 text-lg leading-relaxed">
              Bu sözleşme, mavibilet.com adresinde yayımlandığı tarihte yürürlüğe girer.
              Siteyi kullanmaya devam eden kullanıcı, hükümleri okumuş ve kabul etmiş sayılır.
            </p>
          </section>
        </div>

        {/* Company Info */}
        <div className="bg-white rounded-xl shadow-sm p-10 mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Kurumsal Bilgilerimiz
          </h2>

          <div className="grid md:grid-cols-2 gap-10">
            <div>
              <div className="flex items-start space-x-3 mb-6">
                <MapPin className="w-6 h-6 text-blue-600 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-gray-900 text-lg mb-2">Adres</h3>
                  <p className="text-gray-700 leading-relaxed">
                    İstiklal Mah. Kavaklidere Cad. Yalçın İş Hanı No: 3 İç Kapı No: 13<br />
                    Ümraniye / İstanbul
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3 mb-6">
                <Mail className="w-6 h-6 text-blue-600 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-gray-900 text-lg mb-2">E-posta</h3>
                  <p className="text-blue-600 text-lg">info@mavibilet.com</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Award className="w-6 h-6 text-blue-600 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-gray-900 text-lg mb-2">
                    Acente Bilgileri
                  </h3>
                  <p className="text-gray-700">Dijital Turizm Seyahat Acentası</p>
                  <p className="text-gray-700">Belge No: 8720</p>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-8">
              <h3 className="text-xl font-bold text-gray-900 mb-6">
                Şirket Bilgileri
              </h3>
              <div className="space-y-4">
                <div>
                  <p className="font-semibold text-gray-700 mb-1">Şirket Unvanı:</p>
                  <p className="text-gray-600 leading-relaxed">
                    CRP TURİZM OTOMOTİV GIDA İNŞAAT REKLAM E-TİCARET VE İTHALAT İHRACAT LTD.ŞTİ.
                  </p>
                </div>
                <div>
                  <p className="font-semibold text-gray-700 mb-1">Vergi Dairesi:</p>
                  <p className="text-gray-600">Ümraniye V.D</p>
                </div>
                <div>
                  <p className="font-semibold text-gray-700 mb-1">Vergi Numarası:</p>
                  <p className="text-gray-600">2150566593</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;

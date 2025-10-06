import React from 'react';
import { FileText, AlertCircle, Users, Shield, CreditCard, Calendar } from 'lucide-react';

const TermsPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Kullanım Koşulları
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            dijipaltour.com web sitesini kullanarak aşağıdaki şart ve koşulları kabul etmiş sayılırsınız.
          </p>
          <div className="mt-4 text-sm text-gray-500">
            Son Güncelleme: {new Date().toLocaleDateString('tr-TR')}
          </div>
        </div>

        {/* Company Info */}
        <div className="bg-gray-50 rounded-2xl p-8 mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <FileText className="w-8 h-8 text-gray-600" />
            <h2 className="text-2xl font-bold text-gray-900">Hizmet Sağlayıcı</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-6 text-gray-800">
            <div>
              <p className="font-semibold mb-2">Şirket Bilgileri:</p>
              <p className="text-sm">CRP TURİZM OTOMOTİV GIDA İNŞAAT REKLAM E-TİCARET VE İTHALAT İHRACAT LTD.ŞTİ.</p>
              <p className="text-sm mt-2">Vergi Dairesi: Ümraniye V.D</p>
              <p className="text-sm">Vergi Numarası: 2150566593</p>
            </div>
            <div>
              <p className="font-semibold mb-2">İletişim Bilgileri:</p>
              <p className="text-sm">İstiklal Mah. Kavaklidere Cad. Yalçın İş Hanı No: 3 İç Kapı No: 13 Ümraniye / İstanbul</p>
              <p className="text-sm mt-2">E-posta: crpgrup@gmail.com</p>
              <p className="text-sm">Acente: Dijital Turizm Seyahat Acentası - Belge No: 8720</p>
            </div>
          </div>
        </div>

        {/* Terms Sections */}
        <div className="space-y-8">
          
          {/* General Terms */}
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="flex items-center space-x-3 mb-6">
              <Users className="w-8 h-8 text-green-600" />
              <h2 className="text-2xl font-bold text-gray-900">1. Genel Hükümler</h2>
            </div>
            <div className="space-y-4 text-gray-700">
              <p>
                1.1. Bu kullanım koşulları, dijipaltour.com web sitesi ve mobil uygulamalarının kullanımına ilişkin şart ve koşulları belirler.
              </p>
              <p>
                1.2. Web sitemizi kullanarak bu şartları kabul etmiş sayılırsınız. Şartları kabul etmiyorsanız siteyi kullanmayınız.
              </p>
              <p>
                1.3. Bu koşullar önceden haber verilmeksizin değiştirilebilir. Güncel koşulları düzenli olarak kontrol etmeniz önerilir.
              </p>
              <p>
                1.4. 18 yaşından küçük kullanıcılar veli/vasi onayı ile siteyi kullanabilir.
              </p>
            </div>
          </div>

          {/* User Responsibilities */}
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="flex items-center space-x-3 mb-6">
              <Shield className="w-8 h-8 text-blue-600" />
              <h2 className="text-2xl font-bold text-gray-900">2. Kullanıcı Sorumlulukları</h2>
            </div>
            <div className="space-y-4 text-gray-700">
              <p>
                2.1. Hesap bilgilerinizin güvenliğinden tamamen siz sorumlusunuz. Şifrenizi kimseyle paylaşmayınız.
              </p>
              <p>
                2.2. Siteye yükleyeceğiniz içeriklerden ve yaptığınız yorumlardan siz sorumlusunuz.
              </p>
              <p>
                2.3. Site üzerinden illegal faaliyetlerde bulunmak, spam göndermek yasaktır.
              </p>
              <p>
                2.4. Gerçek ve güncel bilgiler vermeniz gerekmektedir. Yanlış bilgi vermek sözleşme ihlalidir.
              </p>
              <p>
                2.5. Rezervasyon yaptığınız hizmetlerin şartlarına uymakla yükümlüsünüz.
              </p>
            </div>
          </div>

          {/* Reservation Terms */}
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="flex items-center space-x-3 mb-6">
              <Calendar className="w-8 h-8 text-purple-600" />
              <h2 className="text-2xl font-bold text-gray-900">3. Rezervasyon Şartları</h2>
            </div>
            <div className="space-y-4 text-gray-700">
              <p>
                3.1. Tüm rezervasyonlar onay sürecinden geçer. Onay e-posta ile bildirilir.
              </p>
              <p>
                3.2. Rezervasyon sırasında verdiğiniz kişisel bilgilerin doğruluğundan siz sorumlusunuz.
              </p>
              <p>
                3.3. Ödeme onayı alındıktan sonra rezervasyonunuz kesinleşir.
              </p>
              <p>
                3.4. Hava durumu, güvenlik veya force majeure nedeniyle turlar iptal edilebilir.
              </p>
              <p>
                3.5. Grup rezervasyonları için ayrı şartlar geçerlidir.
              </p>
            </div>
          </div>

          {/* Payment Terms */}
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="flex items-center space-x-3 mb-6">
              <CreditCard className="w-8 h-8 text-orange-600" />
              <h2 className="text-2xl font-bold text-gray-900">4. Ödeme Koşulları</h2>
            </div>
            <div className="space-y-4 text-gray-700">
              <p>
                4.1. Tüm fiyatlar TL olarak belirtilmiştir ve KDV dahildir.
              </p>
              <p>
                4.2. Kredi kartı, banka kartı ve havale ile ödeme kabul edilir.
              </p>
              <p>
                4.3. Ödeme güvenliği SSL sertifikası ile sağlanır.
              </p>
              <p>
                4.4. Taksit seçenekleri banka koşullarına bağlıdır.
              </p>
              <p>
                4.5. Fiyat hataları durumunda rezervasyon iptal edilebilir.
              </p>
            </div>
          </div>

          {/* Intellectual Property */}
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="flex items-center space-x-3 mb-6">
              <FileText className="w-8 h-8 text-red-600" />
              <h2 className="text-2xl font-bold text-gray-900">5. Telif Hakları</h2>
            </div>
            <div className="space-y-4 text-gray-700">
              <p>
                5.1. Web sitesindeki tüm içerik, tasarım ve kodlar telif hakkı ile korunmaktadır.
              </p>
              <p>
                5.2. İzinsiz kopyalama, dağıtım veya ticari kullanım yasaktır.
              </p>
              <p>
                5.3. Kullanıcı içerikleri için gerekli lisansları aldığınızı beyan edersiniz.
              </p>
              <p>
                5.4. Marka ve logoların kullanım hakları saklıdır.
              </p>
            </div>
          </div>

          {/* Limitation of Liability */}
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="flex items-center space-x-3 mb-6">
              <AlertCircle className="w-8 h-8 text-yellow-600" />
              <h2 className="text-2xl font-bold text-gray-900">6. Sorumluluk Sınırları</h2>
            </div>
            <div className="space-y-4 text-gray-700">
              <p>
                6.1. Site ara ara bakım nedeniyle erişilemeyebilir. Bu durumda sorumluluk kabul edilmez.
              </p>
              <p>
                6.2. Üçüncü taraf hizmetlerden kaynaklanan sorunlardan sorumlu değiliz.
              </p>
              <p>
                6.3. Kullanıcı hataları veya sistem arızaları nedeniyle kayıplardan sorumluluk kabul edilmez.
              </p>
              <p>
                6.4. Doğal afetler, pandemi gibi force majeure durumlarında esneklik gösterilir.
              </p>
            </div>
          </div>

          {/* Termination */}
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="flex items-center space-x-3 mb-6">
              <Users className="w-8 h-8 text-gray-600" />
              <h2 className="text-2xl font-bold text-gray-900">7. Sözleşmenin Sona Ermesi</h2>
            </div>
            <div className="space-y-4 text-gray-700">
              <p>
                7.1. Bu sözleşme, hesabınızı kapattığınızda sona erer.
              </p>
              <p>
                7.2. Kural ihlali durumunda hesabınız kapatılabilir.
              </p>
              <p>
                7.3. Aktif rezervasyonlarınız varsa hesap kapatma işlemi ertelenebilir.
              </p>
              <p>
                7.4. Sözleşme sona erdikten sonra da bazı yükümlülükler devam eder.
              </p>
            </div>
          </div>

          {/* Applicable Law */}
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="flex items-center space-x-3 mb-6">
              <Shield className="w-8 h-8 text-indigo-600" />
              <h2 className="text-2xl font-bold text-gray-900">8. Uygulanacak Hukuk ve Yetki</h2>
            </div>
            <div className="space-y-4 text-gray-700">
              <p>
                8.1. Bu sözleşme Türkiye Cumhuriyeti hukuka tabi olarak düzenlenmiştir.
              </p>
              <p>
                8.2. Uyuşmazlıklar öncelikle dostane çözülmeye çalışılır.
              </p>
              <p>
                8.3. Çözümlenemeyen uyuşmazlıklar için İstanbul Mahkemeleri yetkilidir.
              </p>
              <p>
                8.4. Tüketici hakları ve 6502 sayılı kanun hükümleri saklıdır.
              </p>
            </div>
          </div>
        </div>

        {/* Contact Info */}
        <div className="mt-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white">
          <h2 className="text-2xl font-bold mb-4 text-center">Sorularınız mı var?</h2>
          <p className="text-center text-blue-100 mb-6">
            Bu koşullar hakkında herhangi bir sorunuz varsa, bizimle iletişime geçmekten çekinmeyin.
          </p>
          <div className="text-center">
            <button className="bg-white text-blue-600 px-6 py-3 rounded-lg font-medium hover:bg-gray-100 transition-colors mr-4">
              İletişime Geç
            </button>
            <button className="border border-white text-white px-6 py-3 rounded-lg font-medium hover:bg-white hover:text-blue-600 transition-colors">
              E-posta Gönder
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsPage;
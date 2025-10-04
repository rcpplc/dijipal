import React from 'react';
import { Shield, Eye, Database, Lock, UserCheck, Settings, AlertTriangle, Mail } from 'lucide-react';

const PrivacyPage = () => {
  const dataTypes = [
    {
      icon: UserCheck,
      title: "Kimlik Bilgileri",
      description: "Ad, soyad, TC kimlik numarası, doğum tarihi",
      purpose: "Rezervasyon işlemleri ve yasal yükümlülükler"
    },
    {
      icon: Mail,
      title: "İletişim Bilgileri", 
      description: "E-posta adresi, telefon numarası, adres bilgileri",
      purpose: "İletişim kurma ve bilgilendirme amaçlı"
    },
    {
      icon: Database,
      title: "Ödeme Bilgileri",
      description: "Kredi kartı bilgileri, fatura adresi",
      purpose: "Ödeme işlemleri ve finansal kayıtlar"
    },
    {
      icon: Settings,
      title: "Teknik Bilgiler",
      description: "IP adresi, tarayıcı bilgisi, çerezler",
      purpose: "Site performansı ve güvenlik"
    }
  ];

  const rights = [
    "Kişisel verilerinizin işlenip işlenmediğini öğrenme",
    "İşlenen verileriniz hakkında bilgi talep etme", 
    "Verilerin işlenme amacını öğrenme",
    "Yurt içi/dışı aktarım bilgisi alma",
    "Verilerin düzeltilmesi veya silinmesini talep etme",
    "İşleme faaliyetine itiraz etme",
    "Otomatik sistemlerle analiz sonuçlarına itiraz etme"
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Gizlilik Politikası
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Kişisel verilerinizin korunması bizim için önemlidir. Bu politika, verilerinizi nasıl topladığımız, kullandığımız ve koruduğumuzu açıklar.
          </p>
          <div className="mt-4 text-sm text-gray-500">
            Son Güncelleme: {new Date().toLocaleDateString('tr-TR')}
          </div>
        </div>

        {/* Data Controller */}
        <div className="bg-blue-50 rounded-2xl p-8 mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <Shield className="w-8 h-8 text-blue-600" />
            <h2 className="text-2xl font-bold text-blue-900">Veri Sorumlusu</h2>
          </div>
          <div className="text-blue-800">
            <p className="font-semibold mb-2">
              CRP TURİZM OTOMOTİV GIDA İNŞAAT REKLAM E-TİCARET VE İTHALAT İHRACAT LTD.ŞTİ.
            </p>
            <p className="text-sm">
              İstiklal Mah. Kavaklidere Cad. Yalçın İş Hanı No: 3 İç Kapı No: 13 Ümraniye / İstanbul
            </p>
            <p className="text-sm mt-2">
              E-posta: crpgrup@gmail.com | Acente Belge No: 8720
            </p>
          </div>
        </div>

        {/* Data Collection */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <div className="flex items-center space-x-3 mb-6">
            <Database className="w-8 h-8 text-green-600" />
            <h2 className="text-2xl font-bold text-gray-900">Toplanan Kişisel Veriler</h2>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            {dataTypes.map((data, index) => (
              <div key={index} className="border border-gray-200 rounded-xl p-6">
                <div className="flex items-center space-x-3 mb-3">
                  <data.icon className="w-6 h-6 text-blue-600" />
                  <h3 className="font-semibold text-gray-900">{data.title}</h3>
                </div>
                <p className="text-gray-600 text-sm mb-3">{data.description}</p>
                <div className="bg-blue-50 rounded-lg p-3">
                  <p className="text-blue-800 text-sm font-medium">Kullanım Amacı:</p>
                  <p className="text-blue-700 text-sm">{data.purpose}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Processing Purposes */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <div className="flex items-center space-x-3 mb-6">
            <Eye className="w-8 h-8 text-purple-600" />
            <h2 className="text-2xl font-bold text-gray-900">Veri İşleme Amaçları</h2>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Ana Amaçlar</h3>
              <ul className="space-y-3">
                <li className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-purple-600 rounded-full mt-2"></div>
                  <span className="text-gray-700">Rezervasyon işlemleri yapma</span>
                </li>
                <li className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-purple-600 rounded-full mt-2"></div>
                  <span className="text-gray-700">Ödeme ve fatura işlemleri</span>
                </li>
                <li className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-purple-600 rounded-full mt-2"></div>
                  <span className="text-gray-700">Müşteri hizmetleri sunma</span>
                </li>
                <li className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-purple-600 rounded-full mt-2"></div>
                  <span className="text-gray-700">Yasal yükümlülükleri yerine getirme</span>
                </li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">İkincil Amaçlar</h3>
              <ul className="space-y-3">
                <li className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-green-600 rounded-full mt-2"></div>
                  <span className="text-gray-700">Pazarlama faaliyetleri (onaylı)</span>
                </li>
                <li className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-green-600 rounded-full mt-2"></div>
                  <span className="text-gray-700">Site performansını iyileştirme</span>
                </li>
                <li className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-green-600 rounded-full mt-2"></div>
                  <span className="text-gray-700">Güvenlik önlemlerini alma</span>
                </li>
                <li className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-green-600 rounded-full mt-2"></div>
                  <span className="text-gray-700">İstatistiksel analiz yapma</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Data Security */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <div className="flex items-center space-x-3 mb-6">
            <Lock className="w-8 h-8 text-red-600" />
            <h2 className="text-2xl font-bold text-gray-900">Veri Güvenliği</h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center p-6 bg-red-50 rounded-xl">
              <Shield className="w-12 h-12 text-red-600 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-900 mb-2">SSL Şifreleme</h3>
              <p className="text-gray-600 text-sm">Tüm veri transferleri SSL sertifikası ile şifrelenir</p>
            </div>
            
            <div className="text-center p-6 bg-blue-50 rounded-xl">
              <Database className="w-12 h-12 text-blue-600 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-900 mb-2">Güvenli Depolama</h3>
              <p className="text-gray-600 text-sm">Veriler güvenli sunucularda saklanır</p>
            </div>
            
            <div className="text-center p-6 bg-green-50 rounded-xl">
              <UserCheck className="w-12 h-12 text-green-600 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-900 mb-2">Erişim Kontrolü</h3>
              <p className="text-gray-600 text-sm">Sadece yetkili personel erişebilir</p>
            </div>
          </div>
        </div>

        {/* Data Retention */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <div className="flex items-center space-x-3 mb-6">
            <AlertTriangle className="w-8 h-8 text-orange-600" />
            <h2 className="text-2xl font-bold text-gray-900">Veri Saklama Süreleri</h2>
          </div>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center p-4 bg-orange-50 rounded-lg">
              <span className="font-medium text-gray-900">Rezervasyon Kayıtları</span>
              <span className="text-orange-600 font-semibold">10 Yıl</span>
            </div>
            <div className="flex justify-between items-center p-4 bg-blue-50 rounded-lg">
              <span className="font-medium text-gray-900">Ödeme Bilgileri</span>
              <span className="text-blue-600 font-semibold">5 Yıl</span>
            </div>
            <div className="flex justify-between items-center p-4 bg-green-50 rounded-lg">
              <span className="font-medium text-gray-900">Pazarlama Verileri</span>
              <span className="text-green-600 font-semibold">2 Yıl</span>
            </div>
            <div className="flex justify-between items-center p-4 bg-purple-50 rounded-lg">
              <span className="font-medium text-gray-900">Log Kayıtları</span>
              <span className="text-purple-600 font-semibold">1 Yıl</span>
            </div>
          </div>
        </div>

        {/* User Rights */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <div className="flex items-center space-x-3 mb-6">
            <UserCheck className="w-8 h-8 text-indigo-600" />
            <h2 className="text-2xl font-bold text-gray-900">KVKK Hakları</h2>
          </div>
          
          <p className="text-gray-600 mb-6">
            6698 sayılı Kişisel Verilerin Korunması Kanunu kapsamında aşağıdaki haklarınız bulunmaktadır:
          </p>
          
          <div className="grid md:grid-cols-2 gap-4">
            {rights.map((right, index) => (
              <div key={index} className="flex items-start space-x-3 p-3 bg-indigo-50 rounded-lg">
                <div className="w-2 h-2 bg-indigo-600 rounded-full mt-2"></div>
                <span className="text-indigo-800 text-sm">{right}</span>
              </div>
            ))}
          </div>
          
          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-yellow-800 text-sm">
              <strong>Not:</strong> Haklarınızı kullanmak için crpgrup@gmail.com adresine kimlik belgenizle birlikte başvurabilirsiniz.
            </p>
          </div>
        </div>

        {/* Cookies */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <div className="flex items-center space-x-3 mb-6">
            <Settings className="w-8 h-8 text-gray-600" />
            <h2 className="text-2xl font-bold text-gray-900">Çerez (Cookie) Politikası</h2>
          </div>
          
          <div className="space-y-4 text-gray-700">
            <p>
              Web sitemizde kullanıcı deneyimini iyileştirmek amacıyla çerezler kullanılmaktadır.
            </p>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Gerekli Çerezler</h4>
                <p className="text-sm text-gray-600">Sitenin temel işlevlerinin çalışması için gereklidir</p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Analitik Çerezler</h4>
                <p className="text-sm text-gray-600">Site performansını analiz etmek için kullanılır</p>
              </div>
            </div>
          </div>
        </div>

        {/* Contact */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-8 text-white">
          <h2 className="text-2xl font-bold mb-4 text-center">Gizlilik Hakkında Sorularınız</h2>
          <p className="text-center text-indigo-100 mb-6">
            Kişisel verileriniz veya bu politika hakkında sorularınız varsa, bizimle iletişime geçin.
          </p>
          <div className="text-center">
            <button className="bg-white text-indigo-600 px-6 py-3 rounded-lg font-medium hover:bg-gray-100 transition-colors mr-4">
              KVKK Başvurusu
            </button>
            <button className="border border-white text-white px-6 py-3 rounded-lg font-medium hover:bg-white hover:text-indigo-600 transition-colors">
              İletişim
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPage;
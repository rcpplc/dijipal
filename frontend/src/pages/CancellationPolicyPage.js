import React from 'react';
import { Clock, AlertCircle, CheckCircle, XCircle, Calendar, CreditCard } from 'lucide-react';

const CancellationPolicyPage = () => {
  const cancellationRules = [
    {
      period: "24 Saat Öncesi",
      icon: CheckCircle,
      color: "text-green-600",
      bgColor: "bg-green-100",
      refundRate: "100%",
      description: "Tur başlangıcından 24 saat öncesine kadar ücretsiz iptal hakkınız bulunmaktadır."
    },
    {
      period: "12-24 Saat Arası",
      icon: AlertCircle,
      color: "text-yellow-600",
      bgColor: "bg-yellow-100",
      refundRate: "50%",
      description: "Tur başlangıcından 12-24 saat arası iptal durumunda %50 iade yapılır."
    },
    {
      period: "12 Saat İçinde",
      icon: XCircle,
      color: "text-red-600",
      bgColor: "bg-red-100",
      refundRate: "0%",
      description: "Tur başlangıcından 12 saat öncesinden sonra iptal edilemez veya iade yapılamaz."
    }
  ];

  const specialConditions = [
    {
      title: "Hava Durumu İptali",
      description: "Güvenlik nedeniyle hava şartları sebebiyle iptal edilen turlar için tam iade veya tarih değişikliği hakkı tanınır.",
      icon: "🌦️"
    },
    {
      title: "Sağlık Durumu",
      description: "Doktor raporu ile belgelenen sağlık sorunları durumunda özel iptal şartları uygulanabilir.",
      icon: "🏥"
    },
    {
      title: "Grup İptalleri",
      description: "8 kişi ve üzeri grup rezervasyonları için farklı iptal şartları geçerlidir.",
      icon: "👥"
    },
    {
      title: "Özel Turlar",
      description: "Özel organize edilen turlar için ayrı iptal politikası uygulanır.",
      icon: "⭐"
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            İptal ve İade Politikası
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Rezervasyonunuzu iptal etme şartları, iade süreçleri ve özel durumlar hakkında detaylı bilgiler.
          </p>
        </div>

        {/* Cancellation Timeline */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">İptal Zaman Çizelgesi</h2>
          
          <div className="grid md:grid-cols-3 gap-6">
            {cancellationRules.map((rule, index) => (
              <div key={index} className="text-center p-6 rounded-xl border-2 border-gray-100 hover:border-blue-200 transition-colors">
                <div className={`w-16 h-16 ${rule.bgColor} rounded-full flex items-center justify-center mx-auto mb-4`}>
                  <rule.icon className={`w-8 h-8 ${rule.color}`} />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{rule.period}</h3>
                <div className={`text-3xl font-bold ${rule.color} mb-3`}>{rule.refundRate}</div>
                <p className="text-gray-600 text-sm leading-relaxed">{rule.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Cancellation Process */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">İptal İşlemi Nasıl Yapılır?</h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Online İptal</h3>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="bg-blue-100 rounded-full p-1 mt-1">
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Hesabınıza Giriş Yapın</p>
                    <p className="text-gray-600 text-sm">dijipaltour.com'da giriş yapın</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="bg-blue-100 rounded-full p-1 mt-1">
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Rezervasyonlarım</p>
                    <p className="text-gray-600 text-sm">Aktif rezervasyonlarınızı görüntüleyin</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="bg-blue-100 rounded-full p-1 mt-1">
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">İptal Et</p>
                    <p className="text-gray-600 text-sm">İptal butonu ile işlemi tamamlayın</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Telefon ile İptal</h3>
              <div className="bg-blue-50 rounded-xl p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <Calendar className="w-6 h-6 text-blue-600" />
                  <span className="font-semibold text-blue-900">Çalışma Saatleri</span>
                </div>
                <div className="space-y-2 text-sm text-blue-800">
                  <p>Pazartesi - Cuma: 09:00 - 18:00</p>
                  <p>Cumartesi: 09:00 - 16:00</p>
                  <p>Pazar: Kapalı</p>
                </div>
                <div className="mt-4 pt-4 border-t border-blue-200">
                  <p className="text-sm text-blue-700">
                    Telefon ile iptal için rezervasyon numaranızı hazır bulundurun.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Refund Process */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">İade Süreci</h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <div className="flex items-center space-x-3 mb-6">
                <CreditCard className="w-8 h-8 text-green-600" />
                <h3 className="text-xl font-semibold text-gray-900">İade Süreleri</h3>
              </div>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="font-medium text-gray-900">Kredi Kartı</span>
                  <span className="text-gray-600">3-7 iş günü</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="font-medium text-gray-900">Banka Kartı</span>
                  <span className="text-gray-600">3-7 iş günü</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="font-medium text-gray-900">Havale/EFT</span>
                  <span className="text-gray-600">1-3 iş günü</span>
                </div>
              </div>
            </div>
            
            <div>
              <div className="flex items-center space-x-3 mb-6">
                <Clock className="w-8 h-8 text-blue-600" />
                <h3 className="text-xl font-semibold text-gray-900">İade Şartları</h3>
              </div>
              
              <ul className="space-y-3">
                <li className="flex items-start space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                  <span className="text-gray-700">İade aynı ödeme yöntemi ile yapılır</span>
                </li>
                <li className="flex items-start space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                  <span className="text-gray-700">Banka işlem ücretleri düşülür</span>
                </li>
                <li className="flex items-start space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                  <span className="text-gray-700">İade onayı e-posta ile bildirilir</span>
                </li>
                <li className="flex items-start space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                  <span className="text-gray-700">Kısmi iade durumları mümkündür</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Special Conditions */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">Özel Durumlar</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            {specialConditions.map((condition, index) => (
              <div key={index} className="border border-gray-200 rounded-xl p-6 hover:border-blue-200 transition-colors">
                <div className="flex items-center space-x-3 mb-3">
                  <span className="text-2xl">{condition.icon}</span>
                  <h3 className="text-lg font-semibold text-gray-900">{condition.title}</h3>
                </div>
                <p className="text-gray-600 text-sm leading-relaxed">{condition.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Important Notes */}
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-8">
          <div className="flex items-start space-x-3 mb-4">
            <AlertCircle className="w-6 h-6 text-amber-600 mt-1" />
            <h2 className="text-xl font-bold text-amber-900">Önemli Notlar</h2>
          </div>
          
          <ul className="space-y-3 text-amber-800">
            <li className="flex items-start space-x-2">
              <div className="w-2 h-2 bg-amber-600 rounded-full mt-2"></div>
              <span>Bu politika tüm tur rezervasyonları için geçerlidir ve önceden haber verilmeksizin değiştirilebilir.</span>
            </li>
            <li className="flex items-start space-x-2">
              <div className="w-2 h-2 bg-amber-600 rounded-full mt-2"></div>
              <span>Özel organizasyonlar ve grup turları için farklı şartlar uygulanabilir.</span>
            </li>
            <li className="flex items-start space-x-2">
              <div className="w-2 h-2 bg-amber-600 rounded-full mt-2"></div>
              <span>Force majeure (doğal afetler, pandemi vb.) durumlarında esnek yaklaşım sergilenebilir.</span>
            </li>
            <li className="flex items-start space-x-2">
              <div className="w-2 h-2 bg-amber-600 rounded-full mt-2"></div>
              <span>İptal işlemleri için mutlaka yazılı başvuru gereklidir.</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default CancellationPolicyPage;
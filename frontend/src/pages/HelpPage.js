import React from 'react';
import { Search, Book, CreditCard, Users, MessageCircle, Shield, Phone, Mail } from 'lucide-react';

const HelpPage = () => {
  const helpTopics = [
    {
      icon: Book,
      title: "Rezervasyon Yapma",
      description: "Tur rezervasyonu nasıl yapılır, tarih seçimi ve kabin türleri hakkında bilgiler",
      items: [
        "Tur seçimi ve rezervasyon adımları",
        "Kabin türleri ve fiyatlandırma",
        "Tarih değişikliği ve iptaller",
        "Grup rezervasyonları"
      ]
    },
    {
      icon: CreditCard,
      title: "Ödeme İşlemleri",
      description: "Güvenli ödeme yöntemleri, taksit seçenekleri ve fatura işlemleri",
      items: [
        "Kabul edilen ödeme yöntemleri",
        "Taksit seçenekleri",
        "Ödeme güvenliği",
        "Fatura ve makbuz alma"
      ]
    },
    {
      icon: Users,
      title: "Hesap Yönetimi",
      description: "Kullanıcı hesabı oluşturma, profil düzenleme ve giriş işlemleri",
      items: [
        "Üye olma ve giriş yapma",
        "Profil bilgilerini güncelleme",
        "Şifre değiştirme",
        "Rezervasyon geçmişi"
      ]
    },
    {
      icon: Shield,
      title: "Güvenlik ve Gizlilik",
      description: "Kişisel verilerin korunması, güvenlik önlemleri ve gizlilik politikası",
      items: [
        "Kişisel veri güvenliği",
        "KVKK ve gizlilik hakları",
        "Güvenli alışveriş",
        "Veri silme talepleri"
      ]
    }
  ];

  const quickActions = [
    {
      icon: MessageCircle,
      title: "Canlı Destek",
      description: "Uzmanlarımızla anında konuşun",
      action: "Sohbeti Başlat",
      color: "bg-gray-600"
    },
    {
      icon: Phone,
      title: "Telefon Desteği",
      description: "Çalışma saatleri: 09:00 - 18:00",
      action: "Ara",
      color: "bg-gray-600"
    },
    {
      icon: Mail,
      title: "E-posta Gönder",
      description: "24 saat içinde yanıtlıyoruz",
      action: "Mail Gönder",
      color: "bg-gray-600"
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Yardım Merkezi
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Size yardımcı olmak için buradayız. Aradığınız bilgiyi bulamıyorsanız, destek ekibimizle iletişime geçin.
          </p>
          
          {/* Search Bar */}
          <div className="max-w-2xl mx-auto relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Neyle ilgili yardıma ihtiyacınız var?"
              className="w-full pl-12 pr-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
            />
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-6 mb-16">
          {quickActions.map((action, index) => (
            <div key={index} className="bg-white rounded-xl p-6 text-center shadow-md hover:shadow-lg transition-shadow">
              <div className={`w-16 h-16 ${action.color} rounded-full flex items-center justify-center mx-auto mb-4`}>
                <action.icon className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">{action.title}</h3>
              <p className="text-gray-600 mb-4">{action.description}</p>
              <button className="bg-gray-900 text-white px-6 py-2 rounded-lg hover:bg-gray-800 transition-colors">
                {action.action}
              </button>
            </div>
          ))}
        </div>

        {/* Help Topics */}
        <div className="grid lg:grid-cols-2 gap-8 mb-16">
          {helpTopics.map((topic, index) => (
            <div key={index} className="bg-white rounded-xl p-8 shadow-md">
              <div className="flex items-start space-x-4 mb-6">
                <div className="bg-gray-100 rounded-lg p-3">
                  <topic.icon className="w-6 h-6 text-gray-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{topic.title}</h3>
                  <p className="text-gray-600">{topic.description}</p>
                </div>
              </div>
              
              <ul className="space-y-3">
                {topic.items.map((item, itemIndex) => (
                  <li key={itemIndex} className="flex items-center space-x-3 text-gray-700 hover:text-gray-900 cursor-pointer">
                    <div className="w-2 h-2 bg-gray-600 rounded-full"></div>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Popular Questions */}
        <div className="bg-white rounded-xl p-8 shadow-md mb-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">Sık Sorulan Sorular</h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="border-l-4 border-blue-600 pl-4">
                <h4 className="font-semibold text-gray-900 mb-2">Rezervasyon iptali nasıl yapılır?</h4>
                <p className="text-gray-600 text-sm">Hesabınıza giriş yaparak rezervasyon geçmişinizden iptal edebilirsiniz.</p>
              </div>
              
              <div className="border-l-4 border-blue-600 pl-4">
                <h4 className="font-semibold text-gray-900 mb-2">Kabin türleri arasındaki farklar nedir?</h4>
                <p className="text-gray-600 text-sm">Standart, Lux ve Delux kabinlerimiz farklı konfor seviyelerinde hizmet sunar.</p>
              </div>
              
              <div className="border-l-4 border-blue-600 pl-4">
                <h4 className="font-semibold text-gray-900 mb-2">Grup indirimleriniz var mı?</h4>
                <p className="text-gray-600 text-sm">8 kişi ve üzeri gruplar için özel indirimlerimiz bulunmaktadır.</p>
              </div>
            </div>
            
            <div className="space-y-6">
              <div className="border-l-4 border-green-600 pl-4">
                <h4 className="font-semibold text-gray-900 mb-2">Ödeme hangi yöntemlerle yapabilirim?</h4>
                <p className="text-gray-600 text-sm">Kredi kartı, banka kartı ve havale ile ödeme yapabilirsiniz.</p>
              </div>
              
              <div className="border-l-4 border-green-600 pl-4">
                <h4 className="font-semibold text-gray-900 mb-2">Turlar hava durumundan etkilenir mi?</h4>
                <p className="text-gray-600 text-sm">Güvenlik nedeniyle olumsuz hava şartlarında turlar ertelenebilir.</p>
              </div>
              
              <div className="border-l-4 border-green-600 pl-4">
                <h4 className="font-semibold text-gray-900 mb-2">Yanımda neler getirmeliyim?</h4>
                <p className="text-gray-600 text-sm">Kimlik belgesi, rahat kıyafetler ve kişisel ihtiyaçlarınızı getirin.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Section */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-8 text-center text-white">
          <h2 className="text-2xl font-bold mb-4">Hala yardıma mı ihtiyacınız var?</h2>
          <p className="text-blue-100 mb-6">
            Aradığınız cevabı bulamadıysanız, uzman ekibimizle iletişime geçin. Size yardımcı olmaktan memnuniyet duyarız.
          </p>
          <div className="space-x-4">
            <button className="bg-white text-blue-600 px-6 py-3 rounded-lg font-medium hover:bg-gray-100 transition-colors">
              İletişime Geç
            </button>
            <button className="border border-white text-white px-6 py-3 rounded-lg font-medium hover:bg-white hover:text-blue-600 transition-colors">
              FAQ Sayfası
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpPage;
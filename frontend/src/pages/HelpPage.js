import React, { useState } from 'react';
import { Search, Book, CreditCard, Users, MessageCircle, Shield, Phone, Mail } from 'lucide-react';

const HelpPage = () => {
  const [searchQuery, setSearchQuery] = useState("");

  // 📘 Yardım konuları
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

  // ❓ Sık Sorulan Sorular
  const faqQuestions = [
    { question: "Rezervasyon iptali nasıl yapılır?", answer: "Hesabınıza giriş yaparak rezervasyon geçmişinizden iptal edebilirsiniz." },
    { question: "Kabin türleri arasındaki farklar nedir?", answer: "Standart, Lux ve Delux kabinlerimiz farklı konfor seviyelerinde hizmet sunar." },
    { question: "Grup indirimleriniz var mı?", answer: "8 kişi ve üzeri gruplar için özel indirimlerimiz bulunmaktadır." },
    { question: "Ödeme hangi yöntemlerle yapabilirim?", answer: "Kredi kartı, banka kartı ve havale ile ödeme yapabilirsiniz." },
    { question: "Turlar hava durumundan etkilenir mi?", answer: "Güvenlik nedeniyle olumsuz hava şartlarında turlar ertelenebilir." },
    { question: "Yanımda neler getirmeliyim?", answer: "Kimlik belgesi, rahat kıyafetler ve kişisel ihtiyaçlarınızı getirin." }
  ];

  // 🔍 Arama filtresi (hem topic hem SSS içinde)
  const filteredTopics = helpTopics.filter(topic =>
    topic.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    topic.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    topic.items.some(item => item.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredFaqs = faqQuestions.filter(faq =>
    faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const noResults = filteredTopics.length === 0 && filteredFaqs.length === 0;

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Başlık + Arama */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">Yardım Merkezi</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Size yardımcı olmak için buradayız. Aradığınız bilgiyi bulamıyorsanız, destek ekibimizle iletişime geçin.
          </p>

          {/* 🔍 Arama Kutusu */}
          <div className="max-w-2xl mx-auto relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Neyle ilgili yardıma ihtiyacınız var?"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
            />
          </div>
        </div>

        {/* SSS (filtreli veya tam liste) */}
        {filteredFaqs.length > 0 && (
          <div className="bg-white rounded-xl p-8 shadow-md mb-16">
            <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">Sık Sorulan Sorular</h2>
            <div className="grid md:grid-cols-2 gap-8">
              {filteredFaqs.map((faq, i) => (
                <div key={i} className="border-l-4 border-blue-600 pl-4">
                  <h4 className="font-semibold text-gray-900 mb-2">{faq.question}</h4>
                  <p className="text-gray-600 text-sm">{faq.answer}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Yardım Konuları */}
        {filteredTopics.length > 0 && (
          <div className="grid lg:grid-cols-2 gap-8 mb-16">
            {filteredTopics.map((topic, index) => (
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
                  {topic.items.map((item, i) => (
                    <li key={i} className="flex items-center space-x-3 text-gray-700 hover:text-gray-900 cursor-pointer">
                      <div className="w-2 h-2 bg-gray-600 rounded-full"></div>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}

        {/* Sonuç bulunamazsa */}
        {noResults && (
          <div className="text-center text-gray-500 mt-6">
            Aradığınız konuyla ilgili bir sonuç bulunamadı.
          </div>
        )}

        {/* İletişim Alanı */}
        <div className="bg-blue-600 rounded-xl p-8 text-center text-white mt-12">
          <h2 className="text-2xl font-bold mb-4">Hala yardıma mı ihtiyacınız var?</h2>
          <p className="text-blue-100 mb-6">
            Aradığınız cevabı bulamadıysanız, uzman ekibimizle iletişime geçin. Size yardımcı olmaktan memnuniyet duyarız.
          </p>
          <div className="space-x-4">
            <button
              onClick={() => window.location.href = '/contact'}
              className="bg-white text-blue-600 px-6 py-3 rounded-lg font-medium hover:bg-gray-100 transition-colors">
              İletişime geç
            </button>
            <button
              onClick={() => window.location.href = '/faq'}
              className="bg-white text-blue-600 px-6 py-3 rounded-lg font-medium hover:bg-gray-100 transition-colors">
              Tüm SSS'leri Gör
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpPage;

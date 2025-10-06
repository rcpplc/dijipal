import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Search, MessageCircle } from 'lucide-react';

const FAQPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [openFAQ, setOpenFAQ] = useState(null);

  const faqCategories = [
    {
      category: "Rezervasyon ve Booking",
      faqs: [
        {
          question: "Nasıl rezervasyon yapabilirim?",
          answer: "Web sitemizden istediğiniz turu seçip, müsait tarihleri kontrol ederek rezervasyon yapabilirsiniz. Ödeme işlemini tamamladıktan sonra e-posta ile rezervasyon onayınızı alacaksınız."
        },
        {
          question: "Rezervasyonumu iptal edebilir miyim?",
          answer: "Evet, rezervasyon iptal şartlarımıza göre iptal edebilirsiniz. Tur başlangıcından 24 saat öncesine kadar ücretsiz iptal hakkınız bulunmaktadır."
        },
        {
          question: "Son dakika rezervasyonu yapabilir miyim?",
          answer: "Kabin müsaitliği olması durumunda, tur başlangıcından 2 saat öncesine kadar rezervasyon yapabilirsiniz."
        },
        {
          question: "Grup rezervasyonu nasıl yapılır?",
          answer: "8 kişi ve üzeri gruplar için özel fiyatlarımız bulunmaktadır. Grup rezervasyonu için lütfen bizimle direkt iletişime geçin."
        }
      ]
    },
    {
      category: "Ödeme ve Fiyatlandırma",
      faqs: [
        {
          question: "Hangi ödeme yöntemlerini kabul ediyorsunuz?",
          answer: "Kredi kartı (Visa, Mastercard), banka kartı ve havale ile ödeme yapabilirsiniz. Tüm ödemeler SSL güvenlik sertifikası ile korunmaktadır."
        },
        {
          question: "Taksit seçeneği var mı?",
          answer: "Evet, kredi kartı ile 2, 3, 6, 9 ve 12 ay taksit seçenekleri mevcuttur. Taksit faiz oranları bankanıza göre değişiklik gösterir."
        },
        {
          question: "Fiyatlara ne dahil?",
          answer: "Fiyatlara kabin konaklama, belirtilen öğünler, deneyimli rehber eşliği ve sigorta dahildir. Kişisel harcamalar dahil değildir."
        },
        {
          question: "Çocuk indirimi var mı?",
          answer: "0-2 yaş ücretsiz (koltuk hakkı olmadan), 3-12 yaş arası %50 indirim uygulanmaktadır."
        }
      ]
    },
    {
      category: "Tur Detayları",
      faqs: [
        {
          question: "Kabin türleri nelerdir?",
          answer: "Standart kabinler (2 kişilik yatak, temel konfur), Lux kabinler (çift kişilik yatak, minibar, klima) ve Delux kabinler (balkonlu, jakuzzi, premium hizmet) seçeneklerimiz bulunmaktadır."
        },
        {
          question: "Hava durumu turları etkiler mi?",
          answer: "Güvenlik önceliğimiz nedeniyle, olumsuz hava şartlarında turlar ertelenebilir veya iptal edilebilir. Bu durumda tam iade yapılır."
        },
        {
          question: "Yemekler nasıl organize ediliyor?",
          answer: "Turlarımızda genellikle açık büfe kahvaltı ve akşam yemeği dahildir. Özel diyet ihtiyaçlarınız varsa, rezervasyon sırasında belirtiniz."
        },
        {
          question: "Yanımda ne getirmeliyim?",
          answer: "Kimlik belgesi, güneş kremi, şapka, rahat kıyafetler, mayosu ve kişisel ihtiyaçlarınızı getirmeniz yeterlidir. Havlu ve temel hijyen malzemeleri sağlanmaktadır."
        }
      ]
    },
    {
      category: "Genel Bilgiler",
      faqs: [
        {
          question: "Turlar ne kadar sürer?",
          answer: "Turlarımız 1 gün ile 14 gün arasında değişmektedir. Her turun detay sayfasında süre bilgisi açıkça belirtilmiştir."
        },
        {
          question: "Sigorta dahil mi?",
          answer: "Evet, tüm turlarımızda seyahat sigortası dahildir. Ayrıca özel sigorta yaptırmak isteyenler için önerilerde bulunabiliriz."
        },
        {
          question: "Evcil hayvan götürebilir miyim?",
          answer: "Maalesef hijyen ve diğer yolcuların rahatlığı açısından evcil hayvan kabul etmiyoruz."
        },
        {
          question: "Alkol tüketimi serbest mi?",
          answer: "18 yaş üstü yolcular için kendi alkolleri tüketebilir, ancak gemide satış yapılmamaktadır. Aşırı alkol tüketimi durumunda güvenlik gereği müdahale edilebilir."
        }
      ]
    }
  ];

  const toggleFAQ = (index) => {
    setOpenFAQ(openFAQ === index ? null : index);
  };

  const filteredFAQs = faqCategories.map(category => ({
    ...category,
    faqs: category.faqs.filter(faq => 
      faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })).filter(category => category.faqs.length > 0);

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Sıkça Sorulan Sorular
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            En çok merak edilen soruların yanıtlarını burada bulabilirsiniz. Aradığınız soruyu bulamıyorsanız bizimle iletişime geçin.
          </p>
          
          {/* Search Bar */}
          <div className="max-w-2xl mx-auto relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Soruları arayın..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
            />
          </div>
        </div>

        {/* FAQ Categories */}
        <div className="space-y-8">
          {filteredFAQs.map((category, categoryIndex) => (
            <div key={categoryIndex} className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="bg-gray-600 text-white px-6 py-4">
                <h2 className="text-xl font-bold">{category.category}</h2>
              </div>
              
              <div className="p-6">
                <div className="space-y-4">
                  {category.faqs.map((faq, faqIndex) => {
                    const globalIndex = `${categoryIndex}-${faqIndex}`;
                    const isOpen = openFAQ === globalIndex;
                    
                    return (
                      <div key={faqIndex} className="border border-gray-200 rounded-lg">
                        <button
                          onClick={() => toggleFAQ(globalIndex)}
                          className="w-full flex justify-between items-center p-4 text-left hover:bg-gray-50 transition-colors"
                        >
                          <span className="font-semibold text-gray-900 pr-4">{faq.question}</span>
                          {isOpen ? (
                            <ChevronUp className="w-5 h-5 text-gray-500 flex-shrink-0" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-gray-500 flex-shrink-0" />
                          )}
                        </button>
                        
                        {isOpen && (
                          <div className="px-4 pb-4 border-t border-gray-100">
                            <p className="text-gray-700 pt-4 leading-relaxed">{faq.answer}</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* No Results */}
        {filteredFAQs.length === 0 && searchTerm && (
          <div className="text-center py-12">
            <MessageCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Aradığınız soru bulunamadı</h3>
            <p className="text-gray-600 mb-4">
              "{searchTerm}" ile ilgili bir sonuç bulunamadı. Farklı anahtar kelimeler deneyebilir veya bizimle iletişime geçebilirsiniz.
            </p>
            <button
              onClick={() => setSearchTerm('')}
              className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition-colors"
            >
              Tüm Soruları Göster
            </button>
          </div>
        )}

        {/* Contact Section */}
        <div className="mt-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-8 text-center text-white">
          <h2 className="text-2xl font-bold mb-4">Sorunuz yanıtlanmadı mı?</h2>
          <p className="text-blue-100 mb-6">
            Aradığınız cevabı bulamadıysanız, uzman ekibimiz size yardımcı olmak için hazır bekliyor.
          </p>
          <div className="space-x-4">
            <button className="bg-white text-blue-600 px-6 py-3 rounded-lg font-medium hover:bg-gray-100 transition-colors">
              Canlı Destek
            </button>
            <button className="border border-white text-white px-6 py-3 rounded-lg font-medium hover:bg-white hover:text-blue-600 transition-colors">
              İletişime Geç
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FAQPage;
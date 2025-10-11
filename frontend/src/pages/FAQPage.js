import React, { useState } from "react";
import { ChevronDown, ChevronUp, MessageCircle, Search } from "lucide-react";

const FAQPage = () => {
  const [openQuestion, setOpenQuestion] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const faqs = [
    {
      category: "Rezervasyon İşlemleri",
      questions: [
        {
          q: "Nasıl rezervasyon yapabilirim?",
          a: "Web sitemiz üzerinden istediğiniz tekne veya turu seçip, müsait tarihleri görüntüleyebilir ve ödeme adımlarını tamamlayarak rezervasyonunuzu kolayca oluşturabilirsiniz."
        },
        {
          q: "Rezervasyonumu nasıl iptal edebilirim?",
          a: "Rezervasyonunuzu profilinizden veya bize e-posta göndererek iptal edebilirsiniz. İptal şartları seçilen iptal politikasına (esnek, orta, katı) göre değişiklik gösterir."
        },
        {
          q: "Rezervasyon onayımı nasıl alırım?",
          a: "Ödemeniz onaylandıktan sonra e-posta ve SMS yoluyla rezervasyon onay belgeniz tarafınıza iletilir."
        },
        {
          q: "Grup rezervasyonları nasıl yapılır?",
          a: "10 kişi ve üzeri grup talepleri için özel fiyatlar uygulanır. Grup rezervasyonu için bizimle doğrudan iletişime geçebilirsiniz."
        }
      ]
    },
    {
      category: "Ödeme ve Faturalandırma",
      questions: [
        {
          q: "Hangi ödeme yöntemlerini kabul ediyorsunuz?",
          a: "Kredi kartı (Visa, Mastercard), banka kartı, havale ve EFT kabul edilmektedir. Tüm ödemeler SSL sertifikalı güvenli altyapı üzerinden alınır."
        },
        {
          q: "Taksit imkanı var mı?",
          a: "Evet, anlaşmalı bankalar üzerinden 2, 3, 6 ve 9 taksit imkanı sunulmaktadır. Taksit koşulları bankanıza göre değişebilir."
        },
        {
          q: "Fiyatlara neler dahil?",
          a: "Fiyatlara konaklama, belirli öğünler, rehber hizmeti ve sigorta dahildir. Özel harcamalar, içecekler ve ekstra hizmetler dahil değildir."
        },
        {
          q: "Fatura nasıl kesiliyor?",
          a: "Rezervasyon işleminiz tamamlandıktan sonra fatura e-posta adresinize PDF olarak gönderilmektedir."
        }
      ]
    },
    {
      category: "Tur ve Tekne Bilgileri",
      questions: [
        {
          q: "Teknelerde hangi kabin tipleri mevcut?",
          a: "Standart, Lüks ve Delüks kabin seçenekleri bulunmaktadır. Her biri farklı konfor seviyeleri ve hizmet içerikleri sunar."
        },
        {
          q: "Turlar olumsuz hava koşullarında yapılır mı?",
          a: "Misafir güvenliği önceliğimizdir. Olumsuz hava koşullarında turlar ertelenebilir veya iptal edilir, bu durumda ücret iadesi yapılır."
        },
        {
          q: "Yemek ve içecekler nasıl sağlanıyor?",
          a: "Yemek hizmeti tur programına göre değişir. Bazı turlarımızda tam pansiyon (sabah, öğle, akşam) yemekler dahildir."
        },
        {
          q: "Evcil hayvan kabul ediliyor mu?",
          a: "Bazı tekneler evcil hayvan kabul etmektedir. İlgili tekne sayfasında bu bilgi açıkça belirtilir."
        }
      ]
    },
    {
      category: "İptal ve Değişiklik Koşulları",
      questions: [
        {
          q: "İptal politikalarınız nelerdir?",
          a: "Üç farklı iptal politikası uygulanır: Esnek (24 saat öncesine kadar ücretsiz), Orta (3 gün öncesine kadar %50 iade), Katı (7 gün öncesi %25 iade)."
        },
        {
          q: "Rezervasyon tarihimi değiştirebilir miyim?",
          a: "Evet, uygunluk durumuna göre tarih değişikliği yapabilirsiniz. Bazı durumlarda fiyat farkı oluşabilir."
        },
        {
          q: "Hava şartları nedeniyle iptal edilirse ne olur?",
          a: "Şirket kaynaklı veya hava koşullarına bağlı iptallerde tam ücret iadesi yapılır."
        }
      ]
    },
    {
      category: "Genel Bilgiler",
      questions: [
        {
          q: "Sigorta hizmeti var mı?",
          a: "Tüm turlarımız seyahat sigortası kapsamındadır. Dilerseniz ek özel sigorta yaptırabilirsiniz."
        },
        {
          q: "Yurt dışı turlarda pasaport gerekli mi?",
          a: "Evet, uluslararası turlarımızda geçerli pasaport veya kimlik belgesi zorunludur."
        },
        {
          q: "Tur fiyatları ne sıklıkla değişir?",
          a: "Fiyatlar sezonluk olarak güncellenir. Kampanyalar veya erken rezervasyon indirimleri dönemsel olarak sunulur."
        },
        {
          q: "Kiminle iletişime geçebilirim?",
          a: "Destek ekibimiz 7/24 hizmet vermektedir. İletişim sayfası üzerinden veya info@mavibilet.com adresinden bize ulaşabilirsiniz."
        }
      ]
    }
  ];

  const toggleQuestion = (index) => {
    setOpenQuestion(openQuestion === index ? null : index);
  };

  const filteredFaqs = faqs
    .map((cat) => ({
      ...cat,
      questions: cat.questions.filter(
        (item) =>
          item.q.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.a.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }))
    .filter((cat) => cat.questions.length > 0);

  return (
    <div className="min-h-screen bg-gray-100 py-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Sıkça Sorulan Sorular
          </h1>
          <p className="text-lg text-gray-700 max-w-3xl mx-auto">
            En çok merak edilen konulara dair soruların yanıtlarını aşağıda
            bulabilirsiniz. Aradığınızı bulamazsanız bizimle iletişime geçin.
          </p>

          {/* Search Bar */}
          <div className="relative max-w-lg mx-auto mt-8">
            <Search className="absolute left-4 top-3.5 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Soru ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full border border-gray-300 rounded-lg py-3 pl-12 pr-4 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
        </div>

        {/* FAQ Sections */}
        {filteredFaqs.length > 0 ? (
          <div className="space-y-10">
            {filteredFaqs.map((cat, catIndex) => (
              <div key={catIndex} className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 bg-white">
                  <h2 className="text-xl font-semibold text-blue-600">
                    {cat.category}
                  </h2>
                </div>
                <div className="divide-y divide-gray-100">
                  {cat.questions.map((item, qIndex) => {
                    const isOpen = openQuestion === `${catIndex}-${qIndex}`;
                    return (
                      <div key={qIndex}>
                        <button
                          onClick={() =>
                            toggleQuestion(`${catIndex}-${qIndex}`)
                          }
                          className="w-full flex justify-between items-center text-left px-6 py-4 hover:bg-gray-50 transition-colors"
                        >
                          <span className="font-medium text-gray-900 pr-4">
                            {item.q}
                          </span>
                          {isOpen ? (
                            <ChevronUp className="w-5 h-5 text-gray-500" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-gray-500" />
                          )}
                        </button>
                        {isOpen && (
                          <div className="px-6 pb-4 bg-gray-50">
                            <p className="text-gray-700 leading-relaxed pt-2">
                              {item.a}
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <MessageCircle className="w-14 h-14 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              Sonuç bulunamadı
            </h3>
            <p className="text-gray-600 mb-6">
              "{searchTerm}" ile ilgili bir sonuç bulunamadı. Farklı bir anahtar kelime deneyin.
            </p>
            <button
              onClick={() => setSearchTerm("")}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Tüm Soruları Göster
            </button>
          </div>
        )}

        {/* Contact Section */}
        <div className="mt-16 bg-blue-600 rounded-xl p-10 text-center text-white">
          <h2 className="text-2xl font-bold mb-4">Sorunuz yanıtlanmadı mı?</h2>
          <p className="text-gray-200 max-w-2xl mx-auto mb-6">
            Aradığınız cevabı bulamadıysanız, destek ekibimiz size yardımcı olmak için hazır.
            Dilerseniz canlı destek veya e-posta yoluyla bizimle iletişime geçebilirsiniz.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <button
              onClick={() => window.location.href = '/contact'}
              className="bg-white text-blue-600 px-6 py-3 rounded-lg font-medium hover:bg-gray-100 transition-colors">
              İletişime geç
            </button>
            <button
              onClick={() => (window.location.href = "mailto:info@mavibilet.com")}
              className="bg-white text-blue-600 px-6 py-3 rounded-lg font-medium hover:bg-gray-100 transition-colors">
              E-posta Gönder
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FAQPage;

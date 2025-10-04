import React from 'react';
import { MapPin, Mail, Phone, Users, Award, Globe, Heart } from 'lucide-react';

const AboutPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Hakkımızda
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Dijital çağda turizm sektörüne yenilikçi çözümler sunan, müşteri memnuniyetini ön planda tutan güvenilir seyahat partneriniz.
          </p>
        </div>

        {/* Company Info */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-12">
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">CRP Turizm</h2>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <MapPin className="w-5 h-5 text-blue-600 mt-1" />
                  <div>
                    <p className="font-semibold text-gray-900">Adres</p>
                    <p className="text-gray-600">İstiklal Mah. Kavaklidere Cad. Yalçın İş Hanı No: 3 İç Kapı No: 13 Ümraniye / İstanbul</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Mail className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="font-semibold text-gray-900">E-posta</p>
                    <p className="text-blue-600">crpgrup@gmail.com</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Award className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="font-semibold text-gray-900">Acente Bilgileri</p>
                    <p className="text-gray-600">Dijital Turizm Seyahat Acentası</p>
                    <p className="text-gray-600">Belge No: 8720</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 rounded-xl p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Kurumsal Kimlik</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="font-semibold text-gray-700">Şirket Unvanı:</p>
                  <p className="text-gray-600">CRP TURİZM OTOMOTİV GIDA İNŞAAT REKLAM E-TİCARET VE İTHALAT İHRACAT LTD.ŞTİ.</p>
                </div>
                <div>
                  <p className="font-semibold text-gray-700">Vergi Dairesi:</p>
                  <p className="text-gray-600">Ümraniye V.D</p>
                </div>
                <div>
                  <p className="font-semibold text-gray-700">Vergi Numarası:</p>
                  <p className="text-gray-600">2150566593</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Values Section */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          <div className="text-center bg-white rounded-xl p-8 shadow-md">
            <Users className="w-12 h-12 text-blue-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-3">Müşteri Odaklı</h3>
            <p className="text-gray-600">
              Her müşterimizin benzersiz ihtiyaçlarını anlayarak, kişiselleştirilmiş seyahat deneyimleri sunuyoruz.
            </p>
          </div>
          
          <div className="text-center bg-white rounded-xl p-8 shadow-md">
            <Award className="w-12 h-12 text-blue-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-3">Güvenilir Hizmet</h3>
            <p className="text-gray-600">
              Lisanslı acente olarak, tüm seyahat hizmetlerimizde en yüksek kalite ve güvenlik standartlarını sağlıyoruz.
            </p>
          </div>
          
          <div className="text-center bg-white rounded-xl p-8 shadow-md">
            <Globe className="w-12 h-12 text-blue-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-3">Dijital İnovasyon</h3>
            <p className="text-gray-600">
              Modern teknoloji ile geleneksel turizm hizmetlerini birleştirerek, kolayca rezervasyon yapabilmenizi sağlıyoruz.
            </p>
          </div>
        </div>

        {/* Mission & Vision */}
        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-blue-50 rounded-xl p-8">
            <h3 className="text-2xl font-bold text-blue-900 mb-4">Misyonumuz</h3>
            <p className="text-blue-800 leading-relaxed">
              Türkiye'nin eşsiz doğal güzelliklerini ve kültürel zenginliklerini, konforlu ve güvenli kabin turları ile müşterilerimize sunmak. 
              Her yaştan seyahat severe unutulmaz deneyimler yaşatarak, turizm sektörünün gelişimine katkıda bulunmak.
            </p>
          </div>
          
          <div className="bg-green-50 rounded-xl p-8">
            <h3 className="text-2xl font-bold text-green-900 mb-4">Vizyonumuz</h3>
            <p className="text-green-800 leading-relaxed">
              Türkiye'de kabin turizmi alanında lider bir marka olmak ve dijital platformumuzu kullanarak, 
              seyahat planlamayı herkes için kolay, güvenli ve keyifli hale getirmek.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;
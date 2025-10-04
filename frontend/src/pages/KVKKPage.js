import React, { useState } from 'react';
import { Shield, FileText, Mail, Phone, User, Clock, AlertCircle, CheckCircle, Download, Send } from 'lucide-react';

const KVKKPage = () => {
  const [applicationForm, setApplicationForm] = useState({
    name: '',
    email: '',
    phone: '',
    idNumber: '',
    requestType: '',
    description: ''
  });

  const requestTypes = [
    { value: 'access', label: 'Kişisel verilerinizin işlenip işlenmediğini öğrenme' },
    { value: 'info', label: 'İşlenen kişisel verileriniz hakkında bilgi talep etme' },
    { value: 'purpose', label: 'Kişisel verilerin işlenme amacını ve bunların amacına uygun kullanılıp kullanılmadığını öğrenme' },
    { value: 'third-party', label: 'Yurt içi/yurt dışı kişisel verilerin aktarıldığı üçüncü kişileri bilme' },
    { value: 'correction', label: 'Kişisel verilerin eksik veya yanlış işlenmiş olması hâlinde bunların düzeltilmesini isteme' },
    { value: 'deletion', label: 'Kişisel verilerin silinmesi veya yok edilmesini isteme' },
    { value: 'notification', label: 'Düzeltme/silme işlemlerinin kişisel verilerin aktarıldığı üçüncü kişilere bildirilmesini isteme' },
    { value: 'objection', label: 'İşlenen verilerin münhasıran otomatik sistemler vasıtasıyla analiz edilmesi suretiyle kişinin aleyhine bir sonucun ortaya çıkmasına itiraz etme' },
    { value: 'damage', label: 'Kişisel verilerin kanuna aykırı olarak işlenmesi sebebiyle zarara uğraması hâlinde zararın giderilmesini talep etme' }
  ];

  const dataProcessingPurposes = [
    {
      category: 'Rezervasyon İşlemleri',
      purposes: [
        'Tur rezervasyonu yapma ve yönetme',
        'Kabin tahsisi ve yerleştirme',
        'Ödeme işlemlerini gerçekleştirme',
        'Rezervasyon iptal/değişiklik işlemleri'
      ]
    },
    {
      category: 'Müşteri İlişkileri',
      purposes: [
        'Müşteri hizmetleri sunma',
        'Şikayet ve talepleri değerlendirme',
        'Müşteri memnuniyet araştırmaları',
        'İletişim ve bilgilendirme faaliyetleri'
      ]
    },
    {
      category: 'Pazarlama Faaliyetleri',
      purposes: [
        'Kampanya ve promosyon bilgilendirmeleri (onaylı)',
        'Kişiselleştirilmiş tur önerileri',
        'Pazarlama etkinliği ölçümleri',
        'Müşteri segmentasyon çalışmaları'
      ]
    },
    {
      category: 'Yasal Yükümlülükler',
      purposes: [
        'Vergi mevzuatı gereği kayıt tutma',
        'Ticaret Kanunu zorunlulukları',
        'Turizm mevzuatı gereklilikleri',
        'Mali müşavir raporlama yükümlülükleri'
      ]
    }
  ];

  const handleInputChange = (e) => {
    setApplicationForm({
      ...applicationForm,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // In real app, this would send the application to backend
    console.log('KVKK Application:', applicationForm);
    alert('KVKK başvurunuz alındı. En kısa sürede değerlendirilecektir.');
    setApplicationForm({
      name: '',
      email: '',
      phone: '',
      idNumber: '',
      requestType: '',
      description: ''
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <Shield className="w-16 h-16 text-blue-600" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            KVKK Veri Sorumlusuna Başvuru
          </h1>
          <p className="text-xl text-gray-600 max-w-4xl mx-auto">
            6698 sayılı Kişisel Verilerin Korunması Kanunu kapsamında haklarınızı kullanmak için başvuru yapabilirsiniz.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Info */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* Data Controller Info */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center space-x-3 mb-4">
                <FileText className="w-6 h-6 text-blue-600" />
                <h2 className="text-xl font-bold text-gray-900">Veri Sorumlusu</h2>
              </div>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="font-semibold text-gray-900">Şirket:</p>
                  <p className="text-gray-600">CRP TURİZM OTOMOTİV GIDA İNŞAAT REKLAM E-TİCARET VE İTHALAT İHRACAT LTD.ŞTİ.</p>
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Adres:</p>
                  <p className="text-gray-600">İstiklal Mah. Kavaklidere Cad. Yalçın İş Hanı No: 3 İç Kapı No: 13 Ümraniye / İstanbul</p>
                </div>
                <div>
                  <p className="font-semibold text-gray-900">E-posta:</p>
                  <p className="text-blue-600">crpgrup@gmail.com</p>
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Acente Belge No:</p>
                  <p className="text-gray-600">8720</p>
                </div>
              </div>
            </div>

            {/* Application Process */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center space-x-3 mb-4">
                <Clock className="w-6 h-6 text-green-600" />
                <h2 className="text-xl font-bold text-gray-900">Başvuru Süreci</h2>
              </div>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="bg-blue-100 rounded-full p-1 mt-1">
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 text-sm">1. Başvuru Formu</p>
                    <p className="text-gray-600 text-xs">Formu eksiksiz doldurun</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="bg-blue-100 rounded-full p-1 mt-1">
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 text-sm">2. Kimlik Doğrulama</p>
                    <p className="text-gray-600 text-xs">Kimlik belgeniz kontrol edilir</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="bg-blue-100 rounded-full p-1 mt-1">
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 text-sm">3. İnceleme</p>
                    <p className="text-gray-600 text-xs">Talebiniz 30 gün içinde incelenir</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="bg-green-100 rounded-full p-1 mt-1">
                    <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 text-sm">4. Sonuç</p>
                    <p className="text-gray-600 text-xs">Size geri dönüş yapılır</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Important Notes */}
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6">
              <div className="flex items-start space-x-3">
                <AlertCircle className="w-6 h-6 text-amber-600 mt-1" />
                <div>
                  <h3 className="font-semibold text-amber-900 mb-2">Önemli Notlar</h3>
                  <ul className="space-y-1 text-amber-800 text-sm">
                    <li>• Başvuru ücretsizdir</li>
                    <li>• Kimlik doğrulama zorunludur</li>
                    <li>• Cevap süresi maksimum 30 gündür</li>
                    <li>• Eksik bilgi durumunda başvuru reddedilebilir</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Application Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <div className="flex items-center space-x-3 mb-6">
                <Send className="w-8 h-8 text-purple-600" />
                <h2 className="text-2xl font-bold text-gray-900">KVKK Başvuru Formu</h2>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Personal Info */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ad Soyad *
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        name="name"
                        value={applicationForm.name}
                        onChange={handleInputChange}
                        required
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Adınız ve soyadınız"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      TC Kimlik Numarası *
                    </label>
                    <div className="relative">
                      <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        name="idNumber"
                        value={applicationForm.idNumber}
                        onChange={handleInputChange}
                        required
                        maxLength={11}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="11 haneli TC kimlik numaranız"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      E-posta Adresi *
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="email"
                        name="email"
                        value={applicationForm.email}
                        onChange={handleInputChange}
                        required
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="ornek@email.com"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Telefon Numarası
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="tel"
                        name="phone"
                        value={applicationForm.phone}
                        onChange={handleInputChange}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="+90 5XX XXX XX XX"
                      />
                    </div>
                  </div>
                </div>

                {/* Request Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Başvuru Türü *
                  </label>
                  <select
                    name="requestType"
                    value={applicationForm.requestType}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Başvuru türünü seçiniz</option>
                    {requestTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Talep Detayı *
                  </label>
                  <textarea
                    name="description"
                    value={applicationForm.description}
                    onChange={handleInputChange}
                    required
                    rows={6}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Talebinizi detaylı olarak açıklayınız..."
                  />
                </div>

                {/* Submit Button */}
                <div className="pt-4">
                  <button
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-4 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
                  >
                    <Send className="w-5 h-5" />
                    <span>Başvuru Gönder</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* Data Processing Purposes */}
        <div className="mt-12 bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">Veri İşleme Amaçlarımız</h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {dataProcessingPurposes.map((category, index) => (
              <div key={index} className="border border-gray-200 rounded-xl p-6">
                <h3 className="font-semibold text-gray-900 mb-4 text-center">{category.category}</h3>
                <ul className="space-y-2">
                  {category.purposes.map((purpose, purposeIndex) => (
                    <li key={purposeIndex} className="flex items-start space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-700">{purpose}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Download Section */}
        <div className="mt-8 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl p-8 text-white">
          <h2 className="text-2xl font-bold mb-4 text-center">İlgili Belgeler</h2>
          <p className="text-center text-purple-100 mb-6">
            KVKK ile ilgili detaylı bilgilere aşağıdaki belgelerden ulaşabilirsiniz.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <button className="bg-white text-purple-600 px-6 py-3 rounded-lg font-medium hover:bg-gray-100 transition-colors flex items-center space-x-2">
              <Download className="w-4 h-4" />
              <span>KVKK Aydınlatma Metni</span>
            </button>
            <button className="border border-white text-white px-6 py-3 rounded-lg font-medium hover:bg-white hover:text-purple-600 transition-colors flex items-center space-x-2">
              <FileText className="w-4 h-4" />
              <span>Veri İşleme Envanteri</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KVKKPage;
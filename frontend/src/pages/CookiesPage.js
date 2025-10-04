import React, { useState } from 'react';
import { Cookie, Settings, Eye, BarChart, Shield, Info, Check, X } from 'lucide-react';

const CookiesPage = () => {
  const [cookieSettings, setCookieSettings] = useState({
    necessary: true, // Always enabled
    analytics: true,
    marketing: false,
    preferences: true
  });

  const cookieCategories = [
    {
      id: 'necessary',
      name: 'Gerekli Çerezler',
      icon: Shield,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      description: 'Web sitesinin temel işlevlerinin çalışması için zorunlu çerezlerdir.',
      required: true,
      examples: [
        'Oturum yönetimi çerezi',
        'Güvenlik çerezi', 
        'Dil tercihi çerezi',
        'Alışveriş sepeti çerezi'
      ]
    },
    {
      id: 'analytics',
      name: 'Analitik Çerezler',
      icon: BarChart,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      description: 'Ziyaretçi davranışlarını analiz ederek site performansını iyileştirmemize yardımcı olur.',
      required: false,
      examples: [
        'Google Analytics',
        'Sayfa görüntüleme istatistikleri',
        'Kullanıcı etkileşim verileri',
        'Site performans metrikleri'
      ]
    },
    {
      id: 'marketing',
      name: 'Pazarlama Çerezleri',
      icon: Eye,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      description: 'Kişiselleştirilmiş reklamlar göstermek ve pazarlama etkinliğini ölçmek için kullanılır.',
      required: false,
      examples: [
        'Facebook Pixel',
        'Google Ads çerezi',
        'Retargeting çerezleri',
        'E-posta pazarlama çerezleri'
      ]
    },
    {
      id: 'preferences',
      name: 'Tercih Çerezleri',
      icon: Settings,
      color: 'text-orange-600', 
      bgColor: 'bg-orange-50',
      description: 'Web sitesi tercihlerinizi hatırlar ve kişiselleştirilmiş deneyim sunar.',
      required: false,
      examples: [
        'Tema tercihleri',
        'Font boyutu ayarları',
        'Bölge/konum bilgisi',
        'Önceki arama filtreleri'
      ]
    }
  ];

  const handleCookieChange = (categoryId, enabled) => {
    if (categoryId === 'necessary') return; // Cannot disable necessary cookies
    
    setCookieSettings(prev => ({
      ...prev,
      [categoryId]: enabled
    }));
  };

  const saveSettings = () => {
    // In a real app, this would save to localStorage or send to backend
    localStorage.setItem('cookieSettings', JSON.stringify(cookieSettings));
    alert('Çerez ayarlarınız kaydedildi!');
  };

  const acceptAll = () => {
    const allEnabled = {
      necessary: true,
      analytics: true,
      marketing: true,
      preferences: true
    };
    setCookieSettings(allEnabled);
    localStorage.setItem('cookieSettings', JSON.stringify(allEnabled));
    alert('Tüm çerezler kabul edildi!');
  };

  const rejectAll = () => {
    const onlyNecessary = {
      necessary: true,
      analytics: false,
      marketing: false,
      preferences: false
    };
    setCookieSettings(onlyNecessary);
    localStorage.setItem('cookieSettings', JSON.stringify(onlyNecessary));
    alert('Sadece gerekli çerezler kabul edildi!');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <Cookie className="w-16 h-16 text-amber-600" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Çerez Politikası
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Web sitemizde kullanılan çerezler hakkında detaylı bilgiler ve tercih ayarlarınızı yönetebileceğiniz bölüm.
          </p>
        </div>

        {/* What are cookies */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <div className="flex items-center space-x-3 mb-6">
            <Info className="w-8 h-8 text-blue-600" />
            <h2 className="text-2xl font-bold text-gray-900">Çerez Nedir?</h2>
          </div>
          <div className="space-y-4 text-gray-700">
            <p>
              Çerezler, web sitelerinin tarayıcınızda sakladığı küçük metin dosyalarıdır. 
              Bu dosyalar, site deneyiminizi iyileştirmek ve web sitesinin işlevselliğini sağlamak için kullanılır.
            </p>
            <p>
              Çerezler, oturum bilgilerinizi hatırlamak, tercihlerinizi saklamak ve 
              site performansını analiz etmek gibi çeşitli amaçlarla kullanılmaktadır.
            </p>
          </div>
        </div>

        {/* Cookie Categories */}
        <div className="space-y-6 mb-12">
          {cookieCategories.map((category) => (
            <div key={category.id} className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-4">
                    <div className={`p-3 ${category.bgColor} rounded-lg`}>
                      <category.icon className={`w-6 h-6 ${category.color}`} />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">{category.name}</h3>
                      <p className="text-gray-600 text-sm">{category.description}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    {category.required ? (
                      <div className="flex items-center space-x-2 bg-gray-100 px-3 py-2 rounded-lg">
                        <Shield className="w-4 h-4 text-gray-600" />
                        <span className="text-sm font-medium text-gray-600">Zorunlu</span>
                      </div>
                    ) : (
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={cookieSettings[category.id]}
                          onChange={(e) => handleCookieChange(category.id, e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    )}
                  </div>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3">Bu kategorideki çerez örnekleri:</h4>
                  <div className="grid md:grid-cols-2 gap-2">
                    {category.examples.map((example, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                        <span className="text-sm text-gray-600">{example}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Cookie Management */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Çerez Yönetimi</h2>
          
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Tarayıcı Ayarları</h3>
              <p className="text-gray-600 mb-4">
                Çerezleri tarayıcınızın ayarlarından da yönetebilirsiniz. Popüler tarayıcılar için rehberler:
              </p>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="p-4 border border-gray-200 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Google Chrome</h4>
                  <p className="text-sm text-gray-600">Ayarlar → Gelişmiş → Gizlilik ve güvenlik → Çerezler</p>
                </div>
                <div className="p-4 border border-gray-200 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Mozilla Firefox</h4>
                  <p className="text-sm text-gray-600">Seçenekler → Gizlilik ve Güvenlik → Çerezler</p>
                </div>
                <div className="p-4 border border-gray-200 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Safari</h4>
                  <p className="text-sm text-gray-600">Tercihler → Gizlilik → Çerezleri yönet</p>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Çerez Silme</h3>
              <p className="text-gray-600">
                Mevcut çerezlerinizi tarayıcınızın ayarlarından silebilirsiniz. 
                Bu işlem, site tercihlerinizi sıfırlayacak ve oturumunuzu kapatabilir.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white">
          <h2 className="text-2xl font-bold mb-4 text-center">Çerez Tercihlerinizi Kaydedin</h2>
          <p className="text-center text-blue-100 mb-6">
            Yukarıdaki ayarlarınızı kontrol edip tercihlerinizi kaydedebilirsiniz.
          </p>
          
          <div className="flex flex-wrap justify-center gap-4">
            <button
              onClick={acceptAll}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center space-x-2"
            >
              <Check className="w-4 h-4" />
              <span>Tümünü Kabul Et</span>
            </button>
            
            <button
              onClick={saveSettings}
              className="bg-white text-blue-600 px-6 py-3 rounded-lg font-medium hover:bg-gray-100 transition-colors flex items-center space-x-2"
            >
              <Settings className="w-4 h-4" />
              <span>Seçimi Kaydet</span>
            </button>
            
            <button
              onClick={rejectAll}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center space-x-2"
            >
              <X className="w-4 h-4" />
              <span>Reddet</span>
            </button>
          </div>
        </div>

        {/* Legal Info */}
        <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-2xl p-6">
          <div className="flex items-start space-x-3">
            <Info className="w-6 h-6 text-yellow-600 mt-1" />
            <div>
              <h3 className="font-semibold text-yellow-900 mb-2">Yasal Uyarı</h3>
              <p className="text-yellow-800 text-sm">
                Bu çerez politikası, 6698 sayılı Kişisel Verilerin Korunması Kanunu (KVKK) ve 
                AB Genel Veri Koruma Yönetmeliği (GDPR) uyarınca hazırlanmıştır. 
                Çerez kullanımına devam ederek bu politikayı kabul etmiş sayılırsınız.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CookiesPage;
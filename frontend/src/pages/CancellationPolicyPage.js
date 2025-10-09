import React from 'react';
import { AlertCircle, FileText } from 'lucide-react';

const CancellationPolicyPage = () => {
  const cancellationTerms = [
    {
      period: "90 gün ve daha öncesi",
      refundRate: "%20",
      description: "Toplam kira bedelinin %20'si tahsil edilir."
    },
    {
      period: "89 - 60 gün öncesi",
      refundRate: "%35",
      description: "Toplam kira bedelinin %35'i tahsil edilir."
    },
    {
      period: "59 - 15 gün öncesi",
      refundRate: "%50",
      description: "Toplam kira bedelinin %50'si tahsil edilir."
    },
    {
      period: "14 - 0 gün öncesi",
      refundRate: "%100",
      description: "Toplam kira bedelinin %100'ü tahsil edilir."
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            İptal ve İade Politikası
          </h1>
          <p className="text-lg text-gray-600">
            Yat kiralama rezervasyonlarında uygulanan iptal ve iade koşulları
          </p>
        </div>

        {/* General Terms */}
        <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
          <div className="flex items-start space-x-3 mb-6">
            <FileText className="w-6 h-6 text-gray-700 mt-1 flex-shrink-0" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Genel Koşullar</h2>
              <div className="space-y-4 text-gray-700 leading-relaxed">
                <p>
                  Yat kiralayan kişi sözleşme sonrası, ilgili yatın ilanında açıklanmış iptal ve iade şartlarını eksiksiz olarak okuyup anladığını kabul etmiş sayılır.
                </p>
                <p>
                  Yatı kiralayan kişi, bahsi geçen rezervasyonun iptalini isterse bu iptal, yatın ilanında bulunan yat sahibinin ve acenta belirttiği koşullara göre gerçekleşir.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Cancellation Terms Table */}
        <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">İptal Koşulları</h2>
          
          <div className="overflow-hidden border border-gray-200 rounded-lg">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">İptal Zamanı</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Kesinti Oranı</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Açıklama</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {cancellationTerms.map((term, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900 font-medium">{term.period}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-gray-900">{term.refundRate}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{term.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Special Conditions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-blue-700 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="text-lg font-semibold text-blue-900 mb-3">Özel Durumlar</h3>
              <p className="text-blue-800 leading-relaxed">
                Söz konusu yukarıda belirtilen bedeller, yat acentelerinin ortaklaşa olarak aldıkları kararlardır. 
                Tüm bu şartlara rağmen, önemli bir sebepten dolayı (savaş, afetler ve geri dönüşü olmayan sebepler) 
                yat sahipleri ile görüşülerek "iyi niyet" çerçevesinde ön ödemelerin %100'ü geri iade edilebilmektedir.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CancellationPolicyPage;
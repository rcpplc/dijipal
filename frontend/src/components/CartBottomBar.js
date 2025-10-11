import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart } from 'lucide-react';

const CartBottomBar = ({ totalPrice, itemCount, onCheckout }) => {
  const navigate = useNavigate();

  // Calculate VAT breakdown
  const calculatePriceBreakdown = (totalWithVAT) => {
    const vatRate = 0.20; // %20 KDV
    const totalWithoutVAT = totalWithVAT / (1 + vatRate);
    const vatAmount = totalWithVAT - totalWithoutVAT;
    
    return {
      totalWithoutVAT,
      vatRate,
      vatAmount,
      totalWithVAT
    };
  };

  const priceBreakdown = calculatePriceBreakdown(totalPrice);

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50">
      <div className="h-14 px-4 flex items-center justify-between">
        {/* Sepet Özeti */}
        <div className="flex items-center space-x-2">
          <ShoppingCart className="w-5 h-5 text-gray-600" />
          <div>
            <div className="text-xs text-gray-500">{itemCount} Ürün</div>
            <div className="text-sm font-bold text-gray-900">
              ₺{totalPrice?.toLocaleString('tr-TR') || '0'}
            </div>
          </div>
        </div>

        {/* Rezervasyon Tamamla Butonu */}
        <button
          onClick={onCheckout}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors duration-200 text-sm"
        >
          Rezervasyon Tamamla
        </button>
      </div>
    </div>
  );
};

export default CartBottomBar;

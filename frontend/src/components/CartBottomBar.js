import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart } from 'lucide-react';

const CartBottomBar = ({ totalPrice, itemCount, onCheckout }) => {
  const navigate = useNavigate();

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

        {/* Devam Et Butonu */}
        <button
          onClick={() => navigate('/booking')}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors duration-200 text-sm"
        >
          Sepet Özeti
        </button>
      </div>
    </div>
  );
};

export default CartBottomBar;

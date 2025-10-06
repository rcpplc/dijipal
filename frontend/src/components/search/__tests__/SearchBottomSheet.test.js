import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SearchBottomSheet from '../SearchBottomSheet';
import { fetchSearchSuggestions } from '../../../api/search-mock';

// Mock the API
jest.mock('../../../api/search-mock', () => ({
  fetchSearchSuggestions: jest.fn()
}));

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn()
};
Object.defineProperty(window, 'localStorage', { value: mockLocalStorage });

// Mock navigator.geolocation
const mockGeolocation = {
  getCurrentPosition: jest.fn()
};
Object.defineProperty(navigator, 'geolocation', { value: mockGeolocation });

describe('SearchBottomSheet', () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    onSearch: jest.fn(),
    initialFilters: {}
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);
  });

  describe('Rendering', () => {
    test('renders when isOpen is true', () => {
      render(<SearchBottomSheet {...defaultProps} />);
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Tur Ara')).toBeInTheDocument();
    });

    test('does not render when isOpen is false', () => {
      render(<SearchBottomSheet {...defaultProps} isOpen={false} />);
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    test('renders all tab buttons', () => {
      render(<SearchBottomSheet {...defaultProps} />);
      
      expect(screen.getByRole('tab', { name: /konum/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /kategori/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /tarih/i })).toBeInTheDocument();
    });

    test('has proper ARIA attributes', () => {
      render(<SearchBottomSheet {...defaultProps} />);
      
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
      expect(dialog).toHaveAttribute('aria-labelledby', 'search-title');
    });
  });

  describe('Search Input', () => {
    test('updates search query on input change', async () => {
      const user = userEvent.setup();
      render(<SearchBottomSheet {...defaultProps} />);
      
      const searchInput = screen.getByLabelText('Arama yapın');
      await user.type(searchInput, 'fethiye');
      
      expect(searchInput).toHaveValue('fethiye');
    });

    test('clears search query when clear button is clicked', async () => {
      const user = userEvent.setup();
      render(<SearchBottomSheet {...defaultProps} />);
      
      const searchInput = screen.getByLabelText('Arama yapın');
      await user.type(searchInput, 'fethiye');
      
      const clearButton = screen.getByLabelText('Temizle');
      await user.click(clearButton);
      
      expect(searchInput).toHaveValue('');
    });

    test('fetches suggestions when typing', async () => {
      fetchSearchSuggestions.mockResolvedValue({
        suggestions: [
          { id: 1, name: 'Muğla, Fethiye', type: 'location', tours: 12 }
        ]
      });

      const user = userEvent.setup();
      render(<SearchBottomSheet {...defaultProps} />);
      
      const searchInput = screen.getByLabelText('Arama yapın');
      
      await act(async () => {
        await user.type(searchInput, 'fet');
        // Wait for debounce
        await new Promise(resolve => setTimeout(resolve, 400));
      });

      await waitFor(() => {
        expect(fetchSearchSuggestions).toHaveBeenCalledWith('fet', 'location');
      });
    });
  });

  describe('Tab Navigation', () => {
    test('switches active tab when clicked', async () => {
      const user = userEvent.setup();
      render(<SearchBottomSheet {...defaultProps} />);
      
      const categoryTab = screen.getByRole('tab', { name: /kategori/i });
      await user.click(categoryTab);
      
      expect(categoryTab).toHaveAttribute('aria-selected', 'true');
    });

    test('shows correct content for each tab', async () => {
      const user = userEvent.setup();
      render(<SearchBottomSheet {...defaultProps} />);
      
      // Default is location tab
      expect(screen.getByText('Popüler Destinasyonlar')).toBeInTheDocument();
      
      // Switch to category tab
      const categoryTab = screen.getByRole('tab', { name: /kategori/i });
      await user.click(categoryTab);
      expect(screen.getByText('Popüler Kategoriler')).toBeInTheDocument();
      
      // Switch to date tab
      const dateTab = screen.getByRole('tab', { name: /tarih/i });
      await user.click(dateTab);
      expect(screen.getByText('Bu Hafta Sonu')).toBeInTheDocument();
    });
  });

  describe('Recent Searches', () => {
    test('loads recent searches from localStorage', () => {
      const recentSearches = [
        {
          id: 1,
          timestamp: new Date().toISOString(),
          query: 'fethiye',
          filters: { location: 'Muğla, Fethiye' }
        }
      ];
      
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(recentSearches));
      
      render(<SearchBottomSheet {...defaultProps} />);
      
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('tour_recent_searches');
    });

    test('displays recent searches when no query is entered', () => {
      const recentSearches = [
        {
          id: 1,
          timestamp: new Date().toISOString(),
          query: 'fethiye',
          filters: { location: 'Muğla, Fethiye' }
        }
      ];
      
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(recentSearches));
      
      render(<SearchBottomSheet {...defaultProps} />);
      
      expect(screen.getByText('Son Aramalar')).toBeInTheDocument();
    });
  });

  describe('Search Actions', () => {
    test('calls onSearch with correct data when search button is clicked', async () => {
      const user = userEvent.setup();
      const onSearch = jest.fn();
      
      render(<SearchBottomSheet {...defaultProps} onSearch={onSearch} />);
      
      const searchInput = screen.getByLabelText('Arama yapın');
      await user.type(searchInput, 'fethiye');
      
      const searchButton = screen.getByText('Ara');
      await user.click(searchButton);
      
      expect(onSearch).toHaveBeenCalledWith(
        expect.objectContaining({
          query: 'fethiye',
          filters: expect.any(Object)
        })
      );
    });

    test('calls onClose when search is performed', async () => {
      const user = userEvent.setup();
      const onClose = jest.fn();
      
      render(<SearchBottomSheet {...defaultProps} onClose={onClose} />);
      
      const searchInput = screen.getByLabelText('Arama yapın');
      await user.type(searchInput, 'fethiye');
      
      const searchButton = screen.getByText('Ara');
      await user.click(searchButton);
      
      expect(onClose).toHaveBeenCalled();
    });

    test('saves search to recent searches', async () => {
      const user = userEvent.setup();
      
      render(<SearchBottomSheet {...defaultProps} />);
      
      const searchInput = screen.getByLabelText('Arama yapın');
      await user.type(searchInput, 'fethiye');
      
      const searchButton = screen.getByText('Ara');
      await user.click(searchButton);
      
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'tour_recent_searches',
        expect.any(String)
      );
    });

    test('clears all filters when clear button is clicked', async () => {
      const user = userEvent.setup();
      
      render(<SearchBottomSheet {...defaultProps} />);
      
      const clearButton = screen.getByText('Temizle');
      await user.click(clearButton);
      
      const searchInput = screen.getByLabelText('Arama yapın');
      expect(searchInput).toHaveValue('');
    });
  });

  describe('Keyboard Safe Area', () => {
    test('adjusts for keyboard when visualViewport is available', () => {
      // Mock visualViewport
      const mockVisualViewport = {
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        height: 400
      };
      
      Object.defineProperty(window, 'visualViewport', { 
        value: mockVisualViewport,
        configurable: true
      });
      Object.defineProperty(window, 'innerHeight', { value: 800 });
      
      render(<SearchBottomSheet {...defaultProps} />);
      
      expect(mockVisualViewport.addEventListener).toHaveBeenCalledWith(
        'resize',
        expect.any(Function)
      );
    });
  });

  describe('Error Handling', () => {
    test('displays error message when suggestions fail to load', async () => {
      fetchSearchSuggestions.mockRejectedValue(new Error('Network error'));

      const user = userEvent.setup();
      render(<SearchBottomSheet {...defaultProps} />);
      
      const searchInput = screen.getByLabelText('Arama yapın');
      
      await act(async () => {
        await user.type(searchInput, 'test');
        await new Promise(resolve => setTimeout(resolve, 400));
      });

      await waitFor(() => {
        expect(screen.getByText('Öneriler yüklenirken hata oluştu')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    test('has proper focus management', async () => {
      const user = userEvent.setup();
      render(<SearchBottomSheet {...defaultProps} />);
      
      // Tab navigation should work
      await user.tab();
      expect(screen.getByLabelText('Kapat')).toHaveFocus();
      
      await user.tab();
      expect(screen.getByLabelText('Arama yapın')).toHaveFocus();
    });

    test('supports keyboard navigation for tabs', async () => {
      const user = userEvent.setup();
      render(<SearchBottomSheet {...defaultProps} />);
      
      const categoryTab = screen.getByRole('tab', { name: /kategori/i });
      categoryTab.focus();
      
      await user.keyboard('{Enter}');
      
      expect(categoryTab).toHaveAttribute('aria-selected', 'true');
    });
  });

  describe('Performance', () => {
    test('debounces search input', async () => {
      fetchSearchSuggestions.mockResolvedValue({ suggestions: [] });

      const user = userEvent.setup();
      render(<SearchBottomSheet {...defaultProps} />);
      
      const searchInput = screen.getByLabelText('Arama yapın');
      
      // Type quickly
      await user.type(searchInput, 'fet', { delay: 50 });
      
      // Should not have been called yet
      expect(fetchSearchSuggestions).not.toHaveBeenCalled();
      
      // Wait for debounce
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 400));
      });
      
      // Should be called once after debounce
      expect(fetchSearchSuggestions).toHaveBeenCalledTimes(1);
    });
  });
});
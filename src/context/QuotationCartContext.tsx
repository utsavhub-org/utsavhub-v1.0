import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CartQuotationItem } from '../types';

interface QuotationCartContextType {
  items: CartQuotationItem[];
  addItem: (item: CartQuotationItem) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  cartCount: number;
  totalCartAmount: number;
  isCartOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  vendorIdInCart: string | null;
  vendorNameInCart: string | null;
}

const QuotationCartContext = createContext<QuotationCartContextType>({
  items: [],
  addItem: () => {},
  removeItem: () => {},
  updateQuantity: () => {},
  clearCart: () => {},
  cartCount: 0,
  totalCartAmount: 0,
  isCartOpen: false,
  openCart: () => {},
  closeCart: () => {},
  vendorIdInCart: null,
  vendorNameInCart: null,
});

const CART_STORAGE_KEY = '@utsavhub_quotation_cart_v1';

export const QuotationCartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartQuotationItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Load persisted cart on startup
  useEffect(() => {
    async function loadStoredCart() {
      try {
        const stored = await AsyncStorage.getItem(CART_STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            setItems(parsed);
          }
        }
      } catch (e) {
        console.warn('Failed to load quotation cart:', e);
      }
    }
    loadStoredCart();
  }, []);

  // Save cart changes
  const saveCart = async (newItems: CartQuotationItem[]) => {
    setItems(newItems);
    try {
      await AsyncStorage.setItem(CART_STORAGE_KEY, JSON.stringify(newItems));
    } catch (e) {
      console.warn('Failed to save quotation cart:', e);
    }
  };

  const addItem = (item: CartQuotationItem) => {
    // If item from same business exists with same title, increment quantity
    const existingIndex = items.findIndex((i) => i.id === item.id);
    let updated: CartQuotationItem[];

    if (existingIndex >= 0) {
      updated = items.map((i, idx) =>
        idx === existingIndex
          ? { ...i, quantity: i.quantity + (item.quantity || 1) }
          : i
      );
    } else {
      updated = [...items, { ...item, quantity: item.quantity || 1 }];
    }
    saveCart(updated);
  };

  const removeItem = (itemId: string) => {
    const updated = items.filter((i) => i.id !== itemId);
    saveCart(updated);
  };

  const updateQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(itemId);
      return;
    }
    const updated = items.map((i) =>
      i.id === itemId ? { ...i, quantity } : i
    );
    saveCart(updated);
  };

  const clearCart = () => {
    saveCart([]);
  };

  const cartCount = items.reduce((sum, item) => sum + item.quantity, 0);

  const totalCartAmount = items.reduce(
    (sum, item) => sum + Number(item.unitPrice || 0) * (item.quantity || 1),
    0
  );

  const vendorIdInCart = items.length > 0 ? items[0].businessId : null;
  const vendorNameInCart = items.length > 0 ? items[0].businessName : null;

  return (
    <QuotationCartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        cartCount,
        totalCartAmount,
        isCartOpen,
        openCart: () => setIsCartOpen(true),
        closeCart: () => setIsCartOpen(false),
        vendorIdInCart,
        vendorNameInCart,
      }}
    >
      {children}
    </QuotationCartContext.Provider>
  );
};

export const useQuotationCart = () => useContext(QuotationCartContext);


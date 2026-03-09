import { create } from 'zustand';

// Initial state for easy resetting
const initialState = {
    kasirOpenBills: [],
    kasirSettings: {
        storeName: '',
        storeAddress: '',
        storePhone: '',
        kasirName: '',
        logoUrl: '',
        printWidth: '58'
    },
    hppDraftRecipe: {
        productName: '',
        sellingPrice: 0,
        materials: [],
        wages: [],
        rents: [],
        utilities: [],
        misc: [],
        marketplaceFee: 0,
        productTax: 0,
        platformFeeFixed: 0,
        platformFeeCurrency: 'Rp',
        platformFeePct: 0,
    }
};

export const useStore = create((set) => ({
    ...initialState,

    // Kasir Actions
    setKasirCart: (cart) => set({ kasirCart: typeof cart === 'function' ? cart(useStore.getState().kasirCart) : cart }),
    setKasirOpenBills: (bills) => set({ kasirOpenBills: typeof bills === 'function' ? bills(useStore.getState().kasirOpenBills) : bills }),
    setKasirSettings: (settings) => set({ kasirSettings: settings }),

    // HPP Actions
    setHppDraftRecipe: (recipe) => set({ hppDraftRecipe: typeof recipe === 'function' ? recipe(useStore.getState().hppDraftRecipe) : recipe }),

    // Global Actions
    reset: () => set(initialState)
}));

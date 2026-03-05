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
        materials: [],
        wages: [{ id: 1, desc: '', wage: '', workers: 1, days: 1, total: 0 }],
        rent: [{ id: 1, desc: '', cost: '', period: 1, total: 0 }],
        utilities: [{ id: 1, desc: '', cost: '', total: 0 }],
        miscellaneous: [{ id: 1, desc: '', cost: '', total: 0 }],
        settings: {
            productsPerMonth: '',
            marginPercentage: ''
        }
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

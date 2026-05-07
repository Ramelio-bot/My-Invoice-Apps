import { createContext, useContext, useEffect } from 'react';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
    // Force Light Mode globally
    const dark = false;

    useEffect(() => {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('theme', 'light');
    }, []);

    return (
        <ThemeContext.Provider value={{ dark, setDark: () => {}, toggle: () => {} }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    return useContext(ThemeContext) || { dark: false, setDark: () => {}, toggle: () => {} };
}

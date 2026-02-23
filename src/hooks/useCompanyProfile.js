import { useLocalStorage } from './useLocalStorage';

export function useCompanyProfile() {
    const [profile, setProfile] = useLocalStorage('company_profile', null);
    return { profile, setProfile };
}

export type Country = {
  cca2: string;
  name: {
    common: string;
  };
  flags: {
    png?: string;
    svg?: string;
  };
  idd?: {
    root?: string;
    suffixes?: string[];
  };
};

export const fallbackCountries: Country[] = [
  { cca2: 'CD', name: { common: 'DR Congo' }, flags: { png: 'https://flagcdn.com/w320/cd.png' }, idd: { root: '+2', suffixes: ['43'] } },
  { cca2: 'NG', name: { common: 'Nigeria' }, flags: { png: 'https://flagcdn.com/w320/ng.png' }, idd: { root: '+2', suffixes: ['34'] } },
  { cca2: 'CM', name: { common: 'Cameroon' }, flags: { png: 'https://flagcdn.com/w320/cm.png' }, idd: { root: '+2', suffixes: ['37'] } },
  { cca2: 'GH', name: { common: 'Ghana' }, flags: { png: 'https://flagcdn.com/w320/gh.png' }, idd: { root: '+2', suffixes: ['33'] } },
  { cca2: 'FR', name: { common: 'France' }, flags: { png: 'https://flagcdn.com/w320/fr.png' }, idd: { root: '+3', suffixes: ['3'] } },
];

export function getCallingCode(country: Country) {
  const root = country.idd?.root ?? '';
  const suffix = country.idd?.suffixes?.[0] ?? '';
  return root || suffix ? `${root}${suffix}` : '+243';
}

export async function fetchCountries() {
  const response = await fetch('https://restcountries.com/v3.1/all?fields=cca2,idd,flags,name');
  const countries = (await response.json()) as Country[];

  return countries
    .filter((country) => country.idd?.root && country.name?.common)
    .sort((a, b) => a.name.common.localeCompare(b.name.common));
}

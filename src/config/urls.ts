// URL configuration for Transmilenio website

export const TRANSMILENIO_URLS = {
  base: 'https://www.transmilenio.gov.co',
  routes: 'https://www.transmilenio.gov.co/publicaciones/151510/consulta-de-rutas/',
  map: 'https://www.transmilenio.gov.co/publicaciones/151510/mapa-interactivo/',
  balance: 'https://www.transmilenio.gov.co/publicaciones/151512/consulta-tu-saldo/',
  recharge: 'https://www.transmilenio.gov.co/publicaciones/151512/recarga-web/',
  fares: 'https://www.transmilenio.gov.co/publicaciones/146982/tarifas/',
  stops: 'https://www.transmilenio.gov.co/publicaciones/151510/paraderos-sitp/',
  alerts: 'https://www.transmilenio.gov.co/publicaciones/151734/cambios-operacionales/',
} as const;

export const API_ENDPOINTS = {
  // These might not exist, but placeholders for potential future API integration
  routes: '/api/routes',
  stations: '/api/stations',
  balance: '/api/balance',
} as const;

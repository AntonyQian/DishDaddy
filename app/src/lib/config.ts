/** Base URL of the server, from EXPO_PUBLIC_SERVER_URL (see app/.env.example). */
export const SERVER_URL = (process.env.EXPO_PUBLIC_SERVER_URL ?? 'http://localhost:8787').replace(/\/$/, '');

/** EXPO_PUBLIC_MOCK_SCAN=1 answers Scans with a canned ScanResult instead of calling the server. */
export const MOCK_SCAN = process.env.EXPO_PUBLIC_MOCK_SCAN === '1';

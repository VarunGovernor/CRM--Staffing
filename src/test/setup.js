import '@testing-library/jest-dom';
import { vi, beforeEach } from 'vitest';

// Set Supabase env vars so the client initializes without throwing
process.env.VITE_SUPABASE_URL = 'https://test.supabase.co';
process.env.VITE_SUPABASE_ANON_KEY = 'test-anon-key';

// JSDOM doesn't implement scrollIntoView — mock it globally
window.HTMLElement.prototype.scrollIntoView = vi.fn();

// Reset all mocks and clear storage before each test
beforeEach(() => {
  vi.clearAllMocks();
  try { sessionStorage.clear(); } catch {}
  try { localStorage.clear(); } catch {}
});

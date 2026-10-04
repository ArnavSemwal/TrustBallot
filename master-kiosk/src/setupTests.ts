import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

vi.mock('idb-keyval', () => ({
  get: vi.fn().mockResolvedValue([]),
  set: vi.fn().mockResolvedValue(undefined),
}));

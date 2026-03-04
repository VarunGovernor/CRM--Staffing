import { vi } from 'vitest';

// Chainable query builder — returns itself for all filter/modifier calls,
// resolves as a Promise with { data: [], count: 0, error: null } by default.
export const createQueryBuilder = (overrides = {}) => {
  const defaults = { data: [], count: 0, error: null };
  const result = { ...defaults, ...overrides };

  const qb = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    upsert: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    gt: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lt: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    like: vi.fn().mockReturnThis(),
    ilike: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    contains: vi.fn().mockReturnThis(),
    is: vi.fn().mockReturnThis(),
    or: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
    // Terminal methods
    single: vi.fn().mockResolvedValue({ data: Array.isArray(result.data) ? result.data[0] ?? null : result.data, error: result.error }),
    maybeSingle: vi.fn().mockResolvedValue({ data: Array.isArray(result.data) ? result.data[0] ?? null : result.data, error: result.error }),
    // Make the builder itself await-able (non-terminal reads)
    then: (resolve, reject) => Promise.resolve(result).then(resolve, reject),
  };
  return qb;
};

const createStorageBucket = () => ({
  upload: vi.fn().mockResolvedValue({ error: null }),
  createSignedUrl: vi.fn().mockResolvedValue({ data: { signedUrl: 'https://example.com/signed-url' }, error: null }),
  remove: vi.fn().mockResolvedValue({ error: null }),
});

const createChannelMock = () => {
  let _handler = null;
  const ch = {
    on: vi.fn().mockImplementation((_event, _config, handler) => {
      _handler = handler;
      return ch;
    }),
    subscribe: vi.fn(),
    _trigger: (payload) => _handler?.(payload),
  };
  return ch;
};

export const mockChannel = createChannelMock();

export const supabase = {
  from: vi.fn().mockImplementation(() => createQueryBuilder()),
  auth: {
    getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
    onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
    signUp: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
    signInWithPassword: vi.fn().mockResolvedValue({ data: { user: null, session: null }, error: null }),
    signOut: vi.fn().mockResolvedValue({ error: null }),
    refreshSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
    signInWithOtp: vi.fn().mockResolvedValue({ error: null }),
    verifyOtp: vi.fn().mockResolvedValue({ data: { user: null, session: null }, error: null }),
    updateUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
  },
  storage: {
    from: vi.fn().mockImplementation(() => createStorageBucket()),
  },
  channel: vi.fn().mockReturnValue(mockChannel),
  removeChannel: vi.fn(),
};

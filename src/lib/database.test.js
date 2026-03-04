import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('./supabase');

import { supabase, createQueryBuilder } from './__mocks__/supabase';
import { create, read, readOne, update, hardDelete, softDelete, search, candidates } from './database';

// Helper to re-configure supabase.from for a specific test
const mockFrom = (overrides = {}) => {
  supabase.from.mockImplementation(() => createQueryBuilder(overrides));
};

describe('create()', () => {
  it('returns data on successful insert', async () => {
    const mockRecord = { id: '1', name: 'Test', email: 'a@b.com' };
    supabase.from.mockImplementationOnce(() => {
      const qb = createQueryBuilder({ data: mockRecord });
      qb.single = vi.fn().mockResolvedValue({ data: mockRecord, error: null });
      return qb;
    });

    const result = await create('candidates', { name: 'Test' });
    expect(result.data).toEqual(mockRecord);
    expect(result.error).toBeNull();
  });

  it('returns error when Supabase insert fails', async () => {
    const mockError = { message: 'Duplicate key violation' };
    supabase.from.mockImplementationOnce(() => {
      const qb = createQueryBuilder();
      qb.single = vi.fn().mockResolvedValue({ data: null, error: mockError });
      return qb;
    });

    const result = await create('candidates', { email: 'dup@test.com' });
    expect(result.data).toBeNull();
    expect(result.error).toEqual(mockError);
  });

  it('returns network error when exception is thrown', async () => {
    supabase.from.mockImplementationOnce(() => {
      throw new Error('Network failure');
    });

    const result = await create('candidates', {});
    expect(result.data).toBeNull();
    expect(result.error.message).toBe('Network error. Please try again.');
  });
});

describe('read()', () => {
  it('returns paginated data with defaults', async () => {
    const mockData = [{ id: '1' }, { id: '2' }];
    mockFrom({ data: mockData, count: 2 });

    const result = await read('candidates');
    expect(result.data).toEqual(mockData);
    expect(result.page).toBe(1);
    expect(result.pageSize).toBe(20);
  });

  it('caps pageSize at MAX_PAGE_SIZE (100)', async () => {
    mockFrom({ data: [], count: 0 });

    const result = await read('candidates', { pageSize: 500 });
    expect(result.pageSize).toBe(100);
  });

  it('calculates correct range for page 2', async () => {
    const qb = createQueryBuilder({ data: [], count: 0 });
    supabase.from.mockReturnValueOnce(qb);

    await read('candidates', { page: 2, pageSize: 10 });
    expect(qb.range).toHaveBeenCalledWith(10, 19);
  });

  it('applies eq filter correctly', async () => {
    const qb = createQueryBuilder({ data: [], count: 0 });
    supabase.from.mockReturnValueOnce(qb);

    await read('candidates', { filters: [{ column: 'status', operator: 'eq', value: 'active' }] });
    expect(qb.eq).toHaveBeenCalledWith('status', 'active');
  });

  it('applies ilike filter correctly', async () => {
    const qb = createQueryBuilder({ data: [], count: 0 });
    supabase.from.mockReturnValueOnce(qb);

    await read('candidates', { filters: [{ column: 'email', operator: 'ilike', value: '%@test.com' }] });
    expect(qb.ilike).toHaveBeenCalledWith('email', '%@test.com');
  });

  it('applies in filter correctly', async () => {
    const qb = createQueryBuilder({ data: [], count: 0 });
    supabase.from.mockReturnValueOnce(qb);

    await read('candidates', { filters: [{ column: 'status', operator: 'in', value: ['active', 'placed'] }] });
    expect(qb.in).toHaveBeenCalledWith('status', ['active', 'placed']);
  });

  it('applies order correctly', async () => {
    const qb = createQueryBuilder({ data: [], count: 0 });
    supabase.from.mockReturnValueOnce(qb);

    await read('candidates', { order: { column: 'full_name', ascending: true } });
    expect(qb.order).toHaveBeenCalledWith('full_name', { ascending: true });
  });

  it('calculates totalPages correctly', async () => {
    mockFrom({ data: [], count: 45 });
    const result = await read('candidates', { pageSize: 20 });
    expect(result.totalPages).toBe(3);
  });

  it('returns network error on exception', async () => {
    supabase.from.mockImplementationOnce(() => { throw new Error('Network failure'); });
    const result = await read('candidates');
    expect(result.data).toBeNull();
    expect(result.error.message).toBe('Network error. Please try again.');
  });
});

describe('readOne()', () => {
  it('calls eq with id and returns single record', async () => {
    const mockRecord = { id: 'abc', full_name: 'John Doe' };
    supabase.from.mockImplementationOnce(() => {
      const qb = createQueryBuilder({ data: mockRecord });
      qb.single = vi.fn().mockResolvedValue({ data: mockRecord, error: null });
      return qb;
    });

    const result = await readOne('candidates', 'abc');
    expect(result.data).toEqual(mockRecord);
  });
});

describe('update()', () => {
  it('adds updated_at timestamp to the payload', async () => {
    const qb = createQueryBuilder();
    qb.single = vi.fn().mockResolvedValue({ data: { id: '1' }, error: null });
    supabase.from.mockReturnValueOnce(qb);

    await update('candidates', '1', { status: 'placed' });
    const updateCall = qb.update.mock.calls[0][0];
    expect(updateCall).toHaveProperty('updated_at');
    expect(updateCall.status).toBe('placed');
  });

  it('calls eq with the record id', async () => {
    const qb = createQueryBuilder();
    qb.single = vi.fn().mockResolvedValue({ data: { id: 'xyz' }, error: null });
    supabase.from.mockReturnValueOnce(qb);

    await update('candidates', 'xyz', { notes: 'test' });
    expect(qb.eq).toHaveBeenCalledWith('id', 'xyz');
  });
});

describe('hardDelete()', () => {
  it('calls delete().eq() with the record id', async () => {
    const qb = createQueryBuilder();
    qb.then = (resolve) => Promise.resolve({ error: null }).then(resolve);
    supabase.from.mockReturnValueOnce(qb);

    await hardDelete('candidates', 'del-1');
    expect(qb.delete).toHaveBeenCalled();
    expect(qb.eq).toHaveBeenCalledWith('id', 'del-1');
  });
});

describe('softDelete()', () => {
  it('sets is_active to false by default', async () => {
    const qb = createQueryBuilder();
    qb.single = vi.fn().mockResolvedValue({ data: { id: '1', is_active: false }, error: null });
    supabase.from.mockReturnValueOnce(qb);

    await softDelete('vendors', '1');
    const updateCall = qb.update.mock.calls[0][0];
    expect(updateCall.is_active).toBe(false);
  });

  it('uses custom statusColumn and deletedValue', async () => {
    const qb = createQueryBuilder();
    qb.single = vi.fn().mockResolvedValue({ data: { id: '1', status: 'inactive' }, error: null });
    supabase.from.mockReturnValueOnce(qb);

    await softDelete('candidates', '1', { statusColumn: 'status', deletedValue: 'inactive' });
    const updateCall = qb.update.mock.calls[0][0];
    expect(updateCall.status).toBe('inactive');
  });
});

describe('search()', () => {
  it('calls or() with ilike pattern for each column', async () => {
    const qb = createQueryBuilder({ data: [], count: 0 });
    supabase.from.mockReturnValueOnce(qb);

    await search('candidates', 'john', ['first_name', 'last_name', 'email']);
    expect(qb.or).toHaveBeenCalledWith(
      'first_name.ilike.%john%,last_name.ilike.%john%,email.ilike.%john%'
    );
  });

  it('falls back to read() when searchTerm is empty', async () => {
    mockFrom({ data: [{ id: '1' }], count: 1 });
    const result = await search('candidates', '', ['first_name']);
    expect(result.data).toBeDefined();
  });
});

describe('candidates table helper', () => {
  it('list() uses recruiter join in select', async () => {
    const qb = createQueryBuilder({ data: [], count: 0 });
    supabase.from.mockReturnValueOnce(qb);

    await candidates.list();
    const selectArg = qb.select.mock.calls[0][0];
    expect(selectArg).toContain('recruiter:user_profiles!recruiter_id');
  });

  it('get() calls eq with the provided id', async () => {
    const qb = createQueryBuilder();
    qb.single = vi.fn().mockResolvedValue({ data: { id: 'c1' }, error: null });
    supabase.from.mockReturnValueOnce(qb);

    await candidates.get('c1');
    expect(qb.eq).toHaveBeenCalledWith('id', 'c1');
  });

  it('search() searches across first_name, last_name, email, skills', async () => {
    const qb = createQueryBuilder({ data: [], count: 0 });
    supabase.from.mockReturnValueOnce(qb);

    await candidates.search('react');
    const orArg = qb.or.mock.calls[0][0];
    expect(orArg).toContain('first_name.ilike.%react%');
    expect(orArg).toContain('last_name.ilike.%react%');
    expect(orArg).toContain('email.ilike.%react%');
    expect(orArg).toContain('skills.ilike.%react%');
  });

  it('delete() sets status to inactive (soft delete)', async () => {
    const qb = createQueryBuilder();
    qb.single = vi.fn().mockResolvedValue({ data: { id: '1', status: 'inactive' }, error: null });
    supabase.from.mockReturnValueOnce(qb);

    await candidates.delete('1');
    const updateCall = qb.update.mock.calls[0][0];
    expect(updateCall.status).toBe('inactive');
  });
});

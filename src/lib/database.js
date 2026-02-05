import { supabase } from './supabase';

/**
 * Generic CRUD helpers for Supabase tables.
 * All operations respect RLS policies defined in the database.
 */

// Default pagination settings
const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

/**
 * CREATE - Insert a new record
 * @param {string} table - Table name
 * @param {object} data - Record data to insert
 * @param {object} options - Additional options
 * @param {string} options.select - Columns to return (default: '*')
 * @returns {Promise<{data: object|null, error: object|null}>}
 */
export const create = async (table, data, options = {}) => {
  const { select = '*' } = options;

  try {
    const { data: result, error } = await supabase
      .from(table)
      .insert(data)
      .select(select)
      .single();

    return { data: result, error };
  } catch (error) {
    return { data: null, error: { message: 'Network error. Please try again.' } };
  }
};

/**
 * CREATE MANY - Insert multiple records
 * @param {string} table - Table name
 * @param {object[]} records - Array of records to insert
 * @param {object} options - Additional options
 * @returns {Promise<{data: object[]|null, error: object|null}>}
 */
export const createMany = async (table, records, options = {}) => {
  const { select = '*' } = options;

  try {
    const { data: result, error } = await supabase
      .from(table)
      .insert(records)
      .select(select);

    return { data: result, error };
  } catch (error) {
    return { data: null, error: { message: 'Network error. Please try again.' } };
  }
};

/**
 * READ - Fetch records with pagination, filtering, and sorting
 * @param {string} table - Table name
 * @param {object} options - Query options
 * @param {string} options.select - Columns to select (supports relations)
 * @param {object[]} options.filters - Array of filter objects [{column, operator, value}]
 * @param {object} options.order - Sort order {column, ascending}
 * @param {number} options.page - Page number (1-indexed)
 * @param {number} options.pageSize - Items per page
 * @param {boolean} options.count - Whether to return total count
 * @returns {Promise<{data: object[]|null, count: number|null, error: object|null}>}
 */
export const read = async (table, options = {}) => {
  const {
    select = '*',
    filters = [],
    order = { column: 'created_at', ascending: false },
    page = 1,
    pageSize = DEFAULT_PAGE_SIZE,
    count = true
  } = options;

  const safePageSize = Math.min(pageSize, MAX_PAGE_SIZE);
  const from = (page - 1) * safePageSize;
  const to = from + safePageSize - 1;

  try {
    let query = supabase
      .from(table)
      .select(select, { count: count ? 'exact' : undefined });

    // Apply filters
    filters.forEach(({ column, operator, value }) => {
      switch (operator) {
        case 'eq':
          query = query.eq(column, value);
          break;
        case 'neq':
          query = query.neq(column, value);
          break;
        case 'gt':
          query = query.gt(column, value);
          break;
        case 'gte':
          query = query.gte(column, value);
          break;
        case 'lt':
          query = query.lt(column, value);
          break;
        case 'lte':
          query = query.lte(column, value);
          break;
        case 'like':
          query = query.like(column, value);
          break;
        case 'ilike':
          query = query.ilike(column, value);
          break;
        case 'in':
          query = query.in(column, value);
          break;
        case 'contains':
          query = query.contains(column, value);
          break;
        case 'is':
          query = query.is(column, value);
          break;
        default:
          query = query.eq(column, value);
      }
    });

    // Apply ordering
    if (order?.column) {
      query = query.order(order.column, { ascending: order.ascending ?? false });
    }

    // Apply pagination
    query = query.range(from, to);

    const { data: result, count: totalCount, error } = await query;

    return {
      data: result,
      count: totalCount,
      page,
      pageSize: safePageSize,
      totalPages: totalCount ? Math.ceil(totalCount / safePageSize) : null,
      error
    };
  } catch (error) {
    return { data: null, count: null, error: { message: 'Network error. Please try again.' } };
  }
};

/**
 * READ ONE - Fetch a single record by ID
 * @param {string} table - Table name
 * @param {string} id - Record UUID
 * @param {object} options - Query options
 * @param {string} options.select - Columns to select
 * @returns {Promise<{data: object|null, error: object|null}>}
 */
export const readOne = async (table, id, options = {}) => {
  const { select = '*' } = options;

  try {
    const { data: result, error } = await supabase
      .from(table)
      .select(select)
      .eq('id', id)
      .single();

    return { data: result, error };
  } catch (error) {
    return { data: null, error: { message: 'Network error. Please try again.' } };
  }
};

/**
 * UPDATE - Update a record by ID
 * @param {string} table - Table name
 * @param {string} id - Record UUID
 * @param {object} data - Fields to update
 * @param {object} options - Additional options
 * @returns {Promise<{data: object|null, error: object|null}>}
 */
export const update = async (table, id, data, options = {}) => {
  const { select = '*' } = options;

  // Add updated_at timestamp
  const updateData = {
    ...data,
    updated_at: new Date().toISOString()
  };

  try {
    const { data: result, error } = await supabase
      .from(table)
      .update(updateData)
      .eq('id', id)
      .select(select)
      .single();

    return { data: result, error };
  } catch (error) {
    return { data: null, error: { message: 'Network error. Please try again.' } };
  }
};

/**
 * UPDATE MANY - Update multiple records matching filters
 * @param {string} table - Table name
 * @param {object[]} filters - Array of filter objects
 * @param {object} data - Fields to update
 * @returns {Promise<{data: object[]|null, error: object|null}>}
 */
export const updateMany = async (table, filters, data, options = {}) => {
  const { select = '*' } = options;

  const updateData = {
    ...data,
    updated_at: new Date().toISOString()
  };

  try {
    let query = supabase.from(table).update(updateData);

    filters.forEach(({ column, operator, value }) => {
      if (operator === 'eq') {
        query = query.eq(column, value);
      } else if (operator === 'in') {
        query = query.in(column, value);
      }
    });

    const { data: result, error } = await query.select(select);

    return { data: result, error };
  } catch (error) {
    return { data: null, error: { message: 'Network error. Please try again.' } };
  }
};

/**
 * SOFT DELETE - Mark a record as inactive/deleted
 * @param {string} table - Table name
 * @param {string} id - Record UUID
 * @param {object} options - Options
 * @param {string} options.statusColumn - Column to use for soft delete (default: 'is_active')
 * @param {any} options.deletedValue - Value indicating deleted state (default: false)
 * @returns {Promise<{data: object|null, error: object|null}>}
 */
export const softDelete = async (table, id, options = {}) => {
  const { statusColumn = 'is_active', deletedValue = false } = options;

  try {
    const { data: result, error } = await supabase
      .from(table)
      .update({
        [statusColumn]: deletedValue,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    return { data: result, error };
  } catch (error) {
    return { data: null, error: { message: 'Network error. Please try again.' } };
  }
};

/**
 * HARD DELETE - Permanently remove a record
 * Use with caution - prefer softDelete for audit trails
 * @param {string} table - Table name
 * @param {string} id - Record UUID
 * @returns {Promise<{error: object|null}>}
 */
export const hardDelete = async (table, id) => {
  try {
    const { error } = await supabase
      .from(table)
      .delete()
      .eq('id', id);

    return { error };
  } catch (error) {
    return { error: { message: 'Network error. Please try again.' } };
  }
};

/**
 * SEARCH - Full-text search across columns
 * @param {string} table - Table name
 * @param {string} searchTerm - Search term
 * @param {string[]} columns - Columns to search
 * @param {object} options - Additional query options
 * @returns {Promise<{data: object[]|null, count: number|null, error: object|null}>}
 */
export const search = async (table, searchTerm, columns, options = {}) => {
  const { select = '*', page = 1, pageSize = DEFAULT_PAGE_SIZE } = options;

  if (!searchTerm || columns.length === 0) {
    return read(table, options);
  }

  const safePageSize = Math.min(pageSize, MAX_PAGE_SIZE);
  const from = (page - 1) * safePageSize;
  const to = from + safePageSize - 1;

  try {
    // Build OR filter for multiple columns
    const orFilter = columns
      .map(col => `${col}.ilike.%${searchTerm}%`)
      .join(',');

    const { data: result, count, error } = await supabase
      .from(table)
      .select(select, { count: 'exact' })
      .or(orFilter)
      .range(from, to);

    return {
      data: result,
      count,
      page,
      pageSize: safePageSize,
      totalPages: count ? Math.ceil(count / safePageSize) : null,
      error
    };
  } catch (error) {
    return { data: null, count: null, error: { message: 'Network error. Please try again.' } };
  }
};

/**
 * UPSERT - Insert or update based on conflict
 * @param {string} table - Table name
 * @param {object} data - Record data
 * @param {object} options - Options
 * @param {string} options.onConflict - Conflict column(s)
 * @returns {Promise<{data: object|null, error: object|null}>}
 */
export const upsert = async (table, data, options = {}) => {
  const { onConflict, select = '*' } = options;

  try {
    const { data: result, error } = await supabase
      .from(table)
      .upsert(data, { onConflict })
      .select(select)
      .single();

    return { data: result, error };
  } catch (error) {
    return { data: null, error: { message: 'Network error. Please try again.' } };
  }
};

// Table-specific helpers with proper relations

export const candidates = {
  async list(options = {}) {
    return read('candidates', {
      select: `
        *,
        recruiter:user_profiles!recruiter_id(id, full_name, email),
        created_by_user:user_profiles!created_by(id, full_name)
      `,
      ...options
    });
  },
  async get(id) {
    return readOne('candidates', id, {
      select: `
        *,
        recruiter:user_profiles!recruiter_id(id, full_name, email),
        created_by_user:user_profiles!created_by(id, full_name)
      `
    });
  },
  async create(data) {
    return create('candidates', data);
  },
  async update(id, data) {
    return update('candidates', id, data);
  },
  async delete(id) {
    return softDelete('candidates', id, { statusColumn: 'status', deletedValue: 'inactive' });
  },
  async search(term, options = {}) {
    return search('candidates', term, ['first_name', 'last_name', 'email', 'skills'], options);
  }
};

export const submissions = {
  async list(options = {}) {
    return read('submissions', {
      select: `
        *,
        candidate:candidates(id, first_name, last_name, email),
        vendor:vendors(id, name, tier),
        sales_person:user_profiles!sales_person_id(id, full_name)
      `,
      ...options
    });
  },
  async get(id) {
    return readOne('submissions', id, {
      select: `
        *,
        candidate:candidates(*),
        vendor:vendors(*),
        sales_person:user_profiles!sales_person_id(id, full_name)
      `
    });
  },
  async create(data) {
    return create('submissions', data);
  },
  async update(id, data) {
    return update('submissions', id, data);
  },
  async delete(id) {
    return hardDelete('submissions', id);
  }
};

export const interviews = {
  async list(options = {}) {
    return read('interviews', {
      select: `
        *,
        candidate:candidates(id, first_name, last_name, email),
        submission:submissions(id, job_title, vendor:vendors(id, name)),
        mentor:user_profiles!mentor_id(id, full_name)
      `,
      ...options
    });
  },
  async get(id) {
    return readOne('interviews', id, {
      select: `
        *,
        candidate:candidates(*),
        submission:submissions(*, vendor:vendors(*)),
        mentor:user_profiles!mentor_id(id, full_name)
      `
    });
  },
  async create(data) {
    return create('interviews', data);
  },
  async update(id, data) {
    return update('interviews', id, data);
  },
  async delete(id) {
    return hardDelete('interviews', id);
  }
};

export const placements = {
  async list(options = {}) {
    return read('placements', {
      select: `
        *,
        candidate:candidates(id, first_name, last_name, email),
        vendor:vendors(id, name, tier),
        submission:submissions(id, job_title)
      `,
      ...options
    });
  },
  async get(id) {
    return readOne('placements', id, {
      select: `
        *,
        candidate:candidates(*),
        vendor:vendors(*),
        submission:submissions(*)
      `
    });
  },
  async create(data) {
    return create('placements', data);
  },
  async update(id, data) {
    return update('placements', id, data);
  },
  async delete(id) {
    return softDelete('placements', id, { statusColumn: 'status', deletedValue: 'terminated' });
  }
};

export const vendors = {
  async list(options = {}) {
    return read('vendors', { ...options });
  },
  async get(id) {
    return readOne('vendors', id);
  },
  async create(data) {
    return create('vendors', data);
  },
  async update(id, data) {
    return update('vendors', id, data);
  },
  async delete(id) {
    return softDelete('vendors', id);
  }
};

export const invoices = {
  async list(options = {}) {
    return read('invoices', {
      select: `
        *,
        candidate:candidates(id, first_name, last_name),
        placement:placements(id, job_title, client_name),
        created_by_user:user_profiles!created_by(id, full_name)
      `,
      ...options
    });
  },
  async get(id) {
    return readOne('invoices', id, {
      select: `
        *,
        candidate:candidates(*),
        placement:placements(*),
        created_by_user:user_profiles!created_by(id, full_name)
      `
    });
  },
  async create(data) {
    return create('invoices', data);
  },
  async update(id, data) {
    return update('invoices', id, data);
  },
  async delete(id) {
    return softDelete('invoices', id, { statusColumn: 'status', deletedValue: 'cancelled' });
  }
};

export const hrOnboarding = {
  async list(options = {}) {
    return read('hr_onboarding', {
      select: `
        *,
        candidate:candidates(id, first_name, last_name, email),
        placement:placements(id, job_title, client_name),
        hr_manager:user_profiles!hr_manager_id(id, full_name)
      `,
      ...options
    });
  },
  async get(id) {
    return readOne('hr_onboarding', id, {
      select: `
        *,
        candidate:candidates(*),
        placement:placements(*),
        hr_manager:user_profiles!hr_manager_id(id, full_name)
      `
    });
  },
  async create(data) {
    return create('hr_onboarding', data);
  },
  async update(id, data) {
    return update('hr_onboarding', id, data);
  },
  async delete(id) {
    return hardDelete('hr_onboarding', id);
  }
};

export const complianceForms = {
  async list(options = {}) {
    return read('compliance_forms', {
      select: `
        *,
        candidate:candidates(id, first_name, last_name),
        verified_by_user:user_profiles!verified_by(id, full_name)
      `,
      ...options
    });
  },
  async get(id) {
    return readOne('compliance_forms', id, {
      select: `
        *,
        candidate:candidates(*),
        verified_by_user:user_profiles!verified_by(id, full_name)
      `
    });
  },
  async create(data) {
    return create('compliance_forms', data);
  },
  async update(id, data) {
    return update('compliance_forms', id, data);
  },
  async delete(id) {
    return hardDelete('compliance_forms', id);
  }
};

export const userProfiles = {
  async list(options = {}) {
    return read('user_profiles', { ...options });
  },
  async get(id) {
    return readOne('user_profiles', id);
  },
  async update(id, data) {
    return update('user_profiles', id, data);
  }
};

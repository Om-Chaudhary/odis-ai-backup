/**
 * Tests for BaseRepository class
 * - CRUD operations (findById, findOne, findMany, create, update, delete)
 * - Query building and error handling
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { BaseRepository } from "../repositories/base";
import type { SupabaseClient } from "@supabase/supabase-js";

/* ========================================
   Mock Utilities (inlined from @odis-ai/testing)
   ======================================== */

interface MockQueryBuilder {
  select: ReturnType<typeof vi.fn>;
  insert: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
  eq: ReturnType<typeof vi.fn>;
  range: ReturnType<typeof vi.fn>;
  order: ReturnType<typeof vi.fn>;
  limit: ReturnType<typeof vi.fn>;
  single: ReturnType<typeof vi.fn>;
  then: ReturnType<typeof vi.fn>;
}

function createMockQueryBuilder(
  resolveWith:
    | { data: unknown; error: null }
    | { data: null; error: unknown } = {
    data: [],
    error: null,
  },
): MockQueryBuilder {
  const builder: MockQueryBuilder = {} as MockQueryBuilder;

  const chainableMethods = [
    "select",
    "insert",
    "update",
    "delete",
    "eq",
    "range",
    "order",
    "limit",
  ] as const;

  chainableMethods.forEach((method) => {
    builder[method] = vi.fn().mockReturnValue(builder);
  });

  builder.single = vi.fn().mockResolvedValue(resolveWith);
  builder.then = vi.fn((resolve) => resolve(resolveWith));

  return builder;
}

function createMockSupabaseClient() {
  const queryBuilder = createMockQueryBuilder();
  const from = vi.fn().mockReturnValue(queryBuilder);

  return {
    client: { from } as Partial<SupabaseClient>,
    from,
    queryBuilder,
  };
}

/* ========================================
   Test Setup
   ======================================== */

/**
 * Test record type
 */
interface TestRecord {
  id: string;
  name: string;
  status: string;
  created_at: string;
}

/**
 * Concrete implementation of BaseRepository for testing
 */
class TestRepository extends BaseRepository<TestRecord> {
  constructor(supabase: SupabaseClient) {
    super(supabase, "test_table");
  }
}

describe("BaseRepository", () => {
  let mockSupabase: ReturnType<typeof createMockSupabaseClient>;
  let repository: TestRepository;

  beforeEach(() => {
    mockSupabase = createMockSupabaseClient();
    repository = new TestRepository(
      mockSupabase.client as unknown as SupabaseClient,
    );
  });

  /* ========================================
     findById Tests
     ======================================== */

  describe("findById", () => {
    it("returns record when found", async () => {
      const testRecord: TestRecord = {
        id: "test-1",
        name: "Test Record",
        status: "active",
        created_at: "2024-12-01T00:00:00Z",
      };

      const queryBuilder = createMockQueryBuilder({
        data: testRecord,
        error: null,
      });
      mockSupabase.from.mockReturnValue(queryBuilder);

      const result = await repository.findById("test-1");

      expect(result).toEqual(testRecord);
      expect(mockSupabase.from).toHaveBeenCalledWith("test_table");
      expect(queryBuilder.select).toHaveBeenCalledWith("*");
      expect(queryBuilder.eq).toHaveBeenCalledWith("id", "test-1");
      expect(queryBuilder.single).toHaveBeenCalled();
    });

    it("returns null when record not found (PGRST116)", async () => {
      const queryBuilder = createMockQueryBuilder();
      queryBuilder.single = vi.fn().mockResolvedValue({
        data: null,
        error: { code: "PGRST116", message: "No rows found" },
      });
      mockSupabase.from.mockReturnValue(queryBuilder);

      const result = await repository.findById("nonexistent");

      expect(result).toBeNull();
    });

    it("throws DatabaseError on other errors", async () => {
      const queryBuilder = createMockQueryBuilder();
      queryBuilder.single = vi.fn().mockResolvedValue({
        data: null,
        error: { code: "42P01", message: "Table does not exist" },
      });
      mockSupabase.from.mockReturnValue(queryBuilder);

      await expect(repository.findById("test-1")).rejects.toThrow(
        "Failed to find test_table by ID",
      );
    });
  });

  /* ========================================
     findOne Tests
     ======================================== */

  describe("findOne", () => {
    it("returns record matching criteria", async () => {
      const testRecord: TestRecord = {
        id: "test-1",
        name: "Test Record",
        status: "active",
        created_at: "2024-12-01T00:00:00Z",
      };

      const queryBuilder = createMockQueryBuilder({
        data: testRecord,
        error: null,
      });
      mockSupabase.from.mockReturnValue(queryBuilder);

      const result = await repository.findOne({
        status: "active",
      } as Partial<TestRecord>);

      expect(result).toEqual(testRecord);
      expect(queryBuilder.eq).toHaveBeenCalledWith("status", "active");
    });

    it("applies multiple criteria", async () => {
      const queryBuilder = createMockQueryBuilder({
        data: { id: "test-1", name: "Test", status: "active", created_at: "" },
        error: null,
      });
      mockSupabase.from.mockReturnValue(queryBuilder);

      await repository.findOne({
        status: "active",
        name: "Test",
      } as Partial<TestRecord>);

      expect(queryBuilder.eq).toHaveBeenCalledWith("status", "active");
      expect(queryBuilder.eq).toHaveBeenCalledWith("name", "Test");
    });

    it("returns null when no match found", async () => {
      const queryBuilder = createMockQueryBuilder();
      queryBuilder.single = vi.fn().mockResolvedValue({
        data: null,
        error: { code: "PGRST116", message: "No rows found" },
      });
      mockSupabase.from.mockReturnValue(queryBuilder);

      const result = await repository.findOne({
        status: "nonexistent",
      } as Partial<TestRecord>);

      expect(result).toBeNull();
    });
  });

  /* ========================================
     findMany Tests
     ======================================== */

  describe("findMany", () => {
    it("returns array of matching records", async () => {
      const testRecords: TestRecord[] = [
        { id: "1", name: "Record 1", status: "active", created_at: "" },
        { id: "2", name: "Record 2", status: "active", created_at: "" },
      ];

      const queryBuilder = createMockQueryBuilder();
      // Override then to return array
      queryBuilder.then = vi.fn((resolve) =>
        resolve({ data: testRecords, error: null }),
      );
      mockSupabase.from.mockReturnValue(queryBuilder);

      const result = await repository.findMany({
        status: "active",
      } as Partial<TestRecord>);

      expect(result).toEqual(testRecords);
    });

    it("returns empty array when no matches", async () => {
      const queryBuilder = createMockQueryBuilder();
      queryBuilder.then = vi.fn((resolve) =>
        resolve({ data: [], error: null }),
      );
      mockSupabase.from.mockReturnValue(queryBuilder);

      const result = await repository.findMany({
        status: "nonexistent",
      } as Partial<TestRecord>);

      expect(result).toEqual([]);
    });

    it("applies limit option", async () => {
      const queryBuilder = createMockQueryBuilder();
      queryBuilder.then = vi.fn((resolve) =>
        resolve({ data: [], error: null }),
      );
      mockSupabase.from.mockReturnValue(queryBuilder);

      await repository.findMany({}, { limit: 10 });

      expect(queryBuilder.limit).toHaveBeenCalledWith(10);
    });

    it("applies orderBy option", async () => {
      const queryBuilder = createMockQueryBuilder();
      queryBuilder.then = vi.fn((resolve) =>
        resolve({ data: [], error: null }),
      );
      mockSupabase.from.mockReturnValue(queryBuilder);

      await repository.findMany(
        {},
        { orderBy: { column: "created_at", ascending: false } },
      );

      expect(queryBuilder.order).toHaveBeenCalledWith("created_at", {
        ascending: false,
      });
    });

    it("applies offset with range", async () => {
      const queryBuilder = createMockQueryBuilder();
      queryBuilder.then = vi.fn((resolve) =>
        resolve({ data: [], error: null }),
      );
      mockSupabase.from.mockReturnValue(queryBuilder);

      await repository.findMany({}, { offset: 20, limit: 10 });

      expect(queryBuilder.range).toHaveBeenCalledWith(20, 29);
    });
  });

  /* ========================================
     create Tests
     ======================================== */

  describe("create", () => {
    it("creates and returns new record", async () => {
      const newRecord = { name: "New Record", status: "pending" };
      const createdRecord: TestRecord = {
        id: "new-1",
        ...newRecord,
        created_at: "2024-12-01T00:00:00Z",
      };

      const queryBuilder = createMockQueryBuilder({
        data: createdRecord,
        error: null,
      });
      mockSupabase.from.mockReturnValue(queryBuilder);

      const result = await repository.create(newRecord as Partial<TestRecord>);

      expect(result).toEqual(createdRecord);
      expect(queryBuilder.insert).toHaveBeenCalledWith(newRecord);
      expect(queryBuilder.select).toHaveBeenCalled();
    });

    it("throws DatabaseError on insert failure", async () => {
      const queryBuilder = createMockQueryBuilder();
      queryBuilder.single = vi.fn().mockResolvedValue({
        data: null,
        error: { code: "23505", message: "Duplicate key" },
      });
      mockSupabase.from.mockReturnValue(queryBuilder);

      await expect(
        repository.create({ name: "Test" } as Partial<TestRecord>),
      ).rejects.toThrow("Failed to create test_table");
    });
  });

  /* ========================================
     update Tests
     ======================================== */

  describe("update", () => {
    it("updates and returns record", async () => {
      const updatedRecord: TestRecord = {
        id: "test-1",
        name: "Updated Name",
        status: "active",
        created_at: "2024-12-01T00:00:00Z",
      };

      const queryBuilder = createMockQueryBuilder({
        data: updatedRecord,
        error: null,
      });
      mockSupabase.from.mockReturnValue(queryBuilder);

      const result = await repository.update("test-1", {
        name: "Updated Name",
      } as Partial<TestRecord>);

      expect(result).toEqual(updatedRecord);
      expect(queryBuilder.update).toHaveBeenCalledWith({
        name: "Updated Name",
      });
      expect(queryBuilder.eq).toHaveBeenCalledWith("id", "test-1");
    });

    it("throws DatabaseError on update failure", async () => {
      const queryBuilder = createMockQueryBuilder();
      queryBuilder.single = vi.fn().mockResolvedValue({
        data: null,
        error: { code: "42P01", message: "Table not found" },
      });
      mockSupabase.from.mockReturnValue(queryBuilder);

      await expect(
        repository.update("test-1", { name: "Test" } as Partial<TestRecord>),
      ).rejects.toThrow("Failed to update test_table");
    });
  });

  /* ========================================
     updateMany Tests
     ======================================== */

  describe("updateMany", () => {
    it("updates multiple records matching criteria", async () => {
      const updatedRecords: TestRecord[] = [
        { id: "1", name: "Name", status: "archived", created_at: "" },
        { id: "2", name: "Name", status: "archived", created_at: "" },
      ];

      const queryBuilder = createMockQueryBuilder();
      queryBuilder.select = vi.fn().mockResolvedValue({
        data: updatedRecords,
        error: null,
      });
      mockSupabase.from.mockReturnValue(queryBuilder);

      const result = await repository.updateMany(
        { status: "active" } as Partial<TestRecord>,
        { status: "archived" } as Partial<TestRecord>,
      );

      expect(result).toEqual(updatedRecords);
      expect(queryBuilder.update).toHaveBeenCalledWith({ status: "archived" });
      expect(queryBuilder.eq).toHaveBeenCalledWith("status", "active");
    });
  });

  /* ========================================
     delete Tests
     ======================================== */

  describe("delete", () => {
    it("deletes record by ID", async () => {
      const queryBuilder = createMockQueryBuilder();
      queryBuilder.then = vi.fn((resolve) =>
        resolve({ data: null, error: null }),
      );
      mockSupabase.from.mockReturnValue(queryBuilder);

      await repository.delete("test-1");

      expect(queryBuilder.delete).toHaveBeenCalled();
      expect(queryBuilder.eq).toHaveBeenCalledWith("id", "test-1");
    });

    it("throws DatabaseError on delete failure", async () => {
      const queryBuilder = createMockQueryBuilder();
      queryBuilder.then = vi.fn((resolve) =>
        resolve({
          data: null,
          error: { code: "42P01", message: "Table not found" },
        }),
      );
      mockSupabase.from.mockReturnValue(queryBuilder);

      await expect(repository.delete("test-1")).rejects.toThrow(
        "Failed to delete test_table",
      );
    });
  });

  /* ========================================
     deleteMany Tests
     ======================================== */

  describe("deleteMany", () => {
    it("deletes multiple records and returns count", async () => {
      const queryBuilder = createMockQueryBuilder();
      queryBuilder.select = vi.fn().mockResolvedValue({
        data: [{ id: "1" }, { id: "2" }, { id: "3" }],
        error: null,
      });
      mockSupabase.from.mockReturnValue(queryBuilder);

      const count = await repository.deleteMany({
        status: "expired",
      } as Partial<TestRecord>);

      expect(count).toBe(3);
      expect(queryBuilder.delete).toHaveBeenCalled();
      expect(queryBuilder.eq).toHaveBeenCalledWith("status", "expired");
    });

    it("returns 0 when no records deleted", async () => {
      const queryBuilder = createMockQueryBuilder();
      queryBuilder.select = vi.fn().mockResolvedValue({
        data: [],
        error: null,
      });
      mockSupabase.from.mockReturnValue(queryBuilder);

      const count = await repository.deleteMany({
        status: "nonexistent",
      } as Partial<TestRecord>);

      expect(count).toBe(0);
    });
  });

  /* ========================================
     count Tests
     ======================================== */

  describe("count", () => {
    it("returns count of all records when no criteria", async () => {
      const queryBuilder = createMockQueryBuilder();
      queryBuilder.then = vi.fn((resolve) =>
        resolve({ count: 42, error: null }),
      );
      mockSupabase.from.mockReturnValue(queryBuilder);

      const count = await repository.count();

      expect(count).toBe(42);
      expect(queryBuilder.select).toHaveBeenCalledWith("*", {
        count: "exact",
        head: true,
      });
    });

    it("returns count matching criteria", async () => {
      const queryBuilder = createMockQueryBuilder();
      queryBuilder.then = vi.fn((resolve) =>
        resolve({ count: 10, error: null }),
      );
      mockSupabase.from.mockReturnValue(queryBuilder);

      const count = await repository.count({
        status: "active",
      } as Partial<TestRecord>);

      expect(count).toBe(10);
      expect(queryBuilder.eq).toHaveBeenCalledWith("status", "active");
    });

    it("returns 0 when count is null", async () => {
      const queryBuilder = createMockQueryBuilder();
      queryBuilder.then = vi.fn((resolve) =>
        resolve({ count: null, error: null }),
      );
      mockSupabase.from.mockReturnValue(queryBuilder);

      const count = await repository.count();

      expect(count).toBe(0);
    });

    it("throws DatabaseError on count failure", async () => {
      const queryBuilder = createMockQueryBuilder();
      queryBuilder.then = vi.fn((resolve) =>
        resolve({
          count: null,
          error: { code: "42P01", message: "Table not found" },
        }),
      );
      mockSupabase.from.mockReturnValue(queryBuilder);

      await expect(repository.count()).rejects.toThrow(
        "Failed to count test_table records",
      );
    });
  });
});

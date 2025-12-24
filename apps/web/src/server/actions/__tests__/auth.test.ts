/**
 * Authentication Server Actions Tests
 *
 * Tests for user authentication flow including:
 * - Sign up with email
 * - Sign in with credentials
 * - Sign out
 * - User profile operations
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock Next.js server functions - these throw NEXT_REDIRECT
vi.mock("next/navigation", () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  }),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

// Mock Supabase client creation
const mockAuth = {
  signUp: vi.fn(),
  signInWithPassword: vi.fn(),
  signOut: vi.fn(),
  getUser: vi.fn(),
};

const mockFrom = vi.fn();

vi.mock("@odis-ai/data-access/db/server", () => ({
  createClient: vi.fn(() =>
    Promise.resolve({
      auth: mockAuth,
      from: mockFrom,
    }),
  ),
}));

// Import after mocks
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  signUp,
  signIn,
  signOut,
  getUser,
  getUserProfile,
  updateUserProfile,
} from "../auth";

describe("Authentication Server Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("signUp", () => {
    it("should redirect to /signup on successful sign up", async () => {
      mockAuth.signUp.mockResolvedValue({
        data: { user: { id: "user-123" }, session: null },
        error: null,
      });

      const formData = new FormData();
      formData.append("email", "new@example.com");
      formData.append("password", "password123");

      await expect(signUp(formData)).rejects.toThrow("NEXT_REDIRECT:/signup");
      expect(mockAuth.signUp).toHaveBeenCalledWith({
        email: "new@example.com",
        password: "password123",
        options: {
          emailRedirectTo: expect.stringContaining("/auth/callback"),
        },
      });
      expect(revalidatePath).toHaveBeenCalledWith("/", "layout");
    });

    it("should redirect to /error on sign up failure", async () => {
      mockAuth.signUp.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: "Email already registered" },
      });

      const formData = new FormData();
      formData.append("email", "existing@example.com");
      formData.append("password", "password123");

      await expect(signUp(formData)).rejects.toThrow("NEXT_REDIRECT:/error");
    });
  });

  describe("signIn", () => {
    it("should redirect to /dashboard on successful sign in", async () => {
      mockAuth.signInWithPassword.mockResolvedValue({
        data: { user: { id: "user-123" }, session: {} },
        error: null,
      });

      const formData = new FormData();
      formData.append("email", "user@example.com");
      formData.append("password", "password123");

      await expect(signIn(formData)).rejects.toThrow(
        "NEXT_REDIRECT:/dashboard",
      );
      expect(mockAuth.signInWithPassword).toHaveBeenCalledWith({
        email: "user@example.com",
        password: "password123",
      });
      expect(revalidatePath).toHaveBeenCalledWith("/", "layout");
    });

    it("should redirect to /error on sign in failure", async () => {
      mockAuth.signInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: "Invalid credentials" },
      });

      const formData = new FormData();
      formData.append("email", "user@example.com");
      formData.append("password", "wrongpassword");

      await expect(signIn(formData)).rejects.toThrow("NEXT_REDIRECT:/error");
    });
  });

  describe("signOut", () => {
    it("should sign out and redirect to /", async () => {
      mockAuth.signOut.mockResolvedValue({ error: null });

      await expect(signOut()).rejects.toThrow("NEXT_REDIRECT:/");
      expect(mockAuth.signOut).toHaveBeenCalled();
      expect(revalidatePath).toHaveBeenCalledWith("/", "layout");
    });
  });

  describe("getUser", () => {
    it("should return user when authenticated", async () => {
      const mockUser = { id: "user-123", email: "user@example.com" };
      mockAuth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      // Mock the users table query
      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { id: "user-123" },
              error: null,
            }),
          }),
        }),
      });

      const user = await getUser();
      expect(user).toEqual(mockUser);
    });

    it("should return null when not authenticated", async () => {
      mockAuth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: "Not authenticated" },
      });

      const user = await getUser();
      expect(user).toBeNull();
    });

    it("should create user profile if not exists (PGRST116)", async () => {
      const mockUser = { id: "user-123", email: "new@example.com" };
      mockAuth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      // First query returns not found
      const mockInsert = vi.fn().mockResolvedValue({ error: null });
      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { code: "PGRST116" },
            }),
          }),
        }),
        insert: mockInsert,
      });

      const user = await getUser();
      expect(user).toEqual(mockUser);
      expect(mockFrom).toHaveBeenCalledWith("users");
    });
  });

  describe("getUserProfile", () => {
    it("should fetch user profile by ID", async () => {
      const mockProfile = {
        id: "user-123",
        email: "user@example.com",
        firstName: "John",
      };

      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockProfile,
              error: null,
            }),
          }),
        }),
      });

      const profile = await getUserProfile("user-123");
      expect(profile).toEqual(mockProfile);
    });

    it("should return null for non-existent user", async () => {
      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { message: "Not found" },
            }),
          }),
        }),
      });

      const profile = await getUserProfile("nonexistent");
      expect(profile).toBeNull();
    });
  });

  describe("updateUserProfile", () => {
    it("should update user profile fields", async () => {
      const updatedProfile = {
        id: "user-123",
        firstName: "Jane",
        updated_at: expect.any(String),
      };

      mockFrom.mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: updatedProfile,
                error: null,
              }),
            }),
          }),
        }),
      });

      const profile = await updateUserProfile("user-123", {
        firstName: "Jane",
      });
      expect(profile).toMatchObject({ firstName: "Jane" });
    });

    it("should return null on update error", async () => {
      mockFrom.mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: null,
                error: { message: "Update failed" },
              }),
            }),
          }),
        }),
      });

      const profile = await updateUserProfile("user-123", {
        firstName: "Jane",
      });
      expect(profile).toBeNull();
    });
  });
});

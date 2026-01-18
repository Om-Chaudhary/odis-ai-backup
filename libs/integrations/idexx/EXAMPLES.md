# IDEXX Integration Examples

Practical examples for using the IDEXX integration library.

## Basic Provider Usage

### Simple Sync Example

```typescript
import { IdexxProvider } from "@odis-ai/integrations/idexx/provider";
import { BrowserService } from "@odis-ai/integrations/idexx/browser";

async function syncIdexxAppointments() {
  // Initialize browser service
  const browserService = new BrowserService({
    headless: true,
    defaultTimeout: 30000,
  });

  // Create provider
  const provider = new IdexxProvider({
    browserService,
    baseUrl: "https://us.idexxneo.com",
    debug: true,
  });

  try {
    // Authenticate
    console.log("Authenticating with IDEXX Neo...");
    const authenticated = await provider.authenticate({
      username: process.env.IDEXX_USERNAME!,
      password: process.env.IDEXX_PASSWORD!,
      companyId: process.env.IDEXX_COMPANY_ID!,
    });

    if (!authenticated) {
      throw new Error("Authentication failed");
    }

    console.log("✓ Authenticated successfully");

    // Fetch schedule config
    console.log("Fetching schedule configuration...");
    const scheduleConfig = await provider.fetchScheduleConfig();
    console.log("Schedule:", scheduleConfig);

    // Fetch appointments for next 7 days
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 7);

    console.log("Fetching appointments...");
    const appointments = await provider.fetchAppointments(startDate, endDate);
    console.log(`Found ${appointments.length} appointments`);

    // Fetch consultations for appointments
    for (const appointment of appointments.slice(0, 5)) {
      if (appointment.consultationId) {
        console.log(`Fetching consultation ${appointment.consultationId}...`);
        const consultation = await provider.fetchConsultation(
          appointment.consultationId,
        );
        console.log(
          "Consultation notes:",
          consultation?.notes?.substring(0, 100),
        );
      }
    }

    return { success: true, count: appointments.length };
  } finally {
    // Always cleanup
    await provider.close();
  }
}

// Run
syncIdexxAppointments()
  .then((result) => console.log("Sync complete:", result))
  .catch((error) => console.error("Sync failed:", error));
```

## Express API Integration

### Setup Routes

```typescript
// routes/pims.ts
import { Router } from "express";
import { IdexxProvider } from "@odis-ai/integrations/idexx/provider";
import { BrowserService } from "@odis-ai/integrations/idexx/browser";

const router = Router();

// Create provider factory
function createIdexxProvider() {
  const browserService = new BrowserService({
    headless: process.env.HEADLESS !== "false",
    defaultTimeout: 30000,
  });

  return new IdexxProvider({
    browserService,
    baseUrl: process.env.IDEXX_BASE_URL ?? "https://us.idexxneo.com",
    debug: process.env.NODE_ENV === "development",
  });
}

// Authenticate endpoint
router.post("/idexx/auth", async (req, res) => {
  const provider = createIdexxProvider();

  try {
    const { username, password, companyId } = req.body;

    const authenticated = await provider.authenticate({
      username,
      password,
      companyId,
    });

    if (authenticated) {
      res.json({ success: true, message: "Authenticated successfully" });
    } else {
      res.status(401).json({ success: false, error: "Invalid credentials" });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  } finally {
    await provider.close();
  }
});

// Sync appointments endpoint
router.post("/idexx/sync", async (req, res) => {
  const provider = createIdexxProvider();

  try {
    const { credentials, startDate, endDate } = req.body;

    // Authenticate
    const authenticated = await provider.authenticate(credentials);
    if (!authenticated) {
      return res.status(401).json({ error: "Authentication failed" });
    }

    // Fetch appointments
    const appointments = await provider.fetchAppointments(
      new Date(startDate),
      new Date(endDate),
    );

    // Fetch consultations in parallel
    const consultationIds = appointments
      .map((a) => a.consultationId)
      .filter(Boolean) as string[];

    const consultations = await provider.fetchConsultations(consultationIds);

    res.json({
      success: true,
      stats: {
        appointments: appointments.length,
        consultations: consultations.size,
      },
      data: {
        appointments,
        consultations: Array.from(consultations.values()),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  } finally {
    await provider.close();
  }
});

export default router;
```

### App Setup

```typescript
// index.ts
import express from "express";
import pimsRoutes from "./routes/pims";

const app = express();
app.use(express.json());

app.use("/api/pims", pimsRoutes);

const PORT = process.env.PORT ?? 3001;
app.listen(PORT, () => {
  console.log(`PIMS sync service running on port ${PORT}`);
});
```

## Browser Pool Usage

### Concurrent Scraping

```typescript
import { BrowserPool } from "@odis-ai/integrations/idexx/browser";

async function scrapeMultiplePages() {
  const pool = new BrowserPool({
    maxBrowsers: 3,
    maxContextsPerBrowser: 5,
    headless: true,
  });

  try {
    const urls = [
      "https://example.com/page1",
      "https://example.com/page2",
      "https://example.com/page3",
      // ... more URLs
    ];

    // Scrape in parallel using pool
    const results = await Promise.all(
      urls.map((url) =>
        pool.withPage(async (session) => {
          await session.page.goto(url);
          const title = await session.page.title();
          const content = await session.page.content();
          return { url, title, contentLength: content.length };
        }),
      ),
    );

    console.log("Scraped pages:", results);

    // Check pool stats
    console.log("Pool stats:", pool.getStats());
  } finally {
    await pool.close();
  }
}
```

## Scheduled Sync with QStash

### Background Job

```typescript
import { IdexxProvider } from "@odis-ai/integrations/idexx/provider";
import { BrowserService } from "@odis-ai/integrations/idexx/browser";
import { IdexxCredentialManager } from "@odis-ai/integrations/idexx";

async function scheduledSync(userId: string, clinicId: string) {
  const browserService = new BrowserService({ headless: true });
  const provider = new IdexxProvider({ browserService });
  const credentialManager = await IdexxCredentialManager.create();

  try {
    // Get stored credentials
    const credentials = await credentialManager.getCredentials(
      userId,
      clinicId,
    );
    if (!credentials) {
      throw new Error("No credentials found");
    }

    // Authenticate
    const authenticated = await provider.authenticate(credentials);
    if (!authenticated) {
      throw new Error("Authentication failed");
    }

    // Sync appointments for next 7 days
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 7);

    const appointments = await provider.fetchAppointments(startDate, endDate);

    // Fetch consultations
    const consultationIds = appointments
      .map((a) => a.consultationId)
      .filter(Boolean) as string[];

    const consultations = await provider.fetchConsultations(consultationIds);

    // Store to database (using Supabase client)
    // ... database operations

    console.log("Sync complete:", {
      appointments: appointments.length,
      consultations: consultations.size,
    });

    return {
      success: true,
      stats: {
        appointments: appointments.length,
        consultations: consultations.size,
      },
    };
  } finally {
    await provider.close();
  }
}

// QStash handler
export async function POST(req: Request) {
  const { userId, clinicId } = await req.json();

  try {
    const result = await scheduledSync(userId, clinicId);
    return Response.json(result);
  } catch (error) {
    return Response.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
```

## Error Handling

### Retry Logic

```typescript
import { IdexxProvider } from "@odis-ai/integrations/idexx/provider";
import { BrowserService } from "@odis-ai/integrations/idexx/browser";

async function syncWithRetry(credentials: PimsCredentials, maxRetries = 3) {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const browserService = new BrowserService({ headless: true });
    const provider = new IdexxProvider({ browserService });

    try {
      console.log(`Attempt ${attempt}/${maxRetries}...`);

      // Authenticate
      const authenticated = await provider.authenticate(credentials);
      if (!authenticated) {
        throw new Error("Authentication failed");
      }

      // Fetch data
      const appointments = await provider.fetchAppointments(
        new Date(),
        new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      );

      console.log(`✓ Success on attempt ${attempt}`);
      return { success: true, appointments };
    } catch (error) {
      lastError = error as Error;
      console.error(`✗ Attempt ${attempt} failed:`, error.message);

      // Wait before retry (exponential backoff)
      if (attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 1000;
        console.log(`Waiting ${delay}ms before retry...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    } finally {
      await provider.close();
    }
  }

  throw new Error(`Failed after ${maxRetries} attempts: ${lastError?.message}`);
}
```

## Testing

### Mock Provider

```typescript
import type { IPimsProvider, PimsCredentials } from "@odis-ai/domain/sync";

class MockIdexxProvider implements IPimsProvider {
  readonly name = "IDEXX Neo (Mock)";
  private authenticated = false;

  async authenticate(credentials: PimsCredentials): Promise<boolean> {
    this.authenticated = credentials.username === "test@example.com";
    return this.authenticated;
  }

  isAuthenticated(): boolean {
    return this.authenticated;
  }

  async fetchScheduleConfig() {
    return {
      openTime: "08:00",
      closeTime: "18:00",
      daysOfWeek: [1, 2, 3, 4, 5],
      slotDurationMinutes: 30,
      defaultCapacity: 4,
      timezone: "America/New_York",
    };
  }

  async fetchAppointments() {
    return [
      {
        id: "1",
        consultationId: "C1",
        date: "2025-01-15",
        startTime: new Date("2025-01-15T10:00:00Z"),
        duration: 30,
        status: "scheduled",
        patient: { id: "P1", name: "Max", species: "Dog", breed: "Labrador" },
        client: {
          id: "CL1",
          name: "John Doe",
          phone: "555-1234",
          email: "john@example.com",
        },
        provider: { id: "PR1", name: "Dr. Smith" },
        type: "wellness",
        reason: "Annual checkup",
      },
    ];
  }

  async fetchConsultation() {
    return {
      id: "C1",
      notes: "Patient is healthy",
      productsServices: "Vaccines, Exam",
      declinedProductsServices: null,
      status: "completed",
    };
  }

  async close(): Promise<void> {
    this.authenticated = false;
  }
}

// Use in tests
describe("Sync Service", () => {
  it("should sync appointments", async () => {
    const provider = new MockIdexxProvider();
    // Test sync logic...
  });
});
```

## Production Deployment

### Environment Variables

```bash
# .env.production
IDEXX_BASE_URL=https://us.idexxneo.com
HEADLESS=true
BROWSER_TIMEOUT=30000
MAX_BROWSERS=3
MAX_CONTEXTS_PER_BROWSER=5
```

### Health Check

```typescript
router.get("/health", async (req, res) => {
  const browserService = new BrowserService({ headless: true });

  try {
    await browserService.launch();
    const running = browserService.isRunning();

    res.json({
      status: running ? "healthy" : "degraded",
      browser: {
        running,
        contexts: browserService.getContextCount(),
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(503).json({
      status: "unhealthy",
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  } finally {
    await browserService.close();
  }
});
```

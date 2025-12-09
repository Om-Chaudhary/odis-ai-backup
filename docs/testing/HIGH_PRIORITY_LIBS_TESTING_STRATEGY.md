# High-Priority Libraries Testing Strategy

**Document Version**: 1.0
**Last Updated**: 2025-12-08
**Target Coverage**: 80% (lines/functions/branches/statements)
**Testing Framework**: Vitest + Testing Library

---

## Executive Summary

This document outlines a comprehensive testing strategy for the six highest-priority shared libraries in the ODIS AI Nx monorepo. These libraries form the critical backbone of the veterinary voice call management platform and require robust test coverage to ensure reliability, maintainability, and business continuity.

### Coverage Goals

- **Phase 1 (Weeks 1-2)**: CRITICAL libraries → 60% coverage
- **Phase 2 (Weeks 3-4)**: HIGH libraries → 70% coverage
- **Phase 3 (Weeks 5-6)**: ALL high-priority libs → 80% coverage

### Testing Approach

1. **Unit Tests**: Pure functions, validators, transformers
2. **Integration Tests**: Service orchestrators, repositories, API clients
3. **Contract Tests**: External API mocking (VAPI, Supabase)
4. **Webhook Tests**: Event handling and state transitions

---

## Priority Matrix

| Library | Business Impact | Technical Risk | Current Coverage | Target Coverage | Priority |
|---------|----------------|----------------|------------------|-----------------|----------|
| `@odis/vapi` | CRITICAL | High | 0% | 85% | P0 |
| `@odis/services` | CRITICAL | High | 0% | 80% | P0 |
| `@odis/validators` | HIGH | Medium | 0% | 90% | P1 |
| `@odis/db` | HIGH | Medium | 0% | 75% | P1 |
| `@odis/idexx` | HIGH | Medium | 0% | 80% | P1 |
| `@odis/api` | MEDIUM | Low | 0% | 75% | P2 |

### Risk Assessment Rationale

**CRITICAL (P0)**: Revenue-generating features. Failures directly impact customer calls and business operations.

**HIGH (P1)**: Data integrity gates. Malformed data or validation failures cascade into critical systems.

**MEDIUM (P2)**: Infrastructure utilities. Important but have simpler failure modes.

---

## Library 1: `@odis/vapi` (CRITICAL - P0)

### Overview

The VAPI library handles all voice call integrations including outbound/inbound calls, webhook processing, and dynamic variable management. This is the most critical library as failures directly impact revenue.

### What to Test

#### 1. VAPI Client (`libs/vapi/src/client.ts`)

**Functions to Test**:
- `getVapiClient()` - Client initialization
- `createPhoneCall()` - Outbound call creation
- `getCall()` - Call retrieval
- `listCalls()` - Call listing with filters
- `calculateTotalCost()` - Cost calculation

**Test Categories**:

```typescript
// libs/vapi/src/__tests__/client.test.ts

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getVapiClient,
  createPhoneCall,
  calculateTotalCost
} from '../client';
import { createMockVapiClient } from '@odis/testing';

describe('VAPI Client', () => {
  describe('getVapiClient', () => {
    it('should create client with private API key', () => {
      const client = getVapiClient();
      expect(client).toBeDefined();
    });

    it('should throw if VAPI_PRIVATE_KEY not configured', () => {
      const originalKey = process.env.VAPI_PRIVATE_KEY;
      delete process.env.VAPI_PRIVATE_KEY;

      expect(() => getVapiClient()).toThrow(
        'VAPI_PRIVATE_KEY not configured'
      );

      process.env.VAPI_PRIVATE_KEY = originalKey;
    });
  });

  describe('createPhoneCall', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should create outbound call with correct payload', async () => {
      const mockClient = createMockVapiClient();
      vi.spyOn({ getVapiClient }, 'getVapiClient').mockReturnValue(mockClient);

      const params = {
        phoneNumber: '+15551234567',
        assistantId: 'asst_123',
        phoneNumberId: 'phone_456',
        assistantOverrides: {
          variableValues: {
            pet_name: 'Max',
            owner_name: 'John Smith',
          },
        },
      };

      await createPhoneCall(params);

      expect(mockClient.calls.create).toHaveBeenCalledWith({
        phoneNumberId: 'phone_456',
        customer: { number: '+15551234567' },
        assistantId: 'asst_123',
        assistantOverrides: expect.objectContaining({
          variableValues: {
            pet_name: 'Max',
            owner_name: 'John Smith',
          },
        }),
      });
    });

    it('should handle voicemail detection override', async () => {
      const mockClient = createMockVapiClient();
      vi.spyOn({ getVapiClient }, 'getVapiClient').mockReturnValue(mockClient);

      const params = {
        phoneNumber: '+15551234567',
        assistantId: 'asst_123',
        phoneNumberId: 'phone_456',
        assistantOverrides: {
          voicemailDetection: 'off' as const,
        },
      };

      await createPhoneCall(params);

      expect(mockClient.calls.create).toHaveBeenCalledWith(
        expect.objectContaining({
          assistantOverrides: expect.objectContaining({
            voicemailDetection: 'off',
          }),
        })
      );
    });

    it('should throw and log on API error', async () => {
      const mockClient = createMockVapiClient();
      const error = new Error('VAPI API error');
      mockClient.calls.create.mockRejectedValue(error);

      vi.spyOn({ getVapiClient }, 'getVapiClient').mockReturnValue(mockClient);
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      await expect(createPhoneCall({
        phoneNumber: '+15551234567',
        assistantId: 'asst_123',
        phoneNumberId: 'phone_456',
      })).rejects.toThrow('VAPI API error');

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[VAPI_CLIENT] Failed to create phone call'),
        expect.any(Object)
      );

      consoleSpy.mockRestore();
    });
  });

  describe('calculateTotalCost', () => {
    it('should sum all cost amounts', () => {
      const costs = [
        { amount: 0.05, description: 'per-minute' },
        { amount: 0.02, description: 'AI cost' },
        { amount: 0.01, description: 'transcription' },
      ];

      expect(calculateTotalCost(costs)).toBe(0.08);
    });

    it('should return 0 for empty costs array', () => {
      expect(calculateTotalCost([])).toBe(0);
    });

    it('should return 0 for undefined costs', () => {
      expect(calculateTotalCost(undefined)).toBe(0);
    });
  });
});
```

#### 2. Webhook Handlers (`libs/vapi/src/webhooks/handlers/`)

**Critical Handlers to Test**:
- `handleStatusUpdate` - Call status transitions
- `handleEndOfCallReport` - Final call data processing
- `handleHang` - Unexpected call termination
- `handleToolCalls` - Synchronous tool execution
- `handleAssistantRequest` - Dynamic assistant configuration

**Test Example**:

```typescript
// libs/vapi/src/webhooks/handlers/__tests__/status-update.test.ts

import { describe, it, expect, vi } from 'vitest';
import { handleStatusUpdate } from '../status-update';
import { createMockSupabaseClient, createMockVapiWebhook } from '@odis/testing';

describe('handleStatusUpdate', () => {
  it('should update call status from queued to ringing', async () => {
    const { client: supabase, from } = createMockSupabaseClient();
    const webhook = createMockVapiWebhook('status-update', {
      status: 'ringing',
      call: { id: 'call-123' },
    });

    await handleStatusUpdate(webhook.message, { isInbound: false }, supabase);

    expect(from).toHaveBeenCalledWith('vapi_calls');
    expect(from().update).toHaveBeenCalledWith({
      status: 'ringing',
      updated_at: expect.any(String),
    });
    expect(from().update().eq).toHaveBeenCalledWith('vapi_call_id', 'call-123');
  });

  it('should set started_at timestamp on first in-progress status', async () => {
    const { client: supabase, from } = createMockSupabaseClient();
    const webhook = createMockVapiWebhook('status-update', {
      status: 'in-progress',
      call: {
        id: 'call-123',
        startedAt: '2025-12-08T10:00:00.000Z',
      },
    });

    await handleStatusUpdate(webhook.message, { isInbound: false }, supabase);

    expect(from().update).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'in_progress',
        started_at: '2025-12-08T10:00:00.000Z',
      })
    );
  });

  it('should handle status update for non-existent call gracefully', async () => {
    const { client: supabase, from } = createMockSupabaseClient({
      queryBuilder: {
        error: new Error('Call not found'),
        data: null,
      },
    });

    const webhook = createMockVapiWebhook('status-update', {
      status: 'ringing',
      call: { id: 'non-existent-call' },
    });

    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    await handleStatusUpdate(webhook.message, { isInbound: false }, supabase);

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('Call not found'),
      expect.any(Object)
    );

    consoleSpy.mockRestore();
  });
});
```

#### 3. Webhook Dispatcher (`libs/vapi/src/webhooks/index.ts`)

**Test Categories**:

```typescript
// libs/vapi/src/webhooks/__tests__/index.test.ts

describe('Webhook Dispatcher', () => {
  describe('parseWebhookPayload', () => {
    it('should parse valid JSON payload', () => {
      const payload = JSON.stringify({
        message: { type: 'status-update', call: { id: 'call-123' } },
      });

      const result = parseWebhookPayload(payload);

      expect(result).toBeDefined();
      expect(result?.message.type).toBe('status-update');
    });

    it('should return null for empty payload', () => {
      expect(parseWebhookPayload('')).toBeNull();
    });

    it('should return null for invalid JSON', () => {
      expect(parseWebhookPayload('not-json')).toBeNull();
    });

    it('should return null for missing message field', () => {
      const payload = JSON.stringify({ data: 'test' });
      expect(parseWebhookPayload(payload)).toBeNull();
    });
  });

  describe('handleVapiWebhook', () => {
    it('should route to status-update handler', async () => {
      const payload = {
        message: {
          type: 'status-update' as const,
          status: 'ringing',
          call: { id: 'call-123' },
        },
      };

      const result = await handleVapiWebhook(payload);

      expect(result).toEqual({
        success: true,
        message: 'Status update processed',
      });
    });

    it('should handle tool-calls synchronously', async () => {
      const payload = {
        message: {
          type: 'tool-calls' as const,
          toolCalls: [
            {
              id: 'tc-1',
              type: 'function',
              function: { name: 'test-tool', arguments: '{}' },
            },
          ],
        },
      };

      const result = await handleVapiWebhook(payload);

      expect(result).toHaveProperty('results');
    });

    it('should log warning for unknown message type', async () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const payload = {
        message: { type: 'unknown-type' as never },
      };

      await handleVapiWebhook(payload);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Unhandled message type'),
        expect.any(Object)
      );

      consoleSpy.mockRestore();
    });
  });

  describe('requiresSynchronousResponse', () => {
    it('should return true for tool-calls', () => {
      expect(requiresSynchronousResponse('tool-calls')).toBe(true);
    });

    it('should return true for assistant-request', () => {
      expect(requiresSynchronousResponse('assistant-request')).toBe(true);
    });

    it('should return false for status-update', () => {
      expect(requiresSynchronousResponse('status-update')).toBe(false);
    });

    it('should return false for end-of-call-report', () => {
      expect(requiresSynchronousResponse('end-of-call-report')).toBe(false);
    });
  });
});
```

### Coverage Targets

- **Client functions**: 90% (critical path for all calls)
- **Webhook handlers**: 85% (business logic for call state)
- **Type guards and utilities**: 95% (simple boolean logic)

### Mocking Dependencies

```typescript
// Example mock setup for VAPI tests
import { vi } from 'vitest';

// Mock VAPI SDK
vi.mock('@vapi-ai/server-sdk', () => ({
  VapiClient: vi.fn(() => ({
    calls: {
      create: vi.fn().mockResolvedValue({ id: 'call-123', status: 'queued' }),
      get: vi.fn().mockResolvedValue({ id: 'call-123', status: 'ended' }),
      list: vi.fn().mockResolvedValue([]),
    },
  })),
}));

// Mock Supabase
vi.mock('@odis/db/server', () => ({
  createServiceClient: vi.fn(() => createMockSupabaseClient().client),
}));

// Mock logger
vi.mock('@odis/logger', () => ({
  loggers: {
    webhook: {
      child: vi.fn(() => ({
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
      })),
    },
  },
}));
```

### Estimated Effort

- Client tests: 8 hours
- Webhook handler tests: 16 hours
- Integration tests: 12 hours
- **Total**: ~36 hours (~4.5 days)

---

## Library 2: `@odis/services` (CRITICAL - P0)

### Overview

Business service orchestrators that coordinate multi-step workflows like discharge processing. Critical for ensuring correct execution order and error handling.

### What to Test

#### 1. Discharge Orchestrator (`libs/services/src/discharge-orchestrator.ts`)

**Key Methods**:
- `orchestrate()` - Main entry point
- `executeSequential()` - Sequential step execution
- `executeParallel()` - Parallel step execution
- Step handlers: `executeIngestion()`, `executeSummaryGeneration()`, etc.

**Test Categories**:

```typescript
// libs/services/src/__tests__/discharge-orchestrator.test.ts

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DischargeOrchestrator } from '../discharge-orchestrator';
import { createMockSupabaseClient, createMockUser } from '@odis/testing';

describe('DischargeOrchestrator', () => {
  let orchestrator: DischargeOrchestrator;
  let mockSupabase: ReturnType<typeof createMockSupabaseClient>;
  let mockUser: ReturnType<typeof createMockUser>;

  beforeEach(() => {
    mockSupabase = createMockSupabaseClient();
    mockUser = createMockUser({ id: 'user-123', email: 'test@example.com' });
    orchestrator = new DischargeOrchestrator(
      mockSupabase.client as never,
      mockUser
    );
  });

  describe('orchestrate - Sequential Mode', () => {
    it('should execute steps in order when parallel=false', async () => {
      const executionOrder: string[] = [];

      vi.spyOn(orchestrator as never, 'executeIngestion')
        .mockImplementation(async () => {
          executionOrder.push('ingest');
          return { step: 'ingest', status: 'completed', duration: 100 };
        });

      vi.spyOn(orchestrator as never, 'executeSummaryGeneration')
        .mockImplementation(async () => {
          executionOrder.push('summary');
          return { step: 'generateSummary', status: 'completed', duration: 200 };
        });

      const request = {
        input: {
          rawData: {
            mode: 'text' as const,
            source: 'test',
            text: 'Test data',
          },
        },
        steps: {
          ingest: { enabled: true },
          generateSummary: { enabled: true, dependencies: ['ingest'] },
        },
        options: { parallel: false },
      };

      const result = await orchestrator.orchestrate(request);

      expect(result.success).toBe(true);
      expect(executionOrder).toEqual(['ingest', 'summary']);
    });

    it('should skip dependent steps when dependency fails', async () => {
      vi.spyOn(orchestrator as never, 'executeIngestion')
        .mockResolvedValue({
          step: 'ingest',
          status: 'failed',
          duration: 100,
          error: 'Ingestion failed',
        });

      const request = {
        input: {
          rawData: {
            mode: 'text' as const,
            source: 'test',
            text: 'Test data',
          },
        },
        steps: {
          ingest: { enabled: true },
          generateSummary: { enabled: true, dependencies: ['ingest'] },
        },
        options: { parallel: false, stopOnError: false },
      };

      const result = await orchestrator.orchestrate(request);

      expect(result.success).toBe(false);
      expect(result.data.failedSteps).toContain('ingest');
      expect(result.data.skippedSteps).toContain('generateSummary');
    });

    it('should stop execution when stopOnError=true', async () => {
      const executionOrder: string[] = [];

      vi.spyOn(orchestrator as never, 'executeIngestion')
        .mockImplementation(async () => {
          executionOrder.push('ingest');
          return { step: 'ingest', status: 'failed', duration: 100, error: 'Error' };
        });

      vi.spyOn(orchestrator as never, 'executeSummaryGeneration')
        .mockImplementation(async () => {
          executionOrder.push('summary');
          return { step: 'generateSummary', status: 'completed', duration: 200 };
        });

      const request = {
        input: {
          rawData: {
            mode: 'text' as const,
            source: 'test',
            text: 'Test data',
          },
        },
        steps: {
          ingest: { enabled: true },
          generateSummary: { enabled: true, dependencies: ['ingest'] },
        },
        options: { parallel: false, stopOnError: true },
      };

      await orchestrator.orchestrate(request);

      // Summary should not execute because stopOnError=true
      expect(executionOrder).toEqual(['ingest']);
    });
  });

  describe('orchestrate - Parallel Mode', () => {
    it('should execute independent steps in parallel', async () => {
      const startTimes = new Map<string, number>();
      const endTimes = new Map<string, number>();

      vi.spyOn(orchestrator as never, 'executeIngestion')
        .mockImplementation(async () => {
          startTimes.set('ingest', Date.now());
          await new Promise(resolve => setTimeout(resolve, 50));
          endTimes.set('ingest', Date.now());
          return { step: 'ingest', status: 'completed', duration: 50 };
        });

      vi.spyOn(orchestrator as never, 'executeEntityExtraction')
        .mockImplementation(async () => {
          startTimes.set('extract', Date.now());
          await new Promise(resolve => setTimeout(resolve, 50));
          endTimes.set('extract', Date.now());
          return { step: 'extractEntities', status: 'completed', duration: 50 };
        });

      const request = {
        input: {
          rawData: {
            mode: 'text' as const,
            source: 'test',
            text: 'Test data',
          },
        },
        steps: {
          ingest: { enabled: true },
          extractEntities: { enabled: true }, // No dependencies
        },
        options: { parallel: true },
      };

      const result = await orchestrator.orchestrate(request);

      expect(result.success).toBe(true);

      // Verify parallel execution (both started before either finished)
      const ingestStart = startTimes.get('ingest')!;
      const extractStart = startTimes.get('extract')!;
      const ingestEnd = endTimes.get('ingest')!;

      expect(extractStart).toBeLessThan(ingestEnd);
    });

    it('should handle batch failures in parallel mode', async () => {
      vi.spyOn(orchestrator as never, 'executeIngestion')
        .mockResolvedValue({
          step: 'ingest',
          status: 'failed',
          duration: 100,
          error: 'Ingestion failed',
        });

      const request = {
        input: {
          rawData: {
            mode: 'text' as const,
            source: 'test',
            text: 'Test data',
          },
        },
        steps: {
          ingest: { enabled: true },
          generateSummary: { enabled: true, dependencies: ['ingest'] },
        },
        options: { parallel: true, stopOnError: true },
      };

      const result = await orchestrator.orchestrate(request);

      expect(result.success).toBe(false);
      expect(result.data.failedSteps).toContain('ingest');
      expect(result.data.skippedSteps).toContain('generateSummary');
    });
  });

  describe('Step Handlers', () => {
    describe('executeIngestion', () => {
      it('should handle existing case input', async () => {
        const request = {
          input: {
            existingCase: {
              caseId: 'case-123',
            },
          },
          steps: {
            ingest: { enabled: false }, // Not explicitly enabled
          },
        };

        const result = await orchestrator.orchestrate(request);

        // Should mark ingest as completed (not skipped) for existing case
        expect(result.data.completedSteps).toContain('ingest');
      });

      it('should skip when not enabled and no existing case', async () => {
        const request = {
          input: {
            rawData: {
              mode: 'text' as const,
              source: 'test',
              text: 'Test data',
            },
          },
          steps: {
            ingest: { enabled: false },
          },
        };

        const result = await orchestrator.orchestrate(request);

        expect(result.data.skippedSteps).toContain('ingest');
      });
    });

    describe('executeSummaryGeneration', () => {
      it('should use freshly extracted entities when available', async () => {
        // Mock entity extraction result
        const extractResult = {
          step: 'extractEntities',
          status: 'completed',
          duration: 100,
          data: {
            caseId: 'case-123',
            entities: {
              patient: { name: 'Max', species: 'dog' },
              clinical: { diagnosis: 'ear infection' },
            },
            source: 'transcription',
          },
        };

        // Set up orchestrator with extract result
        orchestrator['results'].set('extractEntities', extractResult);

        // Mock summary generation
        const generateSpy = vi.spyOn(
          await import('@odis/ai/generate-structured-discharge'),
          'generateStructuredDischargeSummaryWithRetry'
        ).mockResolvedValue({
          structured: { diagnosis: 'ear infection' },
          plainText: 'Summary text',
        });

        const request = {
          input: {
            existingCase: { caseId: 'case-123' },
          },
          steps: {
            generateSummary: { enabled: true },
          },
        };

        await orchestrator.orchestrate(request);

        expect(generateSpy).toHaveBeenCalledWith(
          expect.objectContaining({
            entityExtraction: expect.objectContaining({
              patient: { name: 'Max', species: 'dog' },
            }),
          })
        );
      });

      it('should throw if case not found', async () => {
        mockSupabase.from.mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: null,
                error: new Error('Case not found'),
              }),
            }),
          }),
        });

        const request = {
          input: {
            existingCase: { caseId: 'non-existent' },
          },
          steps: {
            generateSummary: { enabled: true },
          },
        };

        const result = await orchestrator.orchestrate(request);

        expect(result.success).toBe(false);
        expect(result.metadata.errors).toContainEqual(
          expect.objectContaining({
            error: expect.stringContaining('Case not found'),
          })
        );
      });
    });

    describe('executeEmailScheduling', () => {
      it('should validate recipient email format', async () => {
        const request = {
          input: {
            existingCase: { caseId: 'case-123' },
          },
          steps: {
            prepareEmail: { enabled: true },
            scheduleEmail: {
              enabled: true,
              dependencies: ['prepareEmail'],
              options: {
                recipientEmail: 'invalid-email',
              },
            },
          },
        };

        const result = await orchestrator.orchestrate(request);

        expect(result.success).toBe(false);
        expect(result.metadata.errors).toContainEqual(
          expect.objectContaining({
            error: expect.stringContaining('Invalid email address'),
          })
        );
      });

      it('should use test contact when test mode enabled', async () => {
        mockSupabase.from.mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: {
                  test_mode_enabled: true,
                  test_contact_email: 'test@clinic.com',
                  test_contact_name: 'Test User',
                },
                error: null,
              }),
            }),
          }),
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { id: 'email-123' },
                error: null,
              }),
            }),
          }),
        });

        const request = {
          input: {
            existingCase: {
              caseId: 'case-123',
              emailContent: {
                subject: 'Test',
                html: '<p>Test</p>',
                text: 'Test',
              },
            },
          },
          steps: {
            scheduleEmail: {
              enabled: true,
              options: {
                recipientEmail: 'owner@example.com',
              },
            },
          },
        };

        const result = await orchestrator.orchestrate(request);

        expect(result.success).toBe(true);
        expect(mockSupabase.from).toHaveBeenCalledWith('scheduled_discharge_emails');
        expect(mockSupabase.from().insert).toHaveBeenCalledWith(
          expect.objectContaining({
            recipient_email: 'test@clinic.com',
            metadata: expect.objectContaining({
              test_mode: true,
              original_recipient_email: 'owner@example.com',
            }),
          })
        );
      });

      it('should rollback database insert if QStash fails', async () => {
        // Mock QStash failure
        vi.spyOn(
          await import('@odis/qstash/client'),
          'scheduleEmailExecution'
        ).mockRejectedValue(new Error('QStash error'));

        mockSupabase.from.mockReturnValue({
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { id: 'email-123' },
                error: null,
              }),
            }),
          }),
          delete: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null }),
          }),
        });

        const request = {
          input: {
            existingCase: {
              caseId: 'case-123',
              emailContent: {
                subject: 'Test',
                html: '<p>Test</p>',
                text: 'Test',
              },
            },
          },
          steps: {
            scheduleEmail: {
              enabled: true,
              options: {
                recipientEmail: 'owner@example.com',
              },
            },
          },
        };

        const result = await orchestrator.orchestrate(request);

        expect(result.success).toBe(false);
        expect(mockSupabase.from().delete).toHaveBeenCalled();
        expect(mockSupabase.from().delete().eq).toHaveBeenCalledWith(
          'id',
          'email-123'
        );
      });
    });
  });

  describe('buildResult', () => {
    it('should calculate correct timing metrics', async () => {
      const request = {
        input: {
          rawData: {
            mode: 'text' as const,
            source: 'test',
            text: 'Test data',
          },
        },
        steps: {
          ingest: { enabled: true },
        },
      };

      const startTime = Date.now();
      await new Promise(resolve => setTimeout(resolve, 100));
      const result = await orchestrator.orchestrate(request);

      expect(result.metadata.totalProcessingTime).toBeGreaterThanOrEqual(100);
      expect(result.metadata.stepTimings).toBeDefined();
      expect(result.metadata.stepTimings.ingest).toBeGreaterThan(0);
    });

    it('should aggregate errors from failed steps', async () => {
      vi.spyOn(orchestrator as never, 'executeIngestion')
        .mockResolvedValue({
          step: 'ingest',
          status: 'failed',
          duration: 100,
          error: 'Database error',
        });

      const request = {
        input: {
          rawData: {
            mode: 'text' as const,
            source: 'test',
            text: 'Test data',
          },
        },
        steps: {
          ingest: { enabled: true },
        },
      };

      const result = await orchestrator.orchestrate(request);

      expect(result.success).toBe(false);
      expect(result.metadata.errors).toContainEqual({
        step: 'ingest',
        error: 'Database error',
      });
    });
  });
});
```

#### 2. Cases Service (`libs/services/src/cases-service.ts`)

**Key Methods**:
- `ingest()` - Data ingestion
- `scheduleDischargeCall()` - Call scheduling
- `getCaseWithEntities()` - Case retrieval with relations
- `enrichEntitiesWithPatient()` - Entity enrichment

**Test Categories**:

```typescript
// libs/services/src/__tests__/cases-service.test.ts

describe('CasesService', () => {
  describe('ingest', () => {
    it('should create case with text mode', async () => {
      const { client: supabase } = createMockSupabaseClient();

      const payload = {
        mode: 'text' as const,
        source: 'test',
        text: 'Patient visit notes',
      };

      await CasesService.ingest(supabase, 'user-123', payload);

      expect(supabase.from).toHaveBeenCalledWith('cases');
      expect(supabase.from().insert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 'user-123',
          source: 'test',
          type: 'scribe',
        })
      );
    });

    it('should create case with structured mode', async () => {
      const { client: supabase } = createMockSupabaseClient();

      const payload = {
        mode: 'structured' as const,
        source: 'idexx',
        data: {
          patient: { name: 'Max', species: 'dog' },
          visit: { date: '2025-12-08' },
        },
      };

      await CasesService.ingest(supabase, 'user-123', payload);

      expect(supabase.from().insert).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: expect.objectContaining({
            idexx: expect.any(Object),
          }),
        })
      );
    });
  });

  describe('scheduleDischargeCall', () => {
    it('should schedule call with default delay', async () => {
      const { client: supabase } = createMockSupabaseClient();

      // Mock QStash
      const qstashSpy = vi.spyOn(
        await import('@odis/qstash/client'),
        'scheduleCallExecution'
      ).mockResolvedValue('qstash-msg-123');

      await CasesService.scheduleDischargeCall(
        supabase,
        'user-123',
        'case-123',
        {
          clinicName: 'Test Clinic',
          clinicPhone: '+15551234567',
          emergencyPhone: '+15559876543',
          agentName: 'Sarah',
        }
      );

      expect(qstashSpy).toHaveBeenCalled();
      const scheduledFor = qstashSpy.mock.calls[0][1];

      // Should be scheduled ~5 minutes in future (default)
      const delayMs = new Date(scheduledFor).getTime() - Date.now();
      expect(delayMs).toBeGreaterThan(4 * 60 * 1000); // > 4 min
      expect(delayMs).toBeLessThan(6 * 60 * 1000); // < 6 min
    });

    it('should use custom schedule delay from user settings', async () => {
      const { client: supabase } = createMockSupabaseClient();

      // Mock user settings
      supabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { default_schedule_delay_minutes: 10 },
              error: null,
            }),
          }),
        }),
      });

      const qstashSpy = vi.spyOn(
        await import('@odis/qstash/client'),
        'scheduleCallExecution'
      ).mockResolvedValue('qstash-msg-123');

      await CasesService.scheduleDischargeCall(
        supabase,
        'user-123',
        'case-123',
        {
          clinicName: 'Test Clinic',
          clinicPhone: '+15551234567',
          emergencyPhone: '+15559876543',
          agentName: 'Sarah',
        }
      );

      const scheduledFor = qstashSpy.mock.calls[0][1];
      const delayMs = new Date(scheduledFor).getTime() - Date.now();

      // Should use 10-minute delay
      expect(delayMs).toBeGreaterThan(9 * 60 * 1000);
      expect(delayMs).toBeLessThan(11 * 60 * 1000);
    });

    it('should rollback vapi_calls insert if QStash fails', async () => {
      const { client: supabase } = createMockSupabaseClient();

      vi.spyOn(
        await import('@odis/qstash/client'),
        'scheduleCallExecution'
      ).mockRejectedValue(new Error('QStash error'));

      await expect(
        CasesService.scheduleDischargeCall(
          supabase,
          'user-123',
          'case-123',
          {
            clinicName: 'Test Clinic',
            clinicPhone: '+15551234567',
            emergencyPhone: '+15559876543',
            agentName: 'Sarah',
          }
        )
      ).rejects.toThrow('QStash error');

      expect(supabase.from().delete).toHaveBeenCalled();
    });
  });

  describe('enrichEntitiesWithPatient', () => {
    it('should enrich patient name from database', () => {
      const entities = {
        patient: { name: 'unknown', species: 'dog' },
        clinical: {},
      };

      const patientData = {
        id: 'pat-123',
        name: 'Max',
        species: 'dog',
        breed: 'Golden Retriever',
      };

      CasesService.enrichEntitiesWithPatient(entities, patientData);

      expect(entities.patient.name).toBe('Max');
    });

    it('should not overwrite valid extracted name', () => {
      const entities = {
        patient: { name: 'Buddy', species: 'dog' },
        clinical: {},
      };

      const patientData = {
        id: 'pat-123',
        name: 'Max',
        species: 'dog',
      };

      CasesService.enrichEntitiesWithPatient(entities, patientData);

      expect(entities.patient.name).toBe('Buddy');
    });
  });
});
```

### Coverage Targets

- **Orchestrator**: 80% (complex branching logic)
- **Cases Service**: 85% (critical data operations)
- **Execution Plan**: 95% (dependency tracking logic)

### Estimated Effort

- Orchestrator tests: 20 hours
- Cases Service tests: 12 hours
- Integration tests: 8 hours
- **Total**: ~40 hours (~5 days)

---

## Library 3: `@odis/validators` (HIGH - P1)

### Overview

Zod validation schemas used across the entire application. High coverage is critical to prevent malformed data from entering the system.

### What to Test

#### 1. Orchestration Schemas (`libs/validators/src/orchestration.ts`)

```typescript
// libs/validators/src/__tests__/orchestration.test.ts

import { describe, it, expect } from 'vitest';
import {
  OrchestrationRequestSchema,
  StepConfigSchema,
  ExistingCaseInputSchema,
} from '../orchestration';

describe('Orchestration Validators', () => {
  describe('OrchestrationRequestSchema', () => {
    it('should validate request with raw data input', () => {
      const request = {
        input: {
          rawData: {
            mode: 'text',
            source: 'test',
            text: 'Test data',
          },
        },
        steps: {
          ingest: { enabled: true },
        },
      };

      const result = OrchestrationRequestSchema.safeParse(request);

      expect(result.success).toBe(true);
    });

    it('should validate request with existing case input', () => {
      const request = {
        input: {
          existingCase: {
            caseId: 'case-123',
          },
        },
        steps: {
          generateSummary: { enabled: true },
        },
      };

      const result = OrchestrationRequestSchema.safeParse(request);

      expect(result.success).toBe(true);
    });

    it('should reject request with both input types', () => {
      const request = {
        input: {
          rawData: { mode: 'text', source: 'test', text: 'Test' },
          existingCase: { caseId: 'case-123' },
        },
        steps: {},
      };

      const result = OrchestrationRequestSchema.safeParse(request);

      expect(result.success).toBe(false);
    });

    it('should validate parallel and stopOnError options', () => {
      const request = {
        input: {
          rawData: { mode: 'text', source: 'test', text: 'Test' },
        },
        steps: {
          ingest: { enabled: true },
        },
        options: {
          parallel: false,
          stopOnError: true,
        },
      };

      const result = OrchestrationRequestSchema.safeParse(request);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.options?.parallel).toBe(false);
        expect(result.data.options?.stopOnError).toBe(true);
      }
    });
  });

  describe('StepConfigSchema', () => {
    it('should validate enabled step without dependencies', () => {
      const config = {
        enabled: true,
      };

      const result = StepConfigSchema.safeParse(config);

      expect(result.success).toBe(true);
    });

    it('should validate step with dependencies', () => {
      const config = {
        enabled: true,
        dependencies: ['ingest', 'extractEntities'],
      };

      const result = StepConfigSchema.safeParse(config);

      expect(result.success).toBe(true);
    });

    it('should validate step with options', () => {
      const config = {
        enabled: true,
        options: {
          recipientEmail: 'test@example.com',
          scheduledFor: new Date(),
        },
      };

      const result = StepConfigSchema.safeParse(config);

      expect(result.success).toBe(true);
    });

    it('should default enabled to false when omitted', () => {
      const config = {};

      const result = StepConfigSchema.safeParse(config);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.enabled).toBe(false);
      }
    });
  });

  describe('ExistingCaseInputSchema', () => {
    it('should validate with only caseId', () => {
      const input = {
        caseId: 'case-123',
      };

      const result = ExistingCaseInputSchema.safeParse(input);

      expect(result.success).toBe(true);
    });

    it('should validate with email content', () => {
      const input = {
        caseId: 'case-123',
        emailContent: {
          subject: 'Test Subject',
          html: '<p>Test HTML</p>',
          text: 'Test text',
        },
      };

      const result = ExistingCaseInputSchema.safeParse(input);

      expect(result.success).toBe(true);
    });

    it('should reject email content with missing fields', () => {
      const input = {
        caseId: 'case-123',
        emailContent: {
          subject: 'Test',
          // Missing html and text
        },
      };

      const result = ExistingCaseInputSchema.safeParse(input);

      expect(result.success).toBe(false);
    });
  });
});
```

#### 2. Discharge Schemas (`libs/validators/src/discharge.ts` & `discharge-summary.ts`)

```typescript
// libs/validators/src/__tests__/discharge.test.ts

describe('Discharge Validators', () => {
  describe('DischargeSummarySchema', () => {
    it('should validate complete discharge summary', () => {
      const summary = {
        diagnosis: 'Ear infection',
        treatment: 'Antibiotic ear drops',
        medications: [
          {
            name: 'Otomax',
            dosage: '5 drops',
            frequency: 'Twice daily',
            duration: '7 days',
          },
        ],
        followUp: 'Return in 7 days for recheck',
        warningSignscope: ['Head shaking', 'Increased discharge'],
      };

      const result = DischargeSummarySchema.safeParse(summary);

      expect(result.success).toBe(true);
    });

    it('should allow optional fields to be omitted', () => {
      const summary = {
        diagnosis: 'Routine checkup',
        treatment: 'None required',
      };

      const result = DischargeSummarySchema.safeParse(summary);

      expect(result.success).toBe(true);
    });

    it('should reject empty medication arrays', () => {
      const summary = {
        diagnosis: 'Test',
        treatment: 'Test',
        medications: [],
      };

      const result = DischargeSummarySchema.safeParse(summary);

      expect(result.success).toBe(false);
    });
  });

  describe('StructuredDischargeSummarySchema', () => {
    it('should validate structured content with all sections', () => {
      const structured = {
        diagnosis: 'Ear infection (otitis externa)',
        treatmentPerformed: 'Ear cleaning and medication',
        medications: [
          {
            name: 'Otomax',
            dosage: '5 drops each ear',
            frequency: 'Twice daily',
            duration: '7 days',
            instructions: 'Apply after cleaning ear',
          },
        ],
        homeCarescope: [
          'Keep ears dry',
          'Avoid swimming',
        ],
        followUp: {
          when: '7 days',
          reason: 'Recheck ear condition',
        },
        warningSignscope: [
          'Increased discharge',
          'Head shaking',
          'Loss of balance',
        ],
      };

      const result = StructuredDischargeSummarySchema.safeParse(structured);

      expect(result.success).toBe(true);
    });

    it('should validate minimal structured content', () => {
      const structured = {
        diagnosis: 'Routine checkup',
        treatmentPerformed: 'Physical examination',
      };

      const result = StructuredDischargeSummarySchema.safeParse(structured);

      expect(result.success).toBe(true);
    });
  });
});
```

#### 3. Scribe Schemas (`libs/validators/src/scribe.ts`)

```typescript
// libs/validators/src/__tests__/scribe.test.ts

describe('Scribe Validators', () => {
  describe('NormalizedEntitiesSchema', () => {
    it('should validate complete entity extraction', () => {
      const entities = {
        patient: {
          name: 'Max',
          species: 'dog',
          breed: 'Golden Retriever',
          age: '5 years',
          weight: '30kg',
          owner: {
            name: 'John Smith',
            phone: '+15551234567',
          },
        },
        clinical: {
          chiefComplaint: 'Ear infection',
          diagnosis: 'Otitis externa',
          treatment: 'Antibiotic ear drops',
          medications: ['Otomax'],
        },
        confidence: {
          overall: 0.95,
          patient: 0.98,
          clinical: 0.92,
        },
      };

      const result = NormalizedEntitiesSchema.safeParse(entities);

      expect(result.success).toBe(true);
    });

    it('should allow unknown values for missing data', () => {
      const entities = {
        patient: {
          name: 'unknown',
          species: 'unknown',
          owner: {
            name: 'unknown',
          },
        },
        clinical: {},
      };

      const result = NormalizedEntitiesSchema.safeParse(entities);

      expect(result.success).toBe(true);
    });

    it('should validate confidence scores in range', () => {
      const entities = {
        patient: {
          name: 'Max',
          species: 'dog',
          owner: { name: 'John' },
        },
        clinical: {},
        confidence: {
          overall: 1.5, // Invalid: > 1.0
          patient: 0.9,
          clinical: 0.8,
        },
      };

      const result = NormalizedEntitiesSchema.safeParse(entities);

      expect(result.success).toBe(false);
    });
  });
});
```

#### 4. Assessment Questions Schema (`libs/validators/src/assessment-questions.ts`)

```typescript
// libs/validators/src/__tests__/assessment-questions.test.ts

describe('Assessment Questions Validators', () => {
  describe('AssessmentQuestionSchema', () => {
    it('should validate yes/no question', () => {
      const question = {
        id: 'q1',
        question: 'Is your pet eating normally?',
        type: 'yes-no',
        required: true,
      };

      const result = AssessmentQuestionSchema.safeParse(question);

      expect(result.success).toBe(true);
    });

    it('should validate scale question', () => {
      const question = {
        id: 'q2',
        question: 'Rate pain level',
        type: 'scale',
        required: true,
        scaleMin: 0,
        scaleMax: 10,
      };

      const result = AssessmentQuestionSchema.safeParse(question);

      expect(result.success).toBe(true);
    });

    it('should validate multiple-choice question', () => {
      const question = {
        id: 'q3',
        question: 'Which symptoms is your pet experiencing?',
        type: 'multiple-choice',
        required: false,
        options: ['Vomiting', 'Diarrhea', 'Loss of appetite'],
      };

      const result = AssessmentQuestionSchema.safeParse(question);

      expect(result.success).toBe(true);
    });

    it('should reject scale question without min/max', () => {
      const question = {
        id: 'q4',
        question: 'Rate severity',
        type: 'scale',
        required: true,
        // Missing scaleMin and scaleMax
      };

      const result = AssessmentQuestionSchema.safeParse(question);

      expect(result.success).toBe(false);
    });
  });

  describe('AssessmentQuestionsArraySchema', () => {
    it('should validate array of questions', () => {
      const questions = [
        {
          id: 'q1',
          question: 'Is your pet eating?',
          type: 'yes-no',
          required: true,
        },
        {
          id: 'q2',
          question: 'Rate energy level',
          type: 'scale',
          required: true,
          scaleMin: 1,
          scaleMax: 5,
        },
      ];

      const result = AssessmentQuestionsArraySchema.safeParse(questions);

      expect(result.success).toBe(true);
    });

    it('should reject empty array', () => {
      const result = AssessmentQuestionsArraySchema.safeParse([]);

      expect(result.success).toBe(false);
    });

    it('should reject duplicate question IDs', () => {
      const questions = [
        { id: 'q1', question: 'Test 1', type: 'yes-no', required: true },
        { id: 'q1', question: 'Test 2', type: 'yes-no', required: true },
      ];

      const result = AssessmentQuestionsArraySchema.safeParse(questions);

      expect(result.success).toBe(false);
    });
  });
});
```

### Coverage Targets

- **All schemas**: 95% (critical data gates)
- **Edge cases**: 100% (validation logic is deterministic)

### Estimated Effort

- Orchestration schema tests: 4 hours
- Discharge schema tests: 4 hours
- Scribe schema tests: 4 hours
- Assessment schema tests: 3 hours
- **Total**: ~15 hours (~2 days)

---

## Library 4: `@odis/db` (HIGH - P1)

### Overview

Database client wrappers and repository pattern for Supabase operations. Critical for data consistency and RLS enforcement.

### What to Test

#### 1. Repository Base Class (`libs/db/src/repositories/base.ts`)

```typescript
// libs/db/src/repositories/__tests__/base.test.ts

import { describe, it, expect, beforeEach } from 'vitest';
import { BaseRepository } from '../base';
import { createMockSupabaseClient } from '@odis/testing';

class TestRepository extends BaseRepository {
  constructor(supabase: any) {
    super(supabase, 'test_table');
  }
}

describe('BaseRepository', () => {
  let repo: TestRepository;
  let mockSupabase: ReturnType<typeof createMockSupabaseClient>;

  beforeEach(() => {
    mockSupabase = createMockSupabaseClient();
    repo = new TestRepository(mockSupabase.client);
  });

  describe('findById', () => {
    it('should query by primary key', async () => {
      await repo.findById('test-id');

      expect(mockSupabase.from).toHaveBeenCalledWith('test_table');
      expect(mockSupabase.from().select).toHaveBeenCalledWith('*');
      expect(mockSupabase.from().select().eq).toHaveBeenCalledWith('id', 'test-id');
      expect(mockSupabase.from().select().eq().single).toHaveBeenCalled();
    });

    it('should return null when not found', async () => {
      const queryBuilder = createMockQueryBuilder({
        data: null,
        error: new Error('Not found'),
      });
      mockSupabase.from.mockReturnValue(queryBuilder);

      const result = await repo.findById('non-existent');

      expect(result).toBeNull();
    });

    it('should return record when found', async () => {
      const testRecord = { id: 'test-id', name: 'Test' };
      const queryBuilder = createMockQueryBuilder({
        data: testRecord,
        error: null,
      });
      mockSupabase.from.mockReturnValue(queryBuilder);

      const result = await repo.findById('test-id');

      expect(result).toEqual(testRecord);
    });
  });

  describe('findMany', () => {
    it('should apply filters correctly', async () => {
      await repo.findMany({
        where: { status: 'active', type: 'premium' },
        limit: 10,
        orderBy: 'created_at',
        ascending: false,
      });

      expect(mockSupabase.from).toHaveBeenCalledWith('test_table');
      expect(mockSupabase.from().select).toHaveBeenCalled();
      expect(mockSupabase.from().select().eq).toHaveBeenCalledWith('status', 'active');
      expect(mockSupabase.from().select().eq).toHaveBeenCalledWith('type', 'premium');
      expect(mockSupabase.from().select().limit).toHaveBeenCalledWith(10);
      expect(mockSupabase.from().select().order).toHaveBeenCalledWith('created_at', {
        ascending: false,
      });
    });

    it('should return empty array when no results', async () => {
      const queryBuilder = createMockQueryBuilder({
        data: [],
        error: null,
      });
      mockSupabase.from.mockReturnValue(queryBuilder);

      const result = await repo.findMany();

      expect(result).toEqual([]);
    });
  });

  describe('create', () => {
    it('should insert new record', async () => {
      const newRecord = { name: 'New Record', type: 'test' };

      await repo.create(newRecord);

      expect(mockSupabase.from).toHaveBeenCalledWith('test_table');
      expect(mockSupabase.from().insert).toHaveBeenCalledWith(newRecord);
      expect(mockSupabase.from().insert().select).toHaveBeenCalled();
      expect(mockSupabase.from().insert().select().single).toHaveBeenCalled();
    });

    it('should throw on insert error', async () => {
      const queryBuilder = createMockQueryBuilder({
        data: null,
        error: new Error('Insert failed'),
      });
      mockSupabase.from.mockReturnValue(queryBuilder);

      await expect(repo.create({ name: 'Test' })).rejects.toThrow('Insert failed');
    });
  });

  describe('update', () => {
    it('should update record by id', async () => {
      const updates = { name: 'Updated Name' };

      await repo.update('test-id', updates);

      expect(mockSupabase.from).toHaveBeenCalledWith('test_table');
      expect(mockSupabase.from().update).toHaveBeenCalledWith(updates);
      expect(mockSupabase.from().update().eq).toHaveBeenCalledWith('id', 'test-id');
      expect(mockSupabase.from().update().eq().select).toHaveBeenCalled();
      expect(mockSupabase.from().update().eq().select().single).toHaveBeenCalled();
    });

    it('should return null when record not found', async () => {
      const queryBuilder = createMockQueryBuilder({
        data: null,
        error: new Error('Not found'),
      });
      mockSupabase.from.mockReturnValue(queryBuilder);

      const result = await repo.update('non-existent', { name: 'Test' });

      expect(result).toBeNull();
    });
  });

  describe('delete', () => {
    it('should delete record by id', async () => {
      await repo.delete('test-id');

      expect(mockSupabase.from).toHaveBeenCalledWith('test_table');
      expect(mockSupabase.from().delete).toHaveBeenCalled();
      expect(mockSupabase.from().delete().eq).toHaveBeenCalledWith('id', 'test-id');
    });

    it('should return true on successful delete', async () => {
      const queryBuilder = createMockQueryBuilder({
        data: null,
        error: null,
      });
      mockSupabase.from.mockReturnValue(queryBuilder);

      const result = await repo.delete('test-id');

      expect(result).toBe(true);
    });

    it('should return false on delete error', async () => {
      const queryBuilder = createMockQueryBuilder({
        data: null,
        error: new Error('Delete failed'),
      });
      mockSupabase.from.mockReturnValue(queryBuilder);

      const result = await repo.delete('test-id');

      expect(result).toBe(false);
    });
  });
});
```

#### 2. Call Repository (`libs/db/src/repositories/call-repository.ts`)

```typescript
// libs/db/src/repositories/__tests__/call-repository.test.ts

describe('CallRepository', () => {
  let repo: CallRepository;
  let mockSupabase: ReturnType<typeof createMockSupabaseClient>;

  beforeEach(() => {
    mockSupabase = createMockSupabaseClient();
    repo = new CallRepository(mockSupabase.client);
  });

  describe('findByVapiCallId', () => {
    it('should query by vapi_call_id', async () => {
      await repo.findByVapiCallId('vapi-call-123');

      expect(mockSupabase.from).toHaveBeenCalledWith('vapi_calls');
      expect(mockSupabase.from().select).toHaveBeenCalled();
      expect(mockSupabase.from().select().eq).toHaveBeenCalledWith(
        'vapi_call_id',
        'vapi-call-123'
      );
    });
  });

  describe('findActiveCalls', () => {
    it('should query for in-progress calls', async () => {
      await repo.findActiveCalls('user-123');

      expect(mockSupabase.from).toHaveBeenCalledWith('vapi_calls');
      expect(mockSupabase.from().select).toHaveBeenCalled();
      expect(mockSupabase.from().select().eq).toHaveBeenCalledWith('user_id', 'user-123');
      expect(mockSupabase.from().select().in).toHaveBeenCalledWith('status', [
        'queued',
        'ringing',
        'in_progress',
      ]);
    });
  });

  describe('updateCallStatus', () => {
    it('should update status and timestamp', async () => {
      await repo.updateCallStatus('call-123', 'completed', new Date('2025-12-08'));

      expect(mockSupabase.from().update).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'completed',
          ended_at: expect.any(String),
          updated_at: expect.any(String),
        })
      );
    });

    it('should not set ended_at for non-terminal statuses', async () => {
      await repo.updateCallStatus('call-123', 'ringing');

      expect(mockSupabase.from().update).toHaveBeenCalledWith(
        expect.not.objectContaining({
          ended_at: expect.anything(),
        })
      );
    });
  });
});
```

#### 3. Client Creation (`libs/db/src/server.ts`)

```typescript
// libs/db/src/__tests__/server.test.ts

describe('Supabase Server Client', () => {
  describe('createClient', () => {
    it('should create client with cookies', async () => {
      const client = await createClient();

      expect(client).toBeDefined();
      expect(client.auth).toBeDefined();
      expect(client.from).toBeDefined();
    });

    it('should respect RLS policies', async () => {
      const client = await createClient();

      // Standard client should use auth context
      const { data: { user } } = await client.auth.getUser();

      // Query should be filtered by RLS
      const { data } = await client.from('cases').select('*');

      // Can only see user's own cases (assuming RLS is configured)
      if (data && user) {
        data.forEach(caseRecord => {
          expect(caseRecord.user_id).toBe(user.id);
        });
      }
    });
  });

  describe('createServiceClient', () => {
    it('should create client with service role key', async () => {
      const client = await createServiceClient();

      expect(client).toBeDefined();
      expect(client.auth).toBeDefined();
      expect(client.from).toBeDefined();
    });

    it('should bypass RLS policies', async () => {
      const client = await createServiceClient();

      // Service client can access all data regardless of auth
      const { data, error } = await client
        .from('cases')
        .select('*')
        .limit(1);

      expect(error).toBeNull();
      // Should return data even without authenticated user
      expect(data).toBeDefined();
    });
  });
});
```

### Coverage Targets

- **Repository classes**: 85% (CRUD operations)
- **Client creation**: 75% (environment-dependent)
- **Middleware**: 70% (cookie handling)

### Estimated Effort

- Repository tests: 10 hours
- Client tests: 6 hours
- Integration tests: 6 hours
- **Total**: ~22 hours (~3 days)

---

## Library 5: `@odis/idexx` (HIGH - P1)

### Overview

IDEXX data transformation and validation. Critical for converting IDEXX Neo data into VAPI-compatible format.

### What to Test

#### 1. Transformer (`libs/idexx/src/transformer.ts`)

```typescript
// libs/idexx/src/__tests__/transformer.test.ts

import { describe, it, expect } from 'vitest';
import {
  transformIdexxToCallRequest,
  formatDateForVoice,
  formatPhoneForVoice,
  formatPhoneNumber,
  extractConsultationId,
} from '../transformer';

describe('IDEXX Transformer', () => {
  describe('transformIdexxToCallRequest', () => {
    it('should transform complete IDEXX data', () => {
      const idexxData = {
        patient: {
          name: 'Max',
          species: 'Dog',
          breed: 'Golden Retriever',
        },
        client: {
          firstName: 'John',
          lastName: 'Smith',
          phone: '555-123-4567',
        },
        consultation: {
          id: 'consult-123',
          date: '2025-12-08',
          reason: 'Annual checkup',
          notes: 'Patient is healthy. Vaccinations up to date.',
        },
        clinic: {
          name: 'Happy Paws Veterinary',
          phone: '555-987-6543',
        },
        providers: [
          { name: 'Dr. Sarah Johnson' },
        ],
      };

      const result = transformIdexxToCallRequest(idexxData);

      expect(result).toEqual({
        petName: 'Max',
        species: 'Dog',
        breed: 'Golden Retriever',
        ownerName: 'John Smith',
        ownerPhone: '+15551234567',
        clinicName: 'Happy Paws Veterinary',
        clinicPhone: '+15559876543',
        agentName: 'Sarah',
        appointmentDate: 'December 8th, 2 0 2 5',
        callType: 'discharge',
        subType: 'wellness',
        dischargeSummaryContent: 'Patient is healthy. Vaccinations up to date.',
      });
    });

    it('should handle missing optional fields', () => {
      const idexxData = {
        patient: {
          name: 'Max',
        },
        client: {
          firstName: 'John',
          lastName: 'Smith',
          phone: '5551234567',
        },
        clinic: {
          name: 'Test Clinic',
        },
        providers: [],
      };

      const result = transformIdexxToCallRequest(idexxData);

      expect(result.breed).toBeUndefined();
      expect(result.species).toBeUndefined();
      expect(result.agentName).toBe('Sarah'); // Default
      expect(result.clinicPhone).toBeUndefined();
    });

    it('should select first provider from array', () => {
      const idexxData = {
        patient: { name: 'Max' },
        client: { firstName: 'John', lastName: 'Smith', phone: '5551234567' },
        clinic: { name: 'Test Clinic' },
        providers: [
          { name: 'Dr. Sarah Johnson' },
          { name: 'Dr. Mike Davis' },
        ],
      };

      const result = transformIdexxToCallRequest(idexxData);

      expect(result.agentName).toBe('Sarah');
    });

    it('should generate default notes from consultation data', () => {
      const idexxData = {
        patient: { name: 'Max' },
        client: { firstName: 'John', lastName: 'Smith', phone: '5551234567' },
        clinic: { name: 'Test Clinic' },
        providers: [],
        consultation: {
          id: 'consult-123',
          reason: 'Ear infection follow-up',
          // No notes provided
        },
      };

      const result = transformIdexxToCallRequest(idexxData);

      expect(result.dischargeSummaryContent).toContain('consult-123');
      expect(result.dischargeSummaryContent).toContain('Ear infection follow-up');
    });
  });

  describe('formatDateForVoice', () => {
    it('should format January 1st correctly', () => {
      const result = formatDateForVoice('2025-01-01');

      expect(result).toBe('January 1st, 2 0 2 5');
    });

    it('should format December 31st correctly', () => {
      const result = formatDateForVoice('2025-12-31');

      expect(result).toBe('December 31st, 2 0 2 5');
    });

    it('should handle ordinals correctly', () => {
      expect(formatDateForVoice('2025-03-01')).toContain('1st');
      expect(formatDateForVoice('2025-03-02')).toContain('2nd');
      expect(formatDateForVoice('2025-03-03')).toContain('3rd');
      expect(formatDateForVoice('2025-03-04')).toContain('4th');
      expect(formatDateForVoice('2025-03-11')).toContain('11th');
      expect(formatDateForVoice('2025-03-21')).toContain('21st');
      expect(formatDateForVoice('2025-03-22')).toContain('22nd');
      expect(formatDateForVoice('2025-03-23')).toContain('23rd');
    });

    it('should spell out year with spaces', () => {
      const result = formatDateForVoice('2025-06-15');

      expect(result).toContain('2 0 2 5');
    });
  });

  describe('formatPhoneForVoice', () => {
    it('should format 10-digit US number', () => {
      const result = formatPhoneForVoice('5551234567');

      expect(result).toBe('five five five, one two three four five six seven');
    });

    it('should remove formatting characters', () => {
      const result = formatPhoneForVoice('(555) 123-4567');

      expect(result).toBe('five five five, one two three four five six seven');
    });

    it('should handle 11-digit number with country code', () => {
      const result = formatPhoneForVoice('15551234567');

      expect(result).toBe('five five five, one two three four five six seven');
    });

    it('should use last 10 digits for long numbers', () => {
      const result = formatPhoneForVoice('0015551234567');

      expect(result).toBe('five five five, one two three four five six seven');
    });

    it('should insert comma after area code', () => {
      const result = formatPhoneForVoice('5551234567');

      expect(result).toContain('five five five,');
    });
  });

  describe('formatPhoneNumber', () => {
    it('should add +1 to 10-digit numbers', () => {
      const result = formatPhoneNumber('5551234567');

      expect(result).toBe('+15551234567');
    });

    it('should preserve +1 for 11-digit numbers', () => {
      const result = formatPhoneNumber('15551234567');

      expect(result).toBe('+15551234567');
    });

    it('should add + to numbers with country code', () => {
      const result = formatPhoneNumber('445551234567');

      expect(result).toBe('+445551234567');
    });

    it('should remove formatting characters', () => {
      const result = formatPhoneNumber('(555) 123-4567');

      expect(result).toBe('+15551234567');
    });
  });

  describe('extractConsultationId', () => {
    it('should extract ID from IDEXX Neo URL', () => {
      const url = 'https://neo.idexx.com/consultations/123456/summary';

      const result = extractConsultationId(url);

      expect(result).toBe('123456');
    });

    it('should return null for invalid URLs', () => {
      expect(extractConsultationId('not-a-url')).toBeNull();
      expect(extractConsultationId('')).toBeNull();
      expect(extractConsultationId('https://example.com/page')).toBeNull();
    });
  });
});
```

#### 2. Validation (`libs/idexx/src/validation.ts`)

```typescript
// libs/idexx/src/__tests__/validation.test.ts

describe('IDEXX Validation', () => {
  describe('validateIdexxData', () => {
    it('should validate complete data', () => {
      const data = {
        patient: { name: 'Max' },
        client: {
          firstName: 'John',
          lastName: 'Smith',
          phone: '5551234567',
        },
        clinic: { name: 'Test Clinic' },
        providers: [{ name: 'Dr. Smith' }],
      };

      const result = validateIdexxData(data);

      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should reject missing patient name', () => {
      const data = {
        patient: { name: '' },
        client: {
          firstName: 'John',
          lastName: 'Smith',
          phone: '5551234567',
        },
        clinic: { name: 'Test Clinic' },
        providers: [{ name: 'Dr. Smith' }],
      };

      const result = validateIdexxData(data);

      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.stringContaining('patient name')
      );
    });

    it('should reject missing client name', () => {
      const data = {
        patient: { name: 'Max' },
        client: {
          firstName: '',
          lastName: '',
          phone: '5551234567',
        },
        clinic: { name: 'Test Clinic' },
        providers: [{ name: 'Dr. Smith' }],
      };

      const result = validateIdexxData(data);

      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.stringContaining('client name')
      );
    });

    it('should reject missing client phone', () => {
      const data = {
        patient: { name: 'Max' },
        client: {
          firstName: 'John',
          lastName: 'Smith',
          phone: '',
        },
        clinic: { name: 'Test Clinic' },
        providers: [{ name: 'Dr. Smith' }],
      };

      const result = validateIdexxData(data);

      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.stringContaining('client phone')
      );
    });

    it('should reject empty providers array', () => {
      const data = {
        patient: { name: 'Max' },
        client: {
          firstName: 'John',
          lastName: 'Smith',
          phone: '5551234567',
        },
        clinic: { name: 'Test Clinic' },
        providers: [],
      };

      const result = validateIdexxData(data);

      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.stringContaining('provider')
      );
    });

    it('should return all validation errors', () => {
      const data = {
        patient: { name: '' },
        client: {
          firstName: '',
          lastName: '',
          phone: '',
        },
        clinic: { name: '' },
        providers: [],
      };

      const result = validateIdexxData(data);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(3);
    });
  });
});
```

### Coverage Targets

- **Transformer functions**: 90% (data conversion logic)
- **Validation**: 95% (error detection)
- **Edge cases**: 100% (voice formatting quirks)

### Estimated Effort

- Transformer tests: 8 hours
- Validation tests: 4 hours
- Integration tests: 4 hours
- **Total**: ~16 hours (~2 days)

---

## Library 6: `@odis/api` (MEDIUM - P2)

### Overview

API helper utilities for authentication, CORS, and error handling in Next.js API routes.

### What to Test

#### 1. Authentication (`libs/api/src/auth.ts`)

```typescript
// libs/api/src/__tests__/auth.test.ts

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { authenticateUser, withAuth } from '../auth';
import { createMockRequest } from '@odis/testing';
import { createMockSupabaseClient, createMockUser } from '@odis/testing';

describe('API Authentication', () => {
  describe('authenticateUser', () => {
    it('should authenticate with Bearer token', async () => {
      const mockUser = createMockUser();
      const request = createMockRequest({
        headers: {
          authorization: 'Bearer test-token-123',
        },
      });

      // Mock Supabase client creation
      vi.spyOn(
        await import('@supabase/ssr'),
        'createServerClient'
      ).mockReturnValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: mockUser },
            error: null,
          }),
        },
      } as never);

      const result = await authenticateUser(request);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.user).toEqual(mockUser);
      }
    });

    it('should authenticate with cookies', async () => {
      const mockUser = createMockUser();
      const request = createMockRequest({
        cookies: {
          'sb-access-token': 'test-token',
        },
      });

      // Mock getUser server action
      vi.spyOn(
        await import('~/server/actions/auth'),
        'getUser'
      ).mockResolvedValue(mockUser);

      const result = await authenticateUser(request);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.user).toEqual(mockUser);
      }
    });

    it('should return 401 for missing auth', async () => {
      const request = createMockRequest({});

      const result = await authenticateUser(request);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.response.status).toBe(401);
      }
    });

    it('should return 401 for invalid token', async () => {
      const request = createMockRequest({
        headers: {
          authorization: 'Bearer invalid-token',
        },
      });

      vi.spyOn(
        await import('@supabase/ssr'),
        'createServerClient'
      ).mockReturnValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: null },
            error: new Error('Invalid token'),
          }),
        },
      } as never);

      const result = await authenticateUser(request);

      expect(result.success).toBe(false);
    });
  });

  describe('withAuth HOF', () => {
    it('should call handler with authenticated user', async () => {
      const mockUser = createMockUser();
      const request = createMockRequest({
        headers: { authorization: 'Bearer test-token' },
      });

      vi.spyOn(
        await import('@supabase/ssr'),
        'createServerClient'
      ).mockReturnValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: mockUser },
            error: null,
          }),
        },
      } as never);

      const handler = vi.fn().mockResolvedValue(
        NextResponse.json({ success: true })
      );

      const wrappedHandler = withAuth(handler);
      await wrappedHandler(request, { params: Promise.resolve({}) });

      expect(handler).toHaveBeenCalledWith(
        request,
        expect.objectContaining({ user: mockUser }),
        expect.any(Object)
      );
    });

    it('should return 401 without calling handler', async () => {
      const request = createMockRequest({});
      const handler = vi.fn();

      const wrappedHandler = withAuth(handler);
      const response = await wrappedHandler(request, { params: Promise.resolve({}) });

      expect(handler).not.toHaveBeenCalled();
      expect(response.status).toBe(401);
    });

    it('should check role requirement', async () => {
      const mockUser = createMockUser({ role: 'user' });
      const request = createMockRequest({
        headers: { authorization: 'Bearer test-token' },
      });

      // Mock authentication
      vi.spyOn(
        await import('@supabase/ssr'),
        'createServerClient'
      ).mockReturnValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: mockUser },
            error: null,
          }),
        },
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { role: 'user' },
                error: null,
              }),
            }),
          }),
        }),
      } as never);

      const handler = vi.fn();

      const wrappedHandler = withAuth(handler, { requireRole: 'admin' });
      const response = await wrappedHandler(request, { params: Promise.resolve({}) });

      expect(handler).not.toHaveBeenCalled();
      expect(response.status).toBe(403);
    });

    it('should handle errors gracefully', async () => {
      const request = createMockRequest({
        headers: { authorization: 'Bearer test-token' },
      });

      const handler = vi.fn().mockRejectedValue(new Error('Handler error'));

      const wrappedHandler = withAuth(handler);
      const response = await wrappedHandler(request, { params: Promise.resolve({}) });

      expect(response.status).toBe(500);
    });
  });
});
```

#### 2. Error Handling (`libs/api/src/errors.ts`)

```typescript
// libs/api/src/__tests__/errors.test.ts

describe('API Error Handling', () => {
  describe('errorResponse', () => {
    it('should create error response with status code', () => {
      const response = errorResponse('Not found', 404);

      expect(response.status).toBe(404);
    });

    it('should include error message in body', async () => {
      const response = errorResponse('Validation failed', 400);
      const body = await response.json();

      expect(body.error).toBe('Validation failed');
    });

    it('should include additional details', async () => {
      const response = errorResponse('Bad request', 400, {
        message: 'Invalid phone number',
        field: 'phoneNumber',
      });
      const body = await response.json();

      expect(body.message).toBe('Invalid phone number');
      expect(body.field).toBe('phoneNumber');
    });

    it('should add CORS headers when request provided', () => {
      const request = createMockRequest({
        headers: { origin: 'https://example.com' },
      });

      const response = errorResponse('Error', 500, {}, request);
      const headers = response.headers;

      expect(headers.get('Access-Control-Allow-Origin')).toBeDefined();
    });
  });

  describe('successResponse', () => {
    it('should create success response with default 200', () => {
      const response = successResponse({ data: 'test' });

      expect(response.status).toBe(200);
    });

    it('should support custom status codes', () => {
      const response = successResponse({ created: true }, 201);

      expect(response.status).toBe(201);
    });

    it('should include data in body', async () => {
      const data = { id: '123', name: 'Test' };
      const response = successResponse(data);
      const body = await response.json();

      expect(body).toEqual(data);
    });
  });
});
```

### Coverage Targets

- **Auth utilities**: 80% (multiple auth paths)
- **Error handling**: 90% (simple helpers)
- **CORS handling**: 70% (environment-dependent)

### Estimated Effort

- Auth tests: 6 hours
- Error handling tests: 3 hours
- CORS tests: 3 hours
- **Total**: ~12 hours (~1.5 days)

---

## Test Categories Summary

### Unit Tests (Pure Functions)

**Purpose**: Test individual functions in isolation
**Tools**: Vitest, no mocks needed
**Examples**:
- `formatDateForVoice()`
- `calculateTotalCost()`
- `formatPhoneNumber()`
- Zod schema validation

**Pattern**:
```typescript
describe('Pure Function', () => {
  it('should transform input to expected output', () => {
    const result = pureFunction(input);
    expect(result).toBe(expectedOutput);
  });
});
```

### Integration Tests (Service Layers)

**Purpose**: Test multi-step workflows and orchestration
**Tools**: Vitest + Mocked Supabase/VAPI
**Examples**:
- `DischargeOrchestrator.orchestrate()`
- `CasesService.ingest()`
- Webhook handlers with database updates

**Pattern**:
```typescript
describe('Service Integration', () => {
  let mockSupabase: ReturnType<typeof createMockSupabaseClient>;

  beforeEach(() => {
    mockSupabase = createMockSupabaseClient();
  });

  it('should coordinate multiple operations', async () => {
    const service = new Service(mockSupabase.client);
    const result = await service.complexOperation(input);

    expect(mockSupabase.from).toHaveBeenCalled();
    expect(result.success).toBe(true);
  });
});
```

### API/Webhook Handler Tests

**Purpose**: Test HTTP request/response handling
**Tools**: Vitest + Mock NextRequest
**Examples**:
- VAPI webhook handlers
- API authentication middleware
- CORS handling

**Pattern**:
```typescript
describe('API Handler', () => {
  it('should process webhook payload', async () => {
    const request = createMockRequest({
      method: 'POST',
      body: JSON.stringify(payload),
    });

    const response = await POST(request);

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
  });
});
```

### Validation Schema Tests

**Purpose**: Test Zod schema parsing and error messages
**Tools**: Vitest
**Examples**:
- All `@odis/validators` schemas
- Input validation edge cases

**Pattern**:
```typescript
describe('Schema Validation', () => {
  it('should accept valid input', () => {
    const result = schema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it('should reject invalid input', () => {
    const result = schema.safeParse(invalidInput);
    expect(result.success).toBe(false);
    expect(result.error.issues[0].message).toContain('expected message');
  });
});
```

---

## Mocking Strategies

### Supabase Mocking

**Strategy**: Use `@odis/testing` mock utilities

```typescript
import { createMockSupabaseClient } from '@odis/testing';

// Basic mock
const { client, auth, from } = createMockSupabaseClient();

// With user
const mockUser = createMockUser({ email: 'test@example.com' });
const { client } = createMockSupabaseClient({ user: mockUser });

// With custom query response
const queryBuilder = createMockQueryBuilder({
  data: [{ id: '1', name: 'Test' }],
  error: null,
});
const { client } = createMockSupabaseClient({ queryBuilder });

// Verify interactions
expect(from).toHaveBeenCalledWith('table_name');
expect(from().select).toHaveBeenCalled();
```

**RLS Testing**:
```typescript
// Test that service client bypasses RLS
const serviceClient = await createServiceClient();
const { data } = await serviceClient.from('cases').select('*');

// Should return all cases, not just user's cases
expect(data.length).toBeGreaterThan(userCasesCount);
```

### VAPI Client Mocking

**Strategy**: Mock `@vapi-ai/server-sdk`

```typescript
import { vi } from 'vitest';
import { createMockVapiClient } from '@odis/testing';

vi.mock('@vapi-ai/server-sdk', () => ({
  VapiClient: vi.fn(() => createMockVapiClient()),
}));

// Or mock specific methods
vi.mock('../client', () => ({
  createPhoneCall: vi.fn().mockResolvedValue({
    id: 'call-123',
    status: 'queued',
  }),
}));
```

**Webhook Payload Mocking**:
```typescript
import { createMockVapiWebhook } from '@odis/testing';

const webhook = createMockVapiWebhook('status-update', {
  status: 'in-progress',
  call: {
    id: 'call-123',
    startedAt: new Date().toISOString(),
  },
});
```

### QStash Mocking

**Strategy**: Mock scheduling functions

```typescript
vi.mock('@odis/qstash/client', () => ({
  scheduleCallExecution: vi.fn().mockResolvedValue('qstash-msg-123'),
  scheduleEmailExecution: vi.fn().mockResolvedValue('qstash-msg-456'),
}));

// Verify scheduling
expect(scheduleCallExecution).toHaveBeenCalledWith(
  'call-id',
  expect.any(Date)
);
```

### AI Generation Mocking

**Strategy**: Mock AI functions to avoid API calls

```typescript
vi.mock('@odis/ai/generate-structured-discharge', () => ({
  generateStructuredDischargeSummaryWithRetry: vi.fn().mockResolvedValue({
    structured: { diagnosis: 'Test diagnosis' },
    plainText: 'Test summary',
  }),
}));

vi.mock('@odis/ai/normalize-scribe', () => ({
  extractEntitiesWithRetry: vi.fn().mockResolvedValue({
    patient: { name: 'Max', species: 'dog' },
    clinical: { diagnosis: 'ear infection' },
  }),
}));
```

### External API Mocks

**Strategy**: Use MSW (Mock Service Worker) for HTTP interception (optional)

```typescript
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';

const server = setupServer(
  http.post('https://api.vapi.ai/calls', () => {
    return HttpResponse.json({
      id: 'call-123',
      status: 'queued',
    });
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

---

## CI/CD Integration

### GitHub Actions Workflow

```yaml
# .github/workflows/test-libs.yml
name: Test Shared Libraries

on:
  push:
    branches: [main, develop]
    paths:
      - 'libs/**'
      - 'package.json'
      - 'pnpm-lock.yaml'
  pull_request:
    branches: [main, develop]
    paths:
      - 'libs/**'

jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [20.x]

    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v2
        with:
          version: 8

      - name: Use Node.js ${{ matrix.node-version }}
        uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install

      - name: Run all library tests
        run: pnpm nx run-many -t test --projects="tag:type:lib"

      - name: Run specific library tests
        run: |
          pnpm nx test @odis/vapi
          pnpm nx test @odis/services
          pnpm nx test @odis/validators
          pnpm nx test @odis/db
          pnpm nx test @odis/idexx
          pnpm nx test @odis/api

      - name: Generate coverage report
        run: pnpm nx run-many -t test --coverage --projects="tag:type:lib"

      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info
          flags: libs
          name: libs-coverage

      - name: Check coverage threshold
        run: |
          # Fail if coverage below 80%
          pnpm nx run-many -t test --coverage --coverageThreshold='{"global":{"lines":80,"functions":80,"branches":80,"statements":80}}'
```

### Pre-commit Hooks

```bash
# .husky/pre-commit
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

# Run lint-staged (formatting + linting)
pnpm lint-staged

# Run tests for affected libraries
pnpm nx affected -t test --base=HEAD~1
```

### Nx Configuration

```json
// nx.json
{
  "targetDefaults": {
    "test": {
      "cache": true,
      "inputs": [
        "default",
        "^production",
        "{workspaceRoot}/vitest.config.ts"
      ],
      "outputs": ["{projectRoot}/coverage"]
    }
  },
  "tasksRunnerOptions": {
    "default": {
      "runner": "nx/tasks-runners/default",
      "options": {
        "cacheableOperations": ["test", "lint", "typecheck"]
      }
    }
  }
}
```

---

## Implementation Phases

### Phase 1: CRITICAL Libraries (Weeks 1-2)

**Goal**: 60% coverage on P0 libraries
**Estimated Effort**: ~76 hours (~2 weeks)

| Library | Priority | Effort | Coverage Target |
|---------|----------|--------|-----------------|
| `@odis/vapi` | P0 | 36 hours | 60% |
| `@odis/services` | P0 | 40 hours | 60% |

**Deliverables**:
- [ ] VAPI client tests (all methods)
- [ ] VAPI webhook handler tests (status-update, end-of-call-report, hang)
- [ ] VAPI webhook dispatcher tests
- [ ] Discharge orchestrator tests (sequential & parallel modes)
- [ ] Cases service tests (ingest, scheduleDischargeCall)
- [ ] CI/CD workflow configured

**Success Criteria**:
- All critical path tests passing
- Webhook event handling verified
- Orchestrator error handling tested
- QStash rollback logic validated

---

### Phase 2: HIGH Priority Libraries (Weeks 3-4)

**Goal**: 70% coverage on P1 libraries
**Estimated Effort**: ~53 hours (~2 weeks)

| Library | Priority | Effort | Coverage Target |
|---------|----------|--------|-----------------|
| `@odis/validators` | P1 | 15 hours | 90% |
| `@odis/db` | P1 | 22 hours | 70% |
| `@odis/idexx` | P1 | 16 hours | 80% |

**Deliverables**:
- [ ] All Zod schema tests
- [ ] Repository pattern tests
- [ ] Supabase client tests (RLS vs service)
- [ ] IDEXX transformer tests
- [ ] IDEXX validation tests
- [ ] Edge case coverage (voice formatting, phone numbers)

**Success Criteria**:
- Schema validation prevents bad data
- Repository CRUD operations verified
- IDEXX transformations accurate
- Voice formatting sounds natural

---

### Phase 3: MEDIUM Priority + Refinement (Weeks 5-6)

**Goal**: 80% total coverage, all libs tested
**Estimated Effort**: ~40 hours (~1.5 weeks)

| Library | Priority | Effort | Coverage Target |
|---------|----------|--------|-----------------|
| `@odis/api` | P2 | 12 hours | 75% |
| Integration tests | All | 16 hours | N/A |
| Refinement & docs | All | 12 hours | N/A |

**Deliverables**:
- [ ] API auth tests (Bearer + cookie)
- [ ] API error handling tests
- [ ] Cross-library integration tests
- [ ] Test documentation updates
- [ ] Coverage reports published

**Success Criteria**:
- Auth middleware tested
- Integration workflows validated
- Documentation complete
- 80% overall coverage achieved

---

## Success Metrics

### Coverage Thresholds

Configure in `vitest.config.ts`:

```typescript
export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      lines: 80,
      functions: 80,
      branches: 80,
      statements: 80,
      exclude: [
        '**/*.test.ts',
        '**/__tests__/**',
        '**/node_modules/**',
        '**/dist/**',
        '**/*.config.ts',
      ],
      include: [
        'libs/**/*.ts',
      ],
      // Per-library thresholds
      thresholdscope: {
        'libs/vapi/**/*.ts': {
          lines: 85,
          functions: 85,
          branches: 80,
          statements: 85,
        },
        'libs/validators/**/*.ts': {
          lines: 90,
          functions: 90,
          branches: 90,
          statements: 90,
        },
      },
    },
  },
});
```

### Quality Gates

Before merging to `main`:

1. **All tests passing**: 100%
2. **Coverage above threshold**: 80%
3. **No critical vulnerabilities**: Security scans clean
4. **Type checking**: No TypeScript errors
5. **Linting**: No ESLint errors
6. **Build**: Nx build succeeds

### Monitoring Metrics

Track in CI/CD:

- **Test execution time**: Aim for <5 min total
- **Flaky test rate**: <2%
- **Coverage trend**: Increasing over time
- **Test count**: Minimum 200 tests across all libs

---

## Best Practices

### Test Organization

```
libs/
├── vapi/
│   ├── src/
│   │   ├── client.ts
│   │   ├── webhooks/
│   │   │   ├── index.ts
│   │   │   ├── handlers/
│   │   │   │   ├── status-update.ts
│   │   │   │   └── __tests__/
│   │   │   │       └── status-update.test.ts
│   │   │   └── __tests__/
│   │   │       └── index.test.ts
│   │   └── __tests__/
│   │       └── client.test.ts
│   └── vitest.config.ts
```

**Guidelines**:
- Colocate tests with source files in `__tests__/` directories
- Name test files with `.test.ts` suffix
- Group tests by feature/module using `describe()` blocks
- Use descriptive test names (what/when/should pattern)

### AAA Pattern

**Arrange-Act-Assert**:

```typescript
it('should schedule call with custom delay', async () => {
  // Arrange
  const mockSupabase = createMockSupabaseClient();
  const service = new CasesService(mockSupabase.client);
  const scheduledAt = new Date('2025-12-08T15:00:00Z');

  // Act
  const result = await service.scheduleDischargeCall(
    mockSupabase.client,
    'user-123',
    'case-123',
    { scheduledAt, clinicName: 'Test Clinic' }
  );

  // Assert
  expect(result.scheduled_for).toBe(scheduledAt.toISOString());
  expect(mockSupabase.from).toHaveBeenCalledWith('vapi_calls');
});
```

### Avoid Test Interdependence

**Bad**:
```typescript
let sharedState: any;

it('test 1', () => {
  sharedState = doSomething();
});

it('test 2', () => {
  // Depends on test 1 running first
  expect(sharedState).toBeDefined();
});
```

**Good**:
```typescript
describe('Feature', () => {
  let service: Service;

  beforeEach(() => {
    // Fresh state for each test
    service = new Service(createMockSupabaseClient().client);
  });

  it('test 1', () => {
    const result = service.doSomething();
    expect(result).toBeDefined();
  });

  it('test 2', () => {
    const result = service.doSomething();
    expect(result).toBeDefined();
  });
});
```

### Mock at the Boundary

**Principle**: Mock external dependencies, not internal modules

**Good**:
```typescript
// Mock external API
vi.mock('@vapi-ai/server-sdk');

// Mock external service
vi.mock('@odis/qstash/client');

// Test internal logic without mocks
import { calculateRetryDelay } from './internal-utils';
expect(calculateRetryDelay(0)).toBe(300); // 5 min
```

**Bad**:
```typescript
// Don't mock internal utilities
vi.mock('./internal-utils', () => ({
  calculateRetryDelay: vi.fn().mockReturnValue(300),
}));

// Now you're testing the mock, not the code
```

### Use Descriptive Test Names

**Pattern**: `should [expected behavior] when [condition]`

```typescript
// ✅ Good
it('should return null when user not found', () => {});
it('should schedule retry for dial-busy with 5 min backoff', () => {});
it('should validate email content with all required fields', () => {});

// ❌ Bad
it('test user', () => {});
it('retry logic', () => {});
it('email validation', () => {});
```

### Parameterized Tests

Use `it.each()` for testing multiple scenarios:

```typescript
describe('formatDateForVoice', () => {
  it.each([
    ['2025-01-01', 'January 1st, 2 0 2 5'],
    ['2025-03-02', 'March 2nd, 2 0 2 5'],
    ['2025-06-03', 'June 3rd, 2 0 2 5'],
    ['2025-12-21', 'December 21st, 2 0 2 5'],
  ])('should format %s as %s', (input, expected) => {
    expect(formatDateForVoice(input)).toBe(expected);
  });
});
```

---

## Common Gotchas

### Async/Await in Tests

**Problem**: Forgetting `await` leads to false positives

```typescript
// ❌ Bad - test passes even if function throws
it('should create user', () => {
  createUser({ email: 'test@example.com' });
  expect(true).toBe(true); // Always passes
});

// ✅ Good - properly awaits async operation
it('should create user', async () => {
  const user = await createUser({ email: 'test@example.com' });
  expect(user.email).toBe('test@example.com');
});
```

### Mock Timing Issues

**Problem**: Mocks not reset between tests

```typescript
// ✅ Solution: Clear mocks in beforeEach
beforeEach(() => {
  vi.clearAllMocks();
});

// Or use vi.restoreAllMocks() in afterEach
afterEach(() => {
  vi.restoreAllMocks();
});
```

### Supabase Client Singleton

**Problem**: Supabase client reused across tests

```typescript
// ❌ Bad - shared client pollutes tests
const supabase = createMockSupabaseClient();

it('test 1', () => {
  supabase.from('table').select();
});

it('test 2', () => {
  // from() was already called in test 1
  expect(supabase.from).toHaveBeenCalledTimes(1); // Fails!
});

// ✅ Good - fresh client per test
let supabase: ReturnType<typeof createMockSupabaseClient>;

beforeEach(() => {
  supabase = createMockSupabaseClient();
});
```

### Date/Time Testing

**Problem**: Tests fail due to timing

```typescript
// ❌ Bad - flaky due to timing
it('should set timestamp', () => {
  const result = createRecord();
  expect(result.created_at).toBe(new Date().toISOString());
});

// ✅ Good - use date mocking
vi.setSystemTime(new Date('2025-12-08T10:00:00Z'));

it('should set timestamp', () => {
  const result = createRecord();
  expect(result.created_at).toBe('2025-12-08T10:00:00.000Z');
});

vi.useRealTimers(); // Restore after test
```

---

## Next Steps

### Immediate Actions (Week 1)

1. ✅ Review this strategy document
2. ✅ Set up `@odis/testing` library (already exists)
3. ✅ Configure Vitest for all library projects
4. ✅ Create GitHub Actions workflow
5. ✅ Start with `@odis/vapi` client tests

### Week-by-Week Breakdown

**Week 1**:
- VAPI client tests (8 hours)
- VAPI webhook handler tests (16 hours)

**Week 2**:
- VAPI webhook dispatcher tests (12 hours)
- Discharge orchestrator tests (20 hours)

**Week 3**:
- Cases service tests (12 hours)
- Validators tests (15 hours)

**Week 4**:
- Database repository tests (22 hours)

**Week 5**:
- IDEXX tests (16 hours)
- API tests (12 hours)

**Week 6**:
- Integration tests (16 hours)
- Documentation & refinement (12 hours)

### Resources Needed

- **Developer Time**: 1 senior developer full-time for 6 weeks
- **Tools**: Vitest, Testing Library, Codecov (optional)
- **CI/CD**: GitHub Actions (already configured)
- **Documentation**: This strategy document + inline test comments

---

## Conclusion

This testing strategy provides a comprehensive, phased approach to achieving 80% test coverage across the six highest-priority shared libraries in the ODIS AI Nx monorepo. By prioritizing CRITICAL libraries first (`@odis/vapi`, `@odis/services`), we ensure that the most business-critical code is tested thoroughly before moving to HIGH priority libraries.

The strategy emphasizes:

1. **Pragmatic prioritization**: Test what matters most first
2. **Comprehensive coverage**: Unit, integration, and contract tests
3. **Maintainability**: Reusable mocks, clear patterns, good organization
4. **CI/CD integration**: Automated testing and coverage tracking
5. **Phased implementation**: Achievable milestones over 6 weeks

By following this strategy, the ODIS AI platform will have a robust test suite that prevents regressions, enables confident refactoring, and ensures reliability for the critical veterinary voice call management features.

**Total Estimated Effort**: ~169 hours (~6 weeks at ~28 hours/week)

**Expected Outcome**: 80% coverage across all high-priority libraries, with CRITICAL libraries at 85%+ coverage.

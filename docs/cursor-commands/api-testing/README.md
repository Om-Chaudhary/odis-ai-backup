# API Testing Commands

This directory contains commands and workflows for testing API endpoints and integrations.

## Overview

API testing workflows include:

- Endpoint testing
- Request/response validation
- Error scenario testing
- Authentication testing
- Integration verification

## Quick Start

### Test API Endpoint

1. Identify endpoint to test
2. Prepare test data
3. Make request (via browser or curl)
4. Verify response
5. Check error handling

### Test Authentication

1. Test with valid credentials
2. Test with invalid credentials
3. Test with expired tokens
4. Verify error responses

## Available Commands

See [api-test-commands.md](./api-test-commands.md) for complete command reference.

## Common Workflows

### Endpoint Testing

- Test GET requests
- Test POST/PUT/DELETE requests
- Verify response structure
- Check status codes

### Error Testing

- Test invalid inputs
- Test missing required fields
- Test unauthorized access
- Verify error messages

### Integration Testing

- Test with real data
- Test with mock data
- Verify database updates
- Check webhook triggers

## Examples

See the [examples/](./examples/) directory for:

- Endpoint testing examples
- Authentication workflows
- Error scenario testing
- Integration patterns

## Related Documentation

- [API Testing Commands](./api-test-commands.md) - Complete command reference
- [API Reference](../../api/API_REFERENCE.md) - API documentation
- [Testing Strategy](../../testing/TESTING_STRATEGY.md) - Overall testing approach

---

**Last Updated**: 2025-01-27

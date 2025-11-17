# TESTING AGENT

## Your Mission
Create comprehensive tests for all Phase 1 foundation code.

## Requirements

### 1. Test Infrastructure
- Install test dependencies: vitest, @vitest/ui
- Create `vitest.config.js` with proper ES Module config
- Update package.json scripts: `"test": "vitest"`, `"test:ui": "vitest --ui"`
- Create `tests/` directory structure

### 2. Unit Tests to Create

**tests/utils/logger.test.js**
- Logger creates log files
- Different log levels work (info, warn, error)
- Log format includes timestamps
- Console and file transports both work

**tests/config/env.test.js**
- Missing required env vars throw errors
- Error messages are descriptive
- All env vars load correctly
- Invalid values are caught

**tests/config/database.test.js**
- Supabase client initializes
- Connection can be established
- Error handling works for bad credentials
- Client is reusable (singleton pattern)

### 3. Integration Tests

**tests/integration/database.test.js**
- Can connect to Supabase
- Can query tables (if they exist)
- Handles connection failures gracefully
- Validates schema structure

### 4. Test Requirements
- NO placeholder tests (e.g., `expect(true).toBe(true)`)
- Real assertions that test actual behavior
- Tests actually run and pass
- Use environment variables for test Supabase instance
- Mock external API calls (don't hit real Twitter/OpenAI in tests)
- Test both success and failure cases

### 5. Test Coverage
Target minimum coverage:
- Statements: 80%+
- Branches: 70%+
- Functions: 80%+
- Lines: 80%+

## Deliverables Checklist
- [ ] vitest.config.js
- [ ] tests/utils/logger.test.js (5+ test cases)
- [ ] tests/config/env.test.js (5+ test cases)
- [ ] tests/config/database.test.js (5+ test cases)
- [ ] tests/integration/database.test.js (3+ test cases)
- [ ] All tests pass when running `npm test`
- [ ] Coverage report generated

## Test Data Strategy
- Use `.env.test` for test environment variables
- Create test fixtures in `tests/fixtures/`
- Use real Supabase test project (not mocks) for integration tests
- Clean up test data after each test

## Report Back
Provide:
1. **Tests Created**: Count of test files and total test cases
2. **Coverage Summary**: Percentage coverage achieved
3. **Test Results**: All passing? Any failures?
4. **Integration Status**: Can tests connect to real Supabase?
5. **Next Testing Priorities**: What should be tested in Phase 2?

## Success Criteria
- `npm test` runs without errors
- All tests pass
- Coverage meets minimums
- No skipped/pending tests
- Tests are deterministic (no flaky tests)

# SyncSpace Backend Tests

This directory contains all test files for the SyncSpace backend application.

## Test Structure
```
tests/
├── setup.js              # Global test setup and helper functions
├── auth.test.js          # Authentication tests
├── workspace.test.js     # Workspace management tests
├── task.test.js          # Task/Kanban board tests
└── README.md            # This file
```

## Running Tests

### Install Test Dependencies
```bash
npm install --save-dev jest supertest mongodb-memory-server
```

### Run All Tests
```bash
npm test
```

### Run Tests in Watch Mode
```bash
npm run test:watch
```

### Run Tests with Coverage
```bash
npm run test:coverage
```

### Run Specific Test File
```bash
npm test -- auth.test.js
```

## Test Configuration

### Jest Configuration (`jest.config.js`)

Create a `jest.config.js` file in the project root:
```javascript
module.exports = {
  testEnvironment: 'node',
  coveragePathIgnorePatterns: ['/node_modules/'],
  testTimeout: 10000,
  setupFilesAfterEnv: ['./tests/setup.js'],
  verbose: true,
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/models/**',
    '!src/config/**'
  ]
};
```

### Package.json Scripts

Add these scripts to your `package.json`:
```json
{
  "scripts": {
    "test": "jest --detectOpenHandles --forceExit --runInBand",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:verbose": "jest --verbose"
  }
}
```

## Test Environment Variables

Create a `.env.test` file for test-specific environment variables:
```env
NODE_ENV=test
JWT_SECRET=test-jwt-secret-key
JWT_REFRESH_SECRET=test-refresh-secret-key
JWT_EXPIRE=1d
JWT_REFRESH_EXPIRE=7d
```

## Writing Tests

### Example Test Structure
```javascript
describe('Feature Name', () => {
  beforeEach(async () => {
    // Setup before each test
  });

  afterEach(async () => {
    // Cleanup after each test
  });

  describe('Specific Functionality', () => {
    it('should do something specific', async () => {
      // Arrange
      const testData = { /* ... */ };

      // Act
      const response = await request(app)
        .post('/api/endpoint')
        .send(testData);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
    });
  });
});
```

## Test Helper Functions

The `setup.js` file provides several helper functions:

- `createTestUser()` - Creates a test user
- `generateTestToken()` - Generates JWT token for authentication
- `createTestWorkspace()` - Creates a test workspace
- `createTestProject()` - Creates a test project
- `createTestTask()` - Creates a test task
- `createTestDocument()` - Creates a test document
- `wait()` - Helper for async operations
- `mockEmailService()` - Mocks email sending
- `mockCloudinaryService()` - Mocks file upload

### Usage Example
```javascript
const { createTestUser, generateTestToken } = require('./setup');

it('should do something with authenticated user', async () => {
  const user = await createTestUser();
  const token = generateTestToken(user._id);

  const response = await request(app)
    .get('/api/protected-route')
    .set('Authorization', `Bearer ${token}`);

  expect(response.status).toBe(200);
});
```

## Test Coverage Goals

Aim for the following coverage targets:

- **Statements**: > 80%
- **Branches**: > 75%
- **Functions**: > 80%
- **Lines**: > 80%

## Best Practices

1. **Isolation**: Each test should be independent and not rely on other tests
2. **Cleanup**: Always clean up test data after each test
3. **Descriptive Names**: Use clear, descriptive test names
4. **AAA Pattern**: Follow Arrange-Act-Assert pattern
5. **Mock External Services**: Mock email, file uploads, and external APIs
6. **Test Edge Cases**: Include tests for error conditions and edge cases
7. **Use Factories**: Use helper functions to create test data consistently

## Common Test Scenarios

### Authentication Tests
- User registration
- User login
- Token refresh
- Password reset
- Email verification

### Authorization Tests
- Role-based access control
- Resource ownership verification
- Permission checks

### CRUD Operations Tests
- Create resources
- Read/List resources
- Update resources
- Delete resources
- Validation errors

### Real-time Features Tests
- Socket.IO connections
- Event emissions
- Real-time updates
- Presence tracking

### Integration Tests
- Multiple services working together
- Database transactions
- File uploads
- Email notifications

## Continuous Integration

These tests are designed to run in CI/CD pipelines:

### GitHub Actions Example
```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '16'
      - run: npm install
      - run: npm test
      - run: npm run test:coverage
```

## Troubleshooting

### Common Issues

1. **Port Already in Use**: Ensure test server uses different port
2. **Database Connection**: Check MongoDB connection string
3. **Async Timeouts**: Increase `testTimeout` in Jest config
4. **Memory Leaks**: Use `--detectOpenHandles` and `--forceExit` flags

### Debug Mode

Run tests in debug mode:
```bash
node --inspect-brk node_modules/.bin/jest --runInBand
```

## Future Test Additions

- [ ] Project management tests
- [ ] Document collaboration tests
- [ ] Chat/messaging tests
- [ ] File upload/download tests
- [ ] Notification tests
- [ ] Performance tests
- [ ] Load tests
- [ ] Security tests

## Contributing

When adding new features, please include corresponding tests:

1. Add unit tests for new functions
2. Add integration tests for new endpoints
3. Add Socket.IO tests for real-time features
4. Update test coverage reports

## Resources

- [Jest Documentation](https://jestjs.io/)
- [Supertest Documentation](https://github.com/visionmedia/supertest)
- [MongoDB Memory Server](https://github.com/nodkz/mongodb-memory-server)
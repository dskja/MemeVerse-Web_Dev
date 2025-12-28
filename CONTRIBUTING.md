# Contributing to MemeVerse

Thank you for your interest in contributing to MemeVerse! This document provides guidelines and instructions for contributing to the project.

## Code of Conduct

- Be respectful and inclusive
- Welcome newcomers and help them get started
- Focus on constructive feedback
- Maintain a positive and collaborative environment

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/YOUR_USERNAME/MemeVerse-Web_Dev.git`
3. Add upstream remote: `git remote add upstream https://github.com/dskja/MemeVerse-Web_Dev.git`
4. Create a feature branch: `git checkout -b feature/your-feature-name`

## Development Workflow

### Before Making Changes

1. Pull the latest changes from upstream:
```bash
git checkout main
git pull upstream main
```

2. Create a new branch for your feature:
```bash
git checkout -b feature/your-feature-name
```

### Making Changes

1. **Follow the existing code style**
   - Use TypeScript for all new code
   - Follow existing naming conventions
   - Add type annotations
   - Use meaningful variable and function names

2. **Keep changes focused**
   - One feature/fix per pull request
   - Make small, atomic commits
   - Write clear commit messages

3. **Write tests** (when test infrastructure is available)
   - Unit tests for utilities and pure functions
   - Integration tests for API endpoints
   - Use meaningful test descriptions

4. **Run checks before committing**
```bash
npm run check      # Type check
npm run lint       # Lint code
npm test           # Run tests
```

### Commit Messages

Follow the conventional commits format:

```
<type>: <short description>

<optional longer description>

<optional footer>
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

Examples:
```
feat: add pagination to memes endpoint

Added pagination support with page and limit query parameters.
Returns paginated response with metadata.

Closes #123
```

```
fix: prevent XSS in comment content

Sanitize HTML in comment content using sanitize-html
to prevent cross-site scripting attacks.
```

### Testing Guidelines

#### Unit Tests

Test pure functions and utilities:

```typescript
import { describe, it, expect } from 'vitest';
import { parsePaginationParams } from '../utils/pagination';

describe('parsePaginationParams', () => {
  it('should return default values when no params provided', () => {
    const result = parsePaginationParams({});
    expect(result).toEqual({
      page: 1,
      limit: 30,
      offset: 0
    });
  });

  it('should limit maximum page size to 100', () => {
    const result = parsePaginationParams({ limit: 200 });
    expect(result.limit).toBe(100);
  });
});
```

#### API Tests

Test API endpoints with mocked database:

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import app from '../server';

describe('GET /api/memes', () => {
  it('should return paginated memes', async () => {
    const response = await request(app)
      .get('/api/memes?page=1&limit=10')
      .expect(200);

    expect(response.body).toHaveProperty('data');
    expect(response.body).toHaveProperty('pagination');
    expect(response.body.data).toBeInstanceOf(Array);
  });
});
```

### Security Guidelines

1. **Never commit sensitive data**
   - No API keys, passwords, or tokens
   - Use environment variables
   - Update `.env.example` with new variables

2. **Validate all inputs**
   - Use Zod schemas for validation
   - Sanitize HTML inputs
   - Validate file types and sizes

3. **Follow security best practices**
   - Use parameterized queries (Drizzle ORM handles this)
   - Implement rate limiting for new endpoints
   - Add authentication checks for protected routes
   - Handle errors securely (don't leak sensitive info)

### Performance Guidelines

1. **Database queries**
   - Use indexes for frequently queried columns
   - Implement pagination for large datasets
   - Use `select` to fetch only needed columns
   - Avoid N+1 queries

2. **API responses**
   - Keep response sizes reasonable
   - Use pagination
   - Implement caching where appropriate

3. **Images**
   - Optimize all uploaded images
   - Generate thumbnails
   - Use WebP format

### Pull Request Process

1. **Before submitting**
   - Ensure all tests pass
   - Run type checking
   - Update documentation if needed
   - Add or update tests for your changes

2. **PR Description**
   Include:
   - What changes were made
   - Why the changes were needed
   - How to test the changes
   - Screenshots for UI changes
   - Related issue numbers

   Example:
   ```markdown
   ## Description
   Adds pagination support to the memes endpoint to improve performance
   with large datasets.

   ## Changes
   - Added pagination utility functions
   - Updated storage layer to support limit/offset
   - Modified API endpoint to accept page and limit parameters
   - Added pagination metadata to response

   ## Testing
   - Test with `GET /api/memes?page=1&limit=10`
   - Verify pagination metadata is correct
   - Test with invalid parameters

   ## Related Issues
   Closes #123
   ```

3. **Code Review**
   - Address all feedback
   - Make requested changes
   - Re-request review after changes
   - Be patient and respectful

### Documentation

Update documentation when you:
- Add new features
- Change existing APIs
- Add new environment variables
- Modify configuration

Documentation to update:
- README.md - High-level overview
- CONTRIBUTING.md - Development guidelines
- Code comments - Complex logic
- API docs - New endpoints
- .env.example - New variables

### Questions?

If you have questions:
1. Check existing documentation
2. Search closed issues
3. Open a new issue with the "question" label
4. Join our community discussions

## Thank You!

Your contributions help make MemeVerse better for everyone. We appreciate your time and effort!

# Contributing to Docx-Viewer

Thank you for your interest in contributing to the Docx-Viewer extension for Visual Studio Code! This document provides guidelines and information for contributors.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Contributing Guidelines](#contributing-guidelines)
- [Pull Request Process](#pull-request-process)
- [Issue Guidelines](#issue-guidelines)
- [Coding Standards](#coding-standards)
- [Testing](#testing)
- [Documentation](#documentation)
- [Release Process](#release-process)

## Code of Conduct

This project and everyone participating in it is governed by our Code of Conduct. By participating, you are expected to uphold this code. Please report unacceptable behavior to the project maintainers.

### Our Standards

- Be respectful and inclusive in all interactions
- Focus on constructive feedback and collaboration
- Accept criticism gracefully and learn from mistakes
- Put the community and project goals first
- Show empathy towards other community members

## Getting Started

### Prerequisites

Before contributing, ensure you have:

- Node.js (version 16 or higher)
- npm (version 8 or higher)
- Visual Studio Code
- Git
- TypeScript knowledge
- Basic understanding of VS Code extension development

### First Time Contributors

1. Look for issues labeled `good first issue` or `help wanted`
2. Read through this contributing guide completely
3. Set up your development environment
4. Start with small, focused changes
5. Ask questions if anything is unclear

## Development Setup

### 1. Fork and Clone

```bash
# Fork the repository on GitHub, then clone your fork
git clone https://github.com/YOUR-USERNAME/Docx-Viewer.git
cd Docx-Viewer

# Add the original repository as upstream
git remote add upstream https://github.com/skfrost19/Docx-Viewer.git
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Build the Project

```bash
npm run compile
```

### 4. Run Tests

```bash
npm test
```

### 5. Launch Development Version

```bash
# Open VS Code with the extension loaded
code --extensionDevelopmentPath=. --new-window
```

### 6. Test Your Changes

- Open a .docx or .odt file in the Extension Development Host
- Test all functionality including toolbar, zoom, search, etc.
- Verify changes work across different themes and document types

## Contributing Guidelines

### Types of Contributions

We welcome several types of contributions:

**Bug Fixes**
- Fix existing functionality that isn't working correctly
- Improve error handling and edge cases
- Performance improvements

**New Features**
- Additional file format support
- UI/UX enhancements
- New keyboard shortcuts or commands
- Integration with other VS Code features

**Documentation**
- Improve README, code comments, or this guide
- Add or update examples
- Create tutorials or guides

**Testing**
- Add missing test cases
- Improve test coverage
- Create integration tests

### Before You Start

1. **Check existing issues** - Look for related issues or feature requests
2. **Create an issue** - If none exists, create one to discuss your proposal
3. **Get approval** - Wait for maintainer feedback before starting large changes
4. **Create a branch** - Use descriptive branch names like `fix/outline-navigation` or `feature/export-pdf`

### Branch Naming Convention

Use the following prefixes:
- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation changes
- `refactor/` - Code refactoring
- `test/` - Testing improvements
- `chore/` - Maintenance tasks

Examples:
- `feature/pdf-export`
- `fix/zoom-reset-issue`
- `docs/update-installation-guide`

## Pull Request Process

### 1. Prepare Your Changes

```bash
# Create a new branch
git checkout -b feature/your-feature-name

# Make your changes
# ... code, test, commit ...

# Push to your fork
git push origin feature/your-feature-name
```

### 2. Create Pull Request

1. **Title**: Use a clear, descriptive title
2. **Description**: Include:
   - What changes were made
   - Why the changes were needed
   - How to test the changes
   - Any breaking changes
   - Related issue numbers

### 3. Pull Request Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Tested in Extension Development Host
- [ ] Tested with multiple document types
- [ ] All existing tests pass
- [ ] Added new tests if needed

## Checklist
- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No console errors or warnings
```

### 4. Review Process

- All PRs require at least one maintainer review
- Address all feedback before requesting re-review
- PRs may be rejected if they don't align with project goals
- Be patient - reviews may take time depending on complexity

## Issue Guidelines

### Reporting Bugs

When reporting bugs, include:

```markdown
**Bug Description**
Clear description of what went wrong

**Steps to Reproduce**
1. Step one
2. Step two
3. Step three

**Expected Behavior**
What should have happened

**Actual Behavior**
What actually happened

**Environment**
- VS Code version:
- Extension version:
- Operating System:
- Document type (.docx/.odt):

**Additional Context**
Screenshots, error messages, sample files (if safe to share)
```

### Feature Requests

When requesting features, include:

```markdown
**Feature Description**
Clear description of the proposed feature

**Use Case**
Why this feature would be useful

**Proposed Implementation**
Ideas for how it might work

**Alternatives Considered**
Other solutions you've thought about
```

## Coding Standards

### TypeScript Guidelines

- Use TypeScript strict mode
- Provide type annotations for public APIs
- Use meaningful variable and function names
- Follow existing code patterns and conventions

### Code Style

- Use 4 spaces for indentation
- Use single quotes for strings
- Add trailing commas in multiline structures
- Maximum line length of 120 characters
- Use camelCase for variables and functions
- Use PascalCase for classes and interfaces

### Example Code Style

```typescript
export class DocumentRenderer {
    private static currentZoom: number = 1.0;
    private static toolbarVisible: boolean = true;

    public static async renderDocument(
        docxPath: string, 
        panel: vscode.WebviewPanel
    ): Promise<void> {
        try {
            const config = vscode.workspace.getConfiguration('docxreader');
            const font = config.get('font', 'Arial');
            
            // Process document
            const documentHtml = await this.processDocument(docxPath);
            
            // Generate enhanced HTML
            panel.webview.html = this.generateEnhancedHtml(
                documentHtml, 
                font
            );
        } catch (error) {
            console.error('Error rendering document:', error);
            throw error;
        }
    }
}
```

### Comments and Documentation

- Add JSDoc comments for public methods
- Explain complex logic with inline comments
- Keep comments up-to-date with code changes
- Document any workarounds or hacks

## Testing

### Running Tests

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- --grep "DocumentRenderer"
```

### Writing Tests

- Write tests for new features and bug fixes
- Follow existing test patterns
- Use descriptive test names
- Test both success and error cases

### Test Structure

```typescript
describe('DocumentRenderer', () => {
    describe('renderDocument', () => {
        it('should render docx files correctly', async () => {
            // Arrange
            const mockPath = '/path/to/test.docx';
            const mockPanel = createMockWebviewPanel();
            
            // Act
            await DocumentRenderer.renderDocument(mockPath, mockPanel);
            
            // Assert
            expect(mockPanel.webview.html).toContain('docx-viewer-container');
        });
        
        it('should handle invalid files gracefully', async () => {
            // Test error handling
        });
    });
});
```

## Documentation

### Code Documentation

- Document all public APIs
- Include usage examples
- Keep documentation in sync with code
- Use clear, concise language

### README Updates

When making changes that affect user-facing functionality:
- Update feature lists
- Add new keyboard shortcuts
- Update configuration options
- Add troubleshooting notes

### Changelog

Follow the changelog format:
- Add entries for new features, fixes, and breaking changes
- Use semantic versioning
- Include issue/PR references
- Date entries appropriately

## Release Process

### Version Numbering

This project follows Semantic Versioning (semver):
- **MAJOR**: Breaking changes
- **MINOR**: New features, backwards compatible
- **PATCH**: Bug fixes, backwards compatible

### Release Checklist

1. Update version in package.json
2. Update CHANGELOG.md
3. Update README.md if needed
4. Run all tests
5. Build and test extension package
6. Create release PR
7. Tag release after merge
8. Publish to VS Code Marketplace

## Getting Help

### Communication Channels

- **GitHub Issues**: For bugs, features, and general questions
- **GitHub Discussions**: For broader discussions and ideas
- **Pull Request Comments**: For code-specific questions

### Asking Questions

When asking for help:
- Search existing issues first
- Provide context and details
- Include relevant code snippets
- Be specific about what you're trying to achieve

## Recognition

Contributors will be recognized in:
- CHANGELOG.md for their contributions
- GitHub contributors list
- Special recognition for significant contributions

## License

By contributing to this project, you agree that your contributions will be licensed under the same MIT License that covers the project.

---

Thank you for contributing to Docx-Viewer! Your efforts help make this extension better for the entire VS Code community.
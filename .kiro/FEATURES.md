# Kiro Features for DevvitForACM

## 🎯 What's Included

This `.kiro` folder provides powerful AI-assisted development features tailored specifically for the DevvitForACM platformer game project.

## 📋 Comprehensive Documentation

### 1. **Specifications** (`specs/`)
Living documentation that serves as the single source of truth:

- **requirements.md** (3000+ lines)
  - Complete user stories with acceptance criteria
  - Edge cases for all features
  - Technical and non-functional requirements
  - Security, performance, accessibility requirements

- **design.md** (2500+ lines)
  - System architecture diagrams
  - Component breakdown (React, Phaser, Server)
  - Data models and schemas
  - Technical decision rationale
  - Performance optimizations
  - Security considerations

- **tasks.md** (1500+ lines)
  - Completed tasks tracker
  - Current sprint tasks with estimates
  - Backlog and future features
  - Bug tracker
  - Technical debt log

## 🤖 Intelligent Automation

### 2. **Agent Hooks** (`hooks/`)

#### pre-commit.json
Runs before every commit:
- ✅ ESLint with auto-fix
- ✅ TypeScript type checking
- ✅ Prettier formatting
- ✅ Related tests execution
- ⏱️ Configurable timeouts
- 🔔 Success/failure notifications

#### post-save.json
Triggers on file save:
- 📦 Auto-sort imports
- 🧪 Generate test files for new code
- 📁 Update barrel exports (index.ts)
- ✔️ Validate level JSON files
- ⚡ Debounced for performance

#### on-error.json
Activates on runtime errors:
- 📝 Log errors with context
- 💡 AI suggests fixes for common errors
- 🔍 Search similar issues
- 📊 Error pattern analysis

## 🎨 AI Code Generation Rules

### 3. **Steering Rules** (`steering/`)

#### coding-standards.yaml (1500+ lines)
Comprehensive coding guidelines:
- **TypeScript Rules**
  - Strict mode enforcement
  - Type annotation requirements
  - Best practices (optional chaining, const assertions)
  
- **React Rules**
  - Functional components with hooks
  - Proper prop typing
  - Performance optimization (useCallback, useMemo)
  
- **Phaser Rules**
  - Explicit type annotations
  - Resource cleanup patterns
  - Physics body best practices
  
- **File Organization**
  - One component per file
  - Barrel exports for public APIs
  - Test files co-located with source
  
- **Naming Conventions**
  - camelCase for variables/functions
  - PascalCase for classes/interfaces
  - SCREAMING_SNAKE_CASE for constants
  
- **Documentation Standards**
  - JSDoc for exported functions
  - Inline comments explaining "why"
  - TODO format guidelines
  
- **Error Handling**
  - Promise rejection handling
  - Typed errors
  - Fail-fast validation
  
- **Performance Guidelines**
  - Avoid operations in render loops
  - Object pooling strategies
  - Debouncing expensive operations
  
- **Security Rules**
  - Input validation requirements
  - Sanitization guidelines
  - Environment variable usage
  
- **Testing Standards**
  - AAA pattern (Arrange, Act, Assert)
  - Descriptive test names
  - 80%+ coverage targets
  
- **Git Conventions**
  - Commit message format
  - Branch naming patterns

#### project-context.yaml (1200+ lines)
Deep project understanding:
- **Tech Stack Knowledge**
  - Frontend: React, Phaser, TypeScript, Vite
  - Backend: Node.js, Redis, JWT
  
- **Architecture Details**
  - Client structure (pages, components, game)
  - Server structure (controllers, services, models)
  - Shared types
  
- **Domain Knowledge**
  - Grid system (60x60px cells)
  - Player mechanics (jump height, collision body)
  - Entity behaviors (spike hitboxes, spring cooldowns)
  - Patrol AI for enemies
  
- **Common Patterns**
  - Scene lifecycle
  - Modular scene structure
  - React-Phaser integration
  - Level data flow
  
- **Known Issues & Solutions**
  - TypeScript strict mode fixes
  - Collision precision adjustments
  - Mobile gesture handling
  
- **Development Workflow**
  - Setup instructions
  - Testing strategies
  - Debugging tips

## 📝 Prompt Library

### 4. **AI Prompts** (`config/ai-prompts.yaml`)

200+ reusable prompt templates for:

#### Code Generation
- Create React components
- Create Phaser entities
- Create API endpoints
- Refactor code
- Write tests
- Debug issues
- Optimize performance

#### Documentation
- API documentation (OpenAPI)
- Component documentation (Storybook)
- README generation

#### Code Review
- General quality review
- Security audit
- Performance analysis
- Accessibility check

#### Interactive
- Explain code
- Compare approaches
- Generate alternatives
- Brainstorm solutions

#### Utilities
- Generate TypeScript types
- Convert between languages
- Generate mock data
- Create migrations

#### Project-Specific
- Generate playable levels
- Balance gameplay
- Create entity variants

## ⚙️ Configuration

### 5. **Settings** (`config/settings.json`)

Central configuration for:
- Kiro feature toggles
- Spec validation rules
- Hook behavior
- AI parameters (model, temperature, tokens)
- Documentation generation
- Testing thresholds
- Linting and formatting
- Git integration
- Notifications
- Security scanning
- Performance monitoring

## 🗂️ Code Templates

### 6. **Templates** (`templates/`)

Scaffolding for new code:
- **component-template.tsx**: React component boilerplate
- **test-template.test.ts**: Test file structure
- **api-endpoint-template.ts**: API endpoint with validation

All templates include:
- Proper TypeScript types
- JSDoc documentation
- Error handling
- Following project conventions

## 🔧 Helper Scripts

### 7. **Scripts** (`scripts/`)

Automation utilities:
- **generate-test.js**: Auto-create test files
- **validate-level.js**: Validate level JSON
- **update-barrel.js**: Update index.ts exports (to be created)
- **log-error.js**: Error logging utility (to be created)

## 💡 Key Benefits

### For Developers
1. **Consistency**: Enforced coding standards across codebase
2. **Speed**: Auto-generation of boilerplate and tests
3. **Quality**: Pre-commit checks catch issues early
4. **Knowledge**: Living documentation always up-to-date
5. **Guidance**: AI understands project context

### For AI Assistants
1. **Context**: Deep understanding of project architecture
2. **Standards**: Clear rules for code generation
3. **Patterns**: Reusable prompts for common tasks
4. **Validation**: Hooks ensure generated code quality
5. **Learning**: Project-specific knowledge base

## 🚀 Quick Start

1. **Review Specs**: Read `.kiro/specs/` to understand the project
2. **Check Standards**: Review `.kiro/steering/coding-standards.yaml`
3. **Use Prompts**: Reference `.kiro/config/ai-prompts.yaml` for tasks
4. **Enable Hooks**: Ensure hooks are enabled in `settings.json`
5. **Customize**: Adapt templates and rules to your needs

## 📊 Statistics

- **Total Lines**: 10,000+ lines of documentation and configuration
- **Specifications**: 7,000+ lines of requirements, design, and tasks
- **Coding Standards**: 1,500+ lines of rules and examples
- **Project Context**: 1,200+ lines of domain knowledge
- **AI Prompts**: 200+ reusable templates
- **Hooks**: 3 automated workflows with 10+ actions
- **Templates**: 3 code scaffolds

## 🎓 Learning Resources

### Understand the System
1. Start with `.kiro/README.md`
2. Read `.kiro/specs/requirements.md` for features
3. Study `.kiro/specs/design.md` for architecture
4. Check `.kiro/specs/tasks.md` for status

### Generate Code
1. Use prompts from `ai-prompts.yaml`
2. Follow standards in `coding-standards.yaml`
3. Reference context in `project-context.yaml`
4. Use templates from `templates/`

### Automate Workflows
1. Enable hooks in `settings.json`
2. Customize hook actions as needed
3. Add new hooks for repetitive tasks
4. Monitor hook execution logs

## 🛡️ Best Practices

1. **Keep specs updated** - Documentation is only valuable if current
2. **Review hook output** - Ensure automation produces quality results
3. **Customize for your workflow** - Adapt templates and rules
4. **Monitor performance** - Disable slow hooks if needed
5. **Share knowledge** - Update project-context.yaml with new patterns

## 🔮 Future Enhancements

Potential additions:
- PR templates
- Issue templates
- CI/CD configuration
- Deployment scripts
- Performance benchmarks
- Load testing scenarios
- Security scan rules
- Dependency upgrade automation

---

**The .kiro folder transforms your development experience with AI-powered assistance that understands your project deeply and helps maintain quality, consistency, and velocity.**


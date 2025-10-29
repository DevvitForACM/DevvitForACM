# .kiro Directory - AI-Powered Development Environment

This directory contains configuration, specifications, and automation rules for Kiro AI assistant to help with the DevvitForACM project.

## 📁 Directory Structure

```
.kiro/
├── specs/              # Project specifications (single source of truth)
│   ├── requirements.md # User stories, acceptance criteria, edge cases
│   ├── design.md       # Architecture, data models, technical decisions
│   └── tasks.md        # Implementation tasks, sprints, backlog
│
├── hooks/              # Automated event-driven actions
│   ├── pre-commit.json # Lint, type-check, format before commits
│   ├── post-save.json  # Auto-import sort, test generation
│   └── on-error.json   # Error logging, fix suggestions
│
├── steering/           # AI behavior configuration
│   ├── coding-standards.yaml # Code style, patterns, conventions
│   └── project-context.yaml  # Domain knowledge, architecture
│
├── config/             # Kiro settings and prompts
│   ├── settings.json   # Main Kiro configuration
│   └── ai-prompts.yaml # Reusable AI prompt templates
│
├── templates/          # Code templates for generation
│   ├── component-template.tsx
│   ├── test-template.test.ts
│   └── api-endpoint-template.ts
│
├── scripts/            # Helper automation scripts
│   ├── generate-test.js
│   ├── update-barrel.js
│   ├── validate-level.js
│   └── log-error.js
│
└── README.md           # This file
```

## 🚀 Key Features

### 1. Spec-Driven Development (SDD)
The `specs/` directory contains living documentation that evolves with your codebase:
- **requirements.md**: What the system should do
- **design.md**: How the system works
- **tasks.md**: What needs to be implemented

These documents guide AI code generation and ensure alignment with project goals.

### 2. Agent Hooks (Automation)
Hooks automatically run on specific events:
- **pre-commit**: Lint, format, type-check before commits
- **post-save**: Generate tests, sort imports when files are saved
- **on-error**: Log errors, suggest fixes, search similar issues

### 3. Steering Rules (AI Guidance)
Configure how AI generates code:
- **coding-standards.yaml**: TypeScript style, naming conventions, patterns
- **project-context.yaml**: Domain knowledge, common patterns, architecture

### 4. AI Prompt Library
Reusable prompts for common tasks:
- Create components, entities, API endpoints
- Refactor code, write tests, debug issues
- Generate documentation, optimize performance

## 📖 How to Use

### For Developers

#### Update Specifications
Keep specs in sync with your codebase:
```bash
# Edit requirements when adding features
vim .kiro/specs/requirements.md

# Update architecture docs when refactoring
vim .kiro/specs/design.md

# Track progress in tasks
vim .kiro/specs/tasks.md
```

#### Use AI Prompts
Reference prompt templates when asking AI for help:
```
"Use the create_component prompt to generate a LevelCard component"
"Follow the refactor_code prompt to improve play-scene.ts"
"Apply the write_tests prompt for collision detection"
```

#### Customize Hooks
Enable/disable hooks in their JSON files:
```json
{
  "enabled": true,  // Set to false to disable
  "actions": [...]
}
```

### For AI Assistants

#### Context Loading
Before generating code, review:
1. `.kiro/specs/` - Understand requirements and architecture
2. `.kiro/steering/` - Follow coding standards and conventions
3. `.kiro/config/ai-prompts.yaml` - Use appropriate prompt templates

#### Code Generation
Always:
- Follow patterns in `coding-standards.yaml`
- Reference domain knowledge in `project-context.yaml`
- Include tests, docs, and error handling
- Explain technical decisions

#### Automation
Hooks run automatically, but you can suggest:
- New hooks for repetitive tasks
- Improvements to existing hooks
- Custom validation rules

## 🛠️ Configuration

### Main Settings
Edit `.kiro/config/settings.json` to configure:
- Feature toggles
- AI model parameters
- Documentation generation
- Testing thresholds
- Integration settings

### Adding Custom Hooks
1. Create JSON file in `.kiro/hooks/`
2. Define trigger, actions, and conditions
3. Add to `custom_hooks` in `settings.json`

### Extending Steering Rules
1. Add rules to existing YAML files
2. Create new YAML in `.kiro/steering/`
3. Reference in `active_rules` in `settings.json`

## 📚 Best Practices

### Keep Specs Updated
- Review `requirements.md` when adding features
- Update `design.md` when architecture changes
- Mark tasks complete in `tasks.md` as you finish them

### Leverage Automation
- Enable hooks to catch errors early
- Use post-save hooks for code quality
- Let AI suggest fixes for common issues

### Maintain Context
- Update `project-context.yaml` with new patterns
- Document technical decisions in `design.md`
- Add common pitfalls to steering rules

### Use Prompt Templates
- Reference templates for consistency
- Customize templates for your needs
- Add project-specific prompts

## 🔗 Resources

- [Kiro Documentation](https://kiro.help/docs)
- [Spec-Driven Development Guide](https://kiro.help/docs/kiro/specs/concepts)
- [Agent Hooks Guide](https://kiro.help/docs/kiro/hooks)
- [Steering Rules Guide](https://kiro.help/docs/kiro/steering)

## 🤝 Contributing

To improve the .kiro setup:
1. Identify repetitive tasks that could be automated
2. Document patterns in steering rules
3. Create reusable prompt templates
4. Keep specifications current

---

**Note**: The .kiro folder is designed to work with Kiro AI assistant. It enhances development workflow but doesn't replace good software engineering practices.


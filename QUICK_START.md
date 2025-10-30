# Quick Start Guide - Snooventure

## 🎮 Play the Game

1. **Visit the Live App:**
   - Go to the deployment URL (see README)
   - Or navigate through Reddit → Developer Apps → Snooventure

2. **Create Your First Level:**
   - Click "Create" from the home screen
   - Select entities from the palette (player, door, platforms, etc.)
   - Click on the grid to place entities
   - Right-click to delete (or use eraser tool on mobile)
   - Click "Play" to test your level immediately
   - Click "Save" to name and publish your level

3. **Play Levels:**
   - Click "Play" from the home screen
   - Browse public levels or your own creations
   - Complete levels to earn high scores
   - Timer counts down from 500 seconds
   - Collect coins for bonus points

## 🛠️ Run Locally

### Prerequisites
- Node.js 22+
- Reddit account

### Installation

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/snooventure.git
cd snooventure

# Install dependencies
npm install

# Authenticate with Reddit
npm run login
# Follow the prompts to connect your Reddit account

# Start development server
npm run dev
# This uploads to Reddit and provides a local preview URL
```

### Development Commands

```bash
npm run dev       # Start dev server with hot reload
npm run build     # Build for production
npm run deploy    # Deploy to Reddit
npm run check     # Run linter and type checker
npm run launch    # Submit for Reddit app store review
```

## 📁 Project Structure

```
DevvitForACM/
├── .kiro/                  # 🤖 Kiro IDE configuration (10,000+ lines)
│   ├── specs/             # Requirements, design, tasks
│   ├── hooks/             # Pre-commit, post-save automation
│   ├── steering/          # Coding standards, project context
│   ├── config/            # Kiro settings and prompts
│   ├── templates/         # Code scaffolding
│   └── scripts/           # Helper utilities
│
├── src/
│   ├── client/            # Frontend React + Phaser
│   │   ├── game/         # Phaser game engine
│   │   │   ├── scenes/   # CreateScene, PlayScene
│   │   │   └── entities/ # Player, enemies, coins, etc.
│   │   ├── pages/        # Home, Create, Play pages
│   │   └── components/   # React UI components
│   │
│   ├── server/           # Backend Express API
│   │   ├── controllers/  # Request handlers
│   │   ├── services/     # Business logic
│   │   └── routes/       # API endpoints
│   │
│   └── shared/           # Shared TypeScript types
│
├── assets/               # Game assets (sprites, audio, levels)
│
├── README.md            # Project overview + Kiro IDE details
├── KIRO.md              # Comprehensive Kiro development story
├── LICENSE              # MIT License
└── SUBMISSION_CHECKLIST.md  # Hackathon checklist
```

## 🎯 Key Features

### Game
- **Physics-Based Platforming:** Smooth player movement and jumping
- **Timer & Scoring:** 500s countdown, coin collection, score calculation
- **Entities:** Player, enemies, coins, spikes, lava, springs, doors
- **Animations:** Idle, run, jump animations for player
- **Mobile Support:** Virtual joystick and jump button
- **Victory Screen:** Displays score breakdown and buttons

### Level Editor
- **Grid-Based:** 60x60px cells for precise placement
- **Drag-to-Place:** Click and drag to place multiple entities
- **Easy Deletion:** Right-click (desktop) or eraser tool (mobile)
- **Quick Play:** Test your level instantly without saving
- **Save & Share:** Name your level and publish to the community
- **Validation:** Ensures levels have required player and door

### Backend
- **Authentication:** Reddit OAuth integration
- **Level Storage:** PostgreSQL database for persistent levels
- **Leaderboards:** Track high scores per level
- **Public/Private:** Control level visibility

## 🤖 Built with Kiro IDE

This entire project was developed using **Kiro IDE**, an AI-powered development environment. Key highlights:

- **10,000+ lines** of Kiro configuration
- **Spec-driven development** with living documentation
- **Automated quality hooks** ensure zero linter errors
- **Semantic code search** for rapid debugging
- **4-5x productivity improvement** quantified in KIRO.md

See [KIRO.md](./KIRO.md) for the complete development story.

## 🐛 Troubleshooting

### Build Errors
```bash
# Clean install
rm -rf node_modules package-lock.json
npm install
npm run check
```

### Authentication Issues
```bash
# Re-authenticate
npm run login
```

### Port Already in Use
```bash
# Kill process on port 3000
# Windows:
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Mac/Linux:
lsof -ti:3000 | xargs kill -9
```

### Deployment Fails
- Ensure you're logged in: `npm run login`
- Check `devvit.yaml` is properly configured
- Verify Reddit developer account is set up

## 📞 Support

- **Devvit Docs:** [developers.reddit.com](https://developers.reddit.com/)
- **Issues:** Open an issue on GitHub
- **Reddit Community:** r/devvit

## 🏆 Submission

This project is submitted for:
- **Best Kiro Developer Experience Award**
- **Best App: Community Play**

Built entirely with Kiro IDE. See [KIRO.md](./KIRO.md) for details.

---

**Happy Gaming!** 🎮✨


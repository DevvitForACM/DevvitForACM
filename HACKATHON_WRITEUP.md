# Snooventure - Hackathon Submission

## Inspiration

Snooventure was born from a love of classic platformer games and the desire to bring that nostalgic 8-bit gaming experience directly into Reddit's communities. We were inspired by iconic games like Super Mario Bros and Sonic the Hedgehog, but with a twist—we wanted to empower redditors to become game designers themselves.

The idea of combining user-generated content with competitive leaderboards creates a perfect environment for community engagement. Players can challenge each other's creations, compete for top times, and build a shared library of levels that grows with the community. We saw an opportunity to transform Reddit from a place where people talk about games into a place where they actively create and play games together.

## What it does

Snooventure is a full-featured 2D platformer game with a powerful level editor, all running natively within Reddit posts. The game offers two main experiences:

### Play Mode
- **Browse & Play Levels**: Discover community-created levels and official test levels
- **Competitive Leaderboards**: Each level tracks the top 5 fastest completion times
- **Smooth Gameplay**: Jump, run, and navigate through challenging obstacles
- **Mobile Support**: Touch controls with a virtual joystick for mobile players
- **Retro 8-bit Aesthetic**: Pixel-perfect graphics with nostalgic visual effects
- **Audio System**: Dynamic background music and sound effects (coins, jumps, deaths)

### Create Mode
- **Visual Level Editor**: Intuitive drag-and-drop interface for level creation
- **Rich Entity Palette**: Place players, doors, enemies, coins, spikes, springs, and more
- **Live Preview**: Test your level instantly before publishing
- **Grid-Based Design**: Precise placement with a responsive canvas system
- **Save & Publish**: Share your creations with the entire Reddit community
- **Leaderboard Integration**: Every published level automatically gets a competitive leaderboard

### Game Mechanics
- **Collectibles**: Coins scattered throughout levels
- **Hazards**: Spikes, lava, and patrolling enemies
- **Power-ups**: Springs for extra height and momentum
- **Physics**: Smooth movement with realistic jumping and collision detection
- **Responsive Design**: Seamlessly adapts from desktop to mobile devices

## How we built it

Snooventure leverages modern web technologies integrated with Reddit's Devvit platform:

### Frontend Architecture
- **Devvit Web**: Built using Devvit's Interactive Posts framework
- **React + TypeScript**: Component-based architecture with type safety
- **Phaser 3**: Professional game engine handling physics, rendering, and game loop
- **Vite**: Lightning-fast build system and hot module replacement
- **TailwindCSS**: Utility-first styling for the UI components

### Game Engine Layer
- **Custom Scene Manager**: Separate scenes for home, play, create, and level selection
- **Entity System**: Modular entity architecture for players, enemies, collectibles, and obstacles
- **Collision Detection**: Tile-based collision system with precise hit boxes
- **Animation System**: Sprite-based animations for character movement and effects
- **Audio Manager**: Centralized system for BGM and SFX with volume controls

### Backend & Data
- **Devvit Server**: RESTful API endpoints for level management
- **Redis**: Fast key-value storage for levels, users, and leaderboard data
- **Authentication**: Reddit-native user authentication and authorization
- **Data Models**: Structured schemas for levels, leaderboard entries, and user data

### Level Editor
- **Canvas-based UI**: Interactive grid system with real-time entity placement
- **JSON Serialization**: Levels stored as portable JSON with full game state
- **Validation System**: Ensures levels have required entities (player spawn, exit door)
- **Preview Mode**: Instant playtesting without publishing

### Retro Design System
- **8-bit Typography**: Courier New monospace fonts throughout
- **3D Button Effects**: Inset box shadows creating classic chunky button aesthetics
- **Pixel Art Assets**: Custom-designed sprites with pixelated rendering
- **Consistent Theming**: Unified color palette and visual language across all screens

## Challenges we ran into

### 1. **Phaser Integration with Devvit**
Integrating a full game engine like Phaser into Devvit's block system required careful consideration of lifecycle management, memory cleanup, and React re-rendering behaviors. We had to create custom hooks to properly initialize and destroy Phaser instances.

### 2. **Mobile Performance**
Achieving smooth 60 FPS gameplay on mobile devices while maintaining the editor's responsiveness was challenging. We optimized by implementing efficient collision detection, sprite pooling, and careful state management.

### 3. **Touch Controls**
Designing an intuitive virtual joystick for mobile that doesn't obstruct gameplay required multiple iterations. We balanced button sizes, opacity, and positioning to create comfortable controls for various screen sizes.

### 4. **Level Serialization**
Creating a robust JSON format that captures all level data (entities, positions, properties) while remaining portable and backward-compatible required careful schema design and validation.

### 5. **Leaderboard Race Conditions**
Implementing competitive leaderboards with Redis required handling concurrent submissions, ensuring fair rankings, and preventing duplicate entries—all while maintaining low latency.

### 6. **Responsive Design**
Making both the game and editor work seamlessly across desktop, tablet, and mobile required adaptive UI components and flexible canvas sizing logic.

### 7. **Audio System Complexity**
Web audio APIs have strict autoplay policies. We implemented an audio manager with user interaction detection and proper audio context management to ensure music and sound effects work reliably.

## Accomplishments that we're proud of

### 🎮 **Complete Game Experience**
We built a fully functional platformer from scratch—not just a tech demo, but a polished game with multiple levels, enemies, collectibles, and win conditions.

### 🎨 **Cohesive Retro Aesthetic**
Every component, from the home screen to modals and toolbars, maintains a consistent 8-bit pixel art theme with authentic retro typography and button styles.

### 🛠️ **Powerful Level Editor**
The create mode empowers any redditor to become a game designer with an intuitive, visual editor that requires no coding knowledge.

### 🏆 **Competitive Leaderboards**
Each level automatically tracks the top 5 fastest times, creating natural competition and replayability.

### 📱 **True Cross-Platform**
Snooventure works beautifully on desktop, tablet, and mobile with appropriate controls for each platform.

### 🎵 **Rich Audio Experience**
Dynamic background music and responsive sound effects (jumping, collecting coins, hitting enemies) enhance immersion.

### ⚡ **Performance**
Achieved consistent 60 FPS gameplay even on modest devices through careful optimization.

### 🔐 **Production-Ready**
Implemented proper authentication, error handling, input validation, and data persistence—ready for real users.

## What we learned

### Technical Growth
- **Game Engine Architecture**: Deep understanding of Phaser's scene management, physics systems, and rendering pipeline
- **State Management at Scale**: Handling complex game state, UI state, and server state synchronization
- **Canvas APIs**: Advanced canvas manipulation for the level editor's interactive grid system
- **Web Audio**: Mastering the complexities of browser audio contexts and user interaction requirements

### Platform Insights
- **Devvit's Power**: Reddit's developer platform enables rich, interactive experiences that feel native to the platform
- **Community-First Design**: Building for Reddit means designing for social interaction, sharing, and competition
- **Redis Performance**: Leveraged Redis's speed for real-time leaderboard updates and level retrieval

### Design Lessons
- **Pixel-Perfect Aesthetics**: Creating cohesive retro designs requires attention to typography, shadows, colors, and spacing
- **Mobile-First Challenges**: Touch interfaces need larger targets and different interaction patterns than desktop
- **User-Generated Content**: Providing creative tools requires balancing power with simplicity

### Development Workflow
- **Component Architecture**: Breaking complex systems into reusable, testable components
- **Type Safety**: TypeScript prevented countless bugs during rapid development
- **Iterative Testing**: Multiple test levels helped identify edge cases and physics issues early

## What's next for Snooventure

### Short Term (Next Release)
- **🌟 Featured Levels**: Curated showcase of the best community creations
- **🎯 More Entity Types**: Moving platforms, switches, teleporters, and collectible power-ups
- **🎨 Visual Themes**: Multiple tilesets (forest, cave, space, etc.) for visual variety
- **📊 Enhanced Stats**: Player profiles with completion rates, total coins, and achievements
- **🔄 Level Remixing**: Fork and modify existing levels to create variations

### Medium Term
- **👥 Multiplayer Races**: Real-time competition with ghost players showing friends' runs
- **🏅 Global Leaderboards**: Cross-level rankings for speedrunners
- **🎓 Tutorial System**: Interactive tutorials teaching advanced platforming techniques
- **🎁 Daily Challenges**: Procedurally generated or community-selected daily levels
- **🌐 Level Tags & Search**: Categorize levels by difficulty, theme, or mechanics

### Long Term Vision
- **🎮 Custom Game Modes**: Time trials, coin collection challenges, survival modes
- **🤝 Collaborative Creation**: Multiple users working on levels together
- **🎪 Community Events**: Seasonal competitions, themed creation contests
- **📱 Native Mobile App**: Standalone app experience with offline play
- **🎯 Level Campaigns**: Connected series of levels telling a story
- **💎 Cosmetic Customization**: Custom player skins, particle effects, victory animations

### Community Growth
- **🏆 Creator Recognition**: Highlight prolific level designers
- **📺 Replay System**: Watch and share top leaderboard runs
- **💬 Level Comments**: Feedback and tips on community creations
- **⭐ Rating System**: Help surface the best community content

---

Snooventure proves that Reddit can be more than a discussion platform—it can be a canvas for interactive experiences, creative expression, and genuine community gameplay. We're excited to see how the Reddit community takes this foundation and builds something even more amazing together.

**Play Snooventure, create levels, compete for glory, and join the adventure! 🎮✨**


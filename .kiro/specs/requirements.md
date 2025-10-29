# Project Requirements - DevvitForACM

## Project Overview

A 2D platformer game built for Reddit's Devvit platform, featuring level creation, gameplay, authentication, and leaderboard functionality.

---

## User Stories

### 1. Authentication & User Management

**US-1.1: User Login**
- **As a** Reddit user
- **I want to** log in using my Reddit account
- **So that** my progress and created levels are saved

**Acceptance Criteria:**
- User can authenticate via Reddit OAuth
- Session persists across page refreshes
- User profile information is displayed after login
- Logout functionality clears session

**Edge Cases:**
- Failed authentication shows clear error message
- Network timeout during auth handled gracefully
- Expired tokens automatically refresh

---

### 2. Level Creation (Create Mode)

**US-2.1: Grid-Based Level Editor**
- **As a** level creator
- **I want to** place entities on a grid
- **So that** I can design custom platformer levels

**Acceptance Criteria:**
- Grid system with 60x60px cells
- Entity palette with all game objects (platforms, enemies, coins, etc.)
- Click to place, right-click or second click to remove
- Pan and zoom controls (keyboard + touch)
- Real-time preview of placed entities

**Edge Cases:**
- Cannot place multiple entities in same cell
- Player spawn point is mandatory
- Exit door is mandatory for valid level

**US-2.2: Mobile Level Creation**
- **As a** mobile user
- **I want to** create levels on touch devices
- **So that** I can design levels anywhere

**Acceptance Criteria:**
- Touch panning (single finger drag)
- Pinch-to-zoom gesture support
- Touch-friendly entity palette
- Virtual joystick appears in play mode

**Edge Cases:**
- Accidental touches while zooming don't place entities
- Gesture conflicts resolved (pan vs place)

**US-2.3: Level Testing**
- **As a** level creator
- **I want to** test my level before publishing
- **So that** I can ensure it's playable and fun

**Acceptance Criteria:**
- "Play" button switches to gameplay mode
- All physics and mechanics work in test mode
- "Edit" button returns to creation mode
- Level state preserved between modes

---

### 3. Gameplay

**US-3.1: Player Controls**
- **As a** player
- **I want to** control my character smoothly
- **So that** I can navigate levels precisely

**Acceptance Criteria:**
- Arrow keys / WASD for movement
- Jump height: ~1.8 tiles
- Running animation when moving
- Idle animation when stationary
- Jump animation (launch, air, land)
- Character faces movement direction

**Mobile Controls:**
- Virtual joystick for movement (analog)
- Jump button for jumping
- Smooth responsive touch input

**Edge Cases:**
- Can't jump while in air (no double jump)
- Jump buffering for better feel
- Coyote time for ledge jumps

**US-3.2: Hazards & Obstacles**
- **As a** player
- **I want to** face various challenges
- **So that** levels are engaging and difficult

**Acceptance Criteria:**
- Spikes deal damage on collision (hitbox: 90% width, 70% height)
- Lava kills player on contact
- Enemies patrol platforms and damage on touch
- Enemies turn at platform edges
- Enemies ignore non-ground platforms

**Edge Cases:**
- Spikes only damage at "pointy" part (offset collision)
- Spring cooldown prevents spam bouncing

**US-3.3: Interactive Elements**
- **As a** player
- **I want to** collect items and use mechanics
- **So that** gameplay is varied and rewarding

**Acceptance Criteria:**
- Coins collected on touch (animation + sound)
- Springs bounce player ~3 tiles high
- Door completes level when reached
- Coin idle floating animation

**Edge Cases:**
- Spring has 250ms cooldown
- Door requires player to stand on it
- Collected coins don't respawn

**US-3.4: Game Over & Restart**
- **As a** player
- **I want to** retry after failing
- **So that** I can improve and complete levels

**Acceptance Criteria:**
- Death from spikes/lava/enemies shows game over screen
- "Restart" button respawns at last safe position
- Game over overlay darkens screen
- Player input disabled during game over

**Edge Cases:**
- Falling below world boundary triggers respawn
- Last safe position updates only on stable ground

---

### 4. Level Management

**US-4.1: Save & Load Levels**
- **As a** level creator
- **I want to** save my creations
- **So that** I can share them with others

**Acceptance Criteria:**
- Save level with custom name
- Level data stored in Redis
- Load any saved level by name
- Level list shows all available levels

**Edge Cases:**
- Duplicate names prevented or handled
- Validation ensures level has player + door
- Large levels handled efficiently

**US-4.2: Level Metadata**
- **As a** user
- **I want to** see level information
- **So that** I can choose what to play

**Acceptance Criteria:**
- Level name display
- Creator username
- Creation date
- Play count tracking

---

### 5. Leaderboard

**US-5.1: Score Tracking**
- **As a** competitive player
- **I want to** see high scores
- **So that** I can compete with others

**Acceptance Criteria:**
- Leaderboard per level
- Top 10 scores displayed
- Username + score + date
- Real-time updates

**Edge Cases:**
- Ties handled by timestamp
- Cheating/invalid scores filtered

---

### 6. Audio & Visual Effects

**US-6.1: Sound Effects**
- **As a** player
- **I want to** hear audio feedback
- **So that** actions feel satisfying

**Acceptance Criteria:**
- Jump sound (3 variations)
- Coin collect sound (2 variations)
- Death sound (2 variations)
- Spring bounce sound
- Volume controls in settings

**US-6.2: Animations**
- **As a** player
- **I want to** see smooth animations
- **So that** the game feels polished

**Acceptance Criteria:**
- Player: idle (5 frames), run (3 frames), jump (5 frames)
- Coin: spin (5 frames)
- Enemy: walk (5 frames)
- Smooth transitions between states

---

## Technical Requirements

### Performance
- 60 FPS gameplay on desktop
- 30+ FPS on mobile devices
- Level loading < 1 second
- No memory leaks during extended play

### Compatibility
- Desktop: Chrome, Firefox, Safari, Edge
- Mobile: iOS Safari, Chrome Android
- Touch and mouse input support
- Responsive canvas sizing

### Security
- JWT authentication for API calls
- Input sanitization on level data
- Rate limiting on level saves
- XSS protection

### Accessibility
- Keyboard navigation support
- Clear visual feedback
- Audio can be muted
- High contrast sprites

---

## Non-Functional Requirements

### Scalability
- Support 1000+ concurrent players
- Handle 10,000+ stored levels
- Redis caching for performance

### Maintainability
- Modular code structure
- Comprehensive error handling
- TypeScript for type safety
- ESLint configuration

### Testability
- Unit tests for game logic
- Integration tests for API
- Level validation tests

---

## Out of Scope (Future Iterations)

- Multiplayer functionality
- Level sharing via URL
- Custom entity sprites
- Advanced physics (slopes, moving platforms)
- Achievement system
- Level rating/comments
- Power-ups and collectibles beyond coins
- Mobile app version
- Level export/import


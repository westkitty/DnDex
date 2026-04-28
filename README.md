# DM Hub (DnDex) 🐉

A high-performance, tactical D&D 5e encounter management tool designed for Dungeon Masters. Featuring real-time state synchronization, a full SRD bestiary, and automated combat mechanics.

**Live Application**: [https://westkitty.github.io/DnDex/](https://westkitty.github.io/DnDex/)

## 🚀 Key Features

- **Tactical Bestiary**: 334 SRD monsters with full stats, traits, and legendary resources.
- **Real-Time Persistence**: Automated IndexedDB saving with `BroadcastChannel` multi-tab synchronization.
- **Combat Engine**: Automated concentration saves, legendary action tracking, and round/turn sequencing.
- **Tactical Map**: Canvas-based battle map with grid-snapping tokens and strategic sketching tools.
- **History Engine**: 50-step undo/redo stack with descriptive audit logging.
- **PWA Ready**: Offline support and installable as a desktop/mobile app.

## 🛠️ Technology Stack

- **Frontend**: React 19, Vite, Tailwind CSS
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Storage**: IndexedDB (idb-keyval)
- **Deployment**: GitHub Pages

## 📖 Technical Documentation

For a deep dive into the architecture, state model, and development history, see the [Project Bible](Project_Bible.md).

## 🧑‍💻 Local Development

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Start Dev Server**:
   ```bash
   npm run dev
   ```

3. **Production Build**:
   ```bash
   npm run build
   ```

4. **Deploy to GitHub Pages**:
   ```bash
   npm run deploy
   ```

---
Built with ⚔️ by Antigravity for the DM Hub community.

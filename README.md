# ◆ THE SYSTEM — Solo Leveling Life OS

> *"You have been selected as a Player."*

A personal leveling system inspired by Solo Leveling. Gamify your life with RPG mechanics — daily quests, stat progression, boss fights, achievements, and a shadow army of conquered goals.

## Features

- 🎮 **Player System** — Track 6 core stats (Strength, Intelligence, Charisma, Perception, Vitality, Resolve), level up, and rank from E to S
- ⚔️ **Daily Quests** — Complete daily challenges to earn XP. Miss any and the System enacts a penalty
- 👹 **Boss Fights** — Set 90-day targets and track progress toward major goals
- 🗡️ **Shadow Army** — Every defeated boss becomes a shadow soldier in your army
- 🏆 **Titles & Achievements** — Unlock titles by hitting milestones
- 📊 **Analytics** — Radar chart, weekly XP trends, and activity heatmap
- 🔥 **Streak System** — HARDCORE mode: miss a quest and your streak is wiped + XP is drained
- ☁️ **Cloud Sync** — Optional Supabase sync across devices (magic link auth)
- 📱 **PWA** — Install as an app on any device

## Quick Start

1. Deploy to Vercel:
   ```bash
   vercel --prod
   ```
2. Or open `index.html` locally

## Cloud Sync (Optional)

1. Create a free [Supabase](https://supabase.com) project
2. Run the SQL in `supabase-setup.sql` in the SQL Editor
3. Copy your project URL and anon key into `config.js`

## Tech

Pure HTML + CSS + JavaScript. No framework, no build step, no dependencies (except optional Supabase SDK for cloud sync).

## License

MIT

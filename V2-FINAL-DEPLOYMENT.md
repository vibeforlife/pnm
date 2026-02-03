# 🎲 Poker Night Manager V2 - Final Deployment Package

**All files renamed - No more -v2 confusion!**

---

## 📦 FILES TO DOWNLOAD & UPLOAD (6 Files)

### Upload These HTML Files (Use Exact Names):
1. **index.html** - Landing page
2. **admin.html** - Main admin app (with search & sort!)
3. **viewer.html** - Read-only viewer
4. **wrapped.html** - Year-end review
5. **achievements-enhanced.html** - Enhanced achievements

### Firebase Configuration:
6. **firestore.rules** - Paste into Firebase Console

---

## ✅ ALL INTERNAL LINKS ARE CLEAN

No more -v2 references! All files link correctly:

```
index.html → admin.html (for admins)
index.html → viewer.html (for viewers)
admin.html → wrapped.html (Wrapped tab)
admin.html → achievements-enhanced.html (Achievements tab)
wrapped.html → admin.html (back button)
achievements-enhanced.html → admin.html (back button)
```

---

## 🚀 DEPLOYMENT (3 Steps)

### Step 1: Firebase Rules
1. Go to https://console.firebase.google.com/
2. Project: **pnm-fx2**
3. Firestore Database → Rules tab
4. Paste content from **firestore.rules**
5. Click **Publish**

### Step 2: Upload Files
Upload these 5 HTML files to your web host:
- index.html
- admin.html
- viewer.html
- wrapped.html
- achievements-enhanced.html

**All files use the EXACT names above - no renaming needed!**

### Step 3: Test
1. Open index.html
2. Create/join group
3. Test all features

---

## ✨ V2 FEATURES

### 🎲 Poker Nights Tab:
- **Search:** Type to find by date or location
- **Sort:** Newest/Oldest/Pot Size/Location/Winner
- Rebuy tracking (total buy-in field)
- Live balance check (red/green)
- Expenses tracking
- 3-column settlement

### 👥 Players Tab:
- **Search:** Type to find by name
- **Sort:** Winnings/A-Z/Z-A/Games/Wins/Win Rate
- **Join date** displayed on each card
- Edit/Delete players

### 🏆 Leaderboard Tab:
- **Year filter:** YTD / Lifetime / 2026 / 2025 / 2024...
- Chart updates with year selection
- Rankings update

### 🎖️ Achievements Tab:
- Links to **achievements-enhanced.html**
- Shows basic achievements in admin
- Click "View All →" for enhanced page

### 🎁 Wrapped Tab:
- Links to **wrapped.html**
- Period selector (YTD/Lifetime)
- Player selector
- Fortune cookies (100 sayings)
- Beautiful gradient cards

---

## 🎯 ACHIEVEMENTS-ENHANCED.HTML

**20+ Achievement Types:**
- 🎯 Welcome to Club (1st game)
- 🎲 Veteran Player (10+ games)
- ⭐ Dedication (50+ games)
- 🏆 High Roller (60%+ win rate)
- 🔥 Hot Streak (3+ consecutive wins)
- 💰 Big Winner ($100+ single win)
- 💎 Profit Master ($500+ total)
- 💀 Grim Reaper (eliminate 3+)
- 🔒 Fortress (5+ no bust)
- 🏦 Bankroll Builder (3+ positive months)
- 🎂 1-10 Year Anniversaries

**3 Filter Dropdowns:**
1. **Year:** YTD / Lifetime / Specific years
2. **Player:** All / Alice / Bob / ...
3. **Badge:** All / Welcome to Club / Veteran / ...

---

## 💾 DATA MODEL

### Player Info Tracking:
```json
{
  "playerInfo": {
    "Alice": {
      "dateAdded": "2024-02-01T15:30:00Z"
    }
  }
}
```

**Automatically tracked when:**
- Adding new players in admin.html
- Used for anniversary badges
- Displayed as "Joined: Feb 2024" on player cards

---

## 🎮 USAGE EXAMPLES

### Search Poker Nights:
- Type **"bob"** → Find all nights at Bob's House
- Type **"feb"** → Find February games
- Type **"2024"** → Find 2024 games

### Sort Poker Nights:
- **Pot Size (High-Low)** → Biggest games first
- **Winner (A-Z)** → Grouped by winner
- **Oldest First** → Chronological history

### Search Players:
- Type **"al"** → Find Alice, Albert, etc.

### Sort Players:
- **Win Rate** → Best performers first
- **Games Played** → Most active
- **A-Z** → Alphabetical

### Filter Achievements:
- **Player: Alice** → All Alice's badges
- **Badge: Big Winner** → Everyone who won $100+
- **Year: 2024 + Player: Alice** → Alice's 2024 achievements

---

## 📊 FILE SIZES

| File | Size | Description |
|------|------|-------------|
| index.html | 27KB | Landing page |
| admin.html | 98KB | Main app (largest) |
| viewer.html | 52KB | Read-only |
| wrapped.html | 29KB | Year review |
| achievements-enhanced.html | 25KB | Achievements |
| firestore.rules | <1KB | Security |

**Total: ~230KB for entire app**

---

## ✅ VERIFICATION CHECKLIST

After uploading, verify:
- [ ] index.html loads
- [ ] Can create group
- [ ] Redirects to admin.html (not admin-v2.html)
- [ ] Add player → dateAdded tracked
- [ ] Search boxes work
- [ ] Sort dropdowns work
- [ ] Wrapped tab → Opens wrapped.html
- [ ] Achievements tab → Opens achievements-enhanced.html
- [ ] Back buttons return to admin.html
- [ ] All data saves to Firebase
- [ ] Real-time sync works

---

## 🎉 READY TO DEPLOY!

All files properly named and linked. No more -v2 confusion! 🚀

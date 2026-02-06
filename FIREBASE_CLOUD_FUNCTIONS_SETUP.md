# Firebase Cloud Functions Setup Guide
## Poker Coach AI Analysis Backend

This guide walks you through deploying the backend function that enables AI poker analysis.

---

## Prerequisites

1. **Node.js installed** (version 18 or higher)
   - Check: `node --version`
   - Download from: https://nodejs.org/

2. **Firebase project** (you already have this)
   - Your project ID from Firebase Console

3. **Firebase CLI installed**
   - Install: `npm install -g firebase-tools`
   - Check: `firebase --version`

---

## Step-by-Step Setup

### 1. Install Firebase CLI

```bash
npm install -g firebase-tools
```

### 2. Login to Firebase

```bash
firebase login
```

This opens your browser to authenticate with Google.

### 3. Initialize Cloud Functions

Navigate to your project folder (where your HTML files are):

```bash
cd /path/to/your/poker-night-manager
firebase init functions
```

**Answer the prompts:**
- "Select a default Firebase project" → Choose your existing project
- "What language?" → **JavaScript**
- "Do you want to use ESLint?" → **No** (or Yes, doesn't matter)
- "Do you want to install dependencies now?" → **Yes**

This creates a `functions/` folder.

### 4. Replace the Functions Code

**Delete the generated code:**
```bash
rm functions/index.js
```

**Copy the provided files:**
- Copy `functions/index.js` (from my output)
- Copy `functions/package.json` (from my output)

Both files are in the package I'm giving you.

### 5. Install Dependencies

```bash
cd functions
npm install
```

### 6. Deploy the Function

```bash
firebase deploy --only functions
```

This takes 2-3 minutes. You'll see output like:
```
✔  functions[analyzePokerHand(us-central1)] Successful create operation.
Function URL: https://us-central1-YOUR-PROJECT.cloudfunctions.net/analyzePokerHand
```

**Done!** Your backend is live.

---

## Testing the Function

### Test from Firebase Console:

1. Go to Firebase Console → Functions
2. Find `analyzePokerHand`
3. Click to see details
4. It should show "Active" status

### Test from your app:

1. Open your poker app
2. Go to Poker Coach → Settings
3. Add your Anthropic API key
4. Enable AI Analysis
5. Go to "📸 Analyze Table"
6. Upload a photo
7. Should work now! 🎉

---

## Troubleshooting

### "Failed to deploy"
- Check you're logged into Firebase: `firebase login`
- Check you selected the right project: `firebase use --add`
- Check Node.js version: `node --version` (needs 18+)

### "Function not found"
- Make sure deployment completed successfully
- Check Firebase Console → Functions to see if it's listed
- Try deploying again: `firebase deploy --only functions --force`

### "Still getting CORS error"
- Make sure you're using the updated v4-poker-coach.js (the one I just gave you)
- The new version calls Firebase function, not direct API
- Old cached file might be loading - hard refresh (Ctrl+Shift+R)

### "API key invalid" in function
- Check your API key is correct in app settings
- Make sure it starts with `sk-ant-`
- Try creating a new key in Anthropic Console

---

## Cost Information

### Firebase Cloud Functions - Free Tier:
- **125,000 invocations/month** - FREE
- **40,000 GB-seconds/month** - FREE
- **5 GB outbound data/month** - FREE

For poker nights, you'll use:
- ~10-50 analyses per night
- ~100-500 analyses per month
- **Well within free tier!**

### After Free Tier (unlikely):
- $0.40 per million invocations
- Still incredibly cheap

### Anthropic API Costs (same as before):
- ~$0.01 per analysis
- Billed by Anthropic, not Firebase

---

## File Structure After Setup

```
poker-night-manager/
├── admin.html
├── viewer.html
├── v4-enhancements.js
├── v4-spotify.js
├── v4-poker-coach.js  ← Updated to call Firebase function
├── v4-voting.js
├── firebase.json
└── functions/
    ├── index.js           ← The backend function
    ├── package.json       ← Dependencies
    └── node_modules/      ← Auto-generated
```

---

## Security Notes

### Your API Key is Safe:
- Sent from browser to YOUR Firebase function (encrypted)
- Function calls Anthropic API server-side
- API key never exposed in browser code
- Only your Firebase project can call this function

### Access Control:
The function uses Firebase's built-in authentication. Only users who can access your Firebase project can call it.

If you want stricter control, you can add authentication checks in the function.

---

## Updating the Function

If you need to make changes later:

1. Edit `functions/index.js`
2. Run: `firebase deploy --only functions`
3. Changes live in 2-3 minutes

---

## Next Steps

1. ✅ Install Firebase CLI
2. ✅ Run `firebase init functions` in your project folder
3. ✅ Copy the function files I provided
4. ✅ Run `npm install` in functions folder
5. ✅ Deploy: `firebase deploy --only functions`
6. ✅ Test in your app!

**Estimated time:** 20 minutes for first-time setup

---

## Quick Command Reference

```bash
# Login
firebase login

# Initialize functions
firebase init functions

# Deploy
firebase deploy --only functions

# View logs (for debugging)
firebase functions:log

# Test locally (optional)
firebase emulators:start --only functions
```

---

## Need Help?

Common issues and solutions are in the Troubleshooting section above.

If you get stuck at any step, let me know where and I'll help you through it!

**Ready to deploy? Start with Step 1: Install Firebase CLI** 🚀

# PWA Icons Needed

To complete the "Add to Home Screen" feature, add these 3 icon files to this folder (`/frontend/public/`):

## Required Files:

### 1. `icon-192x192.png`
- **Size:** 192x192 pixels
- **Purpose:** Android home screen icon (required)
- **Format:** PNG with transparency

### 2. `icon-512x512.png`
- **Size:** 512x512 pixels
- **Purpose:** Android splash screen and high-res displays (required)
- **Format:** PNG with transparency

### 3. `apple-touch-icon.png`
- **Size:** 180x180 pixels
- **Purpose:** iOS home screen icon
- **Format:** PNG with transparency

## Design Guidelines:

- **Colors:** Use Besties brand colors (pink #FF69B4, purple #9333EA)
- **Style:** Simple, recognizable at small sizes
- **Background:** Can be solid color or transparent
- **Content:** Logo, heart, or "B" letter work well
- **Safe Area:** Keep important elements in center 80% (edges may be cropped/rounded by OS)

## Quick Design Tips:

1. **Simple is better** - Icons are shown very small on phones
2. **High contrast** - Make sure it stands out on home screens
3. **No text** - Unless it's just one letter like "B"
4. **Test on device** - See how it looks on actual phone

## Testing:

Once you add these files:
1. Commit and push changes
2. Deploy to Firebase
3. Complete a check-in on your phone
4. Tap "Add to Home Screen" when prompted
5. Your branded icon will appear!

## Current Status:

✅ manifest.json configured
✅ iOS meta tags added
✅ "Add to Home Screen" prompt ready
❌ Need icon files (add them to this folder)

## Need Help?

If you need icon design help, you can:
- Use Canva (has templates for app icons)
- Use Figma (export as PNG at exact sizes)
- Hire on Fiverr (search "app icon design")
- Use AI tools like Midjourney/DALL-E

---

**Once you have the icons, just save them in this `/frontend/public/` folder and you're done!**

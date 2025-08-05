# Extension Icons

This directory contains the icon files for the Audecoder browser extension.

## Required Icons

The following icon sizes are required for proper browser extension support:

- `icon-16.png` - 16x16 pixels (toolbar icon, small displays)
- `icon-32.png` - 32x32 pixels (toolbar icon, retina displays)  
- `icon-48.png` - 48x48 pixels (extension management page)
- `icon-128.png` - 128x128 pixels (Chrome Web Store, high resolution displays)

## Icon Guidelines

### Design Requirements
- **Style**: Modern, clean design that represents audio/music processing
- **Colors**: Should work well on both light and dark backgrounds
- **Format**: PNG with transparent background preferred
- **Content**: Should be recognizable at small sizes (16x16)

### Suggested Design Elements
- Audio waveform visualization
- Musical notes or audio symbols
- Sound processing indicators
- Modern, tech-focused aesthetic

### Creating Icons

You can create icons using:
- **Figma/Sketch** - For vector-based design
- **Photoshop/GIMP** - For pixel-perfect editing
- **Online Tools** - Icon generators and converters
- **SVG to PNG** - Convert scalable designs to required formats

### Example SVG Base (for reference)
```svg
<svg width="128" height="128" viewBox="0 0 128 128" xmlns="http://www.w3.org/2000/svg">
  <!-- Audio waveform design -->
  <rect x="20" y="60" width="4" height="8" fill="#00d4ff"/>
  <rect x="28" y="50" width="4" height="28" fill="#00d4ff"/>
  <rect x="36" y="40" width="4" height="48" fill="#00d4ff"/>
  <rect x="44" y="30" width="4" height="68" fill="#00d4ff"/>
  <rect x="52" y="20" width="4" height="88" fill="#ff6b9d"/>
  <rect x="60" y="10" width="4" height="108" fill="#ff6b9d"/>
  <rect x="68" y="20" width="4" height="88" fill="#ff6b9d"/>
  <rect x="76" y="30" width="4" height="68" fill="#00d4ff"/>
  <rect x="84" y="40" width="4" height="48" fill="#00d4ff"/>
  <rect x="92" y="50" width="4" height="28" fill="#00d4ff"/>
  <rect x="100" y="60" width="4" height="8" fill="#00d4ff"/>
</svg>
```

## Current Status

⚠️ **Icons Not Yet Created**

The icon files referenced in `manifest.json` need to be created. Until proper icons are created, the extension may show default/placeholder icons in browsers.

## TODO

- [ ] Create 16x16 icon
- [ ] Create 32x32 icon  
- [ ] Create 48x48 icon
- [ ] Create 128x128 icon
- [ ] Test icon visibility across different browsers
- [ ] Ensure icons work on both light and dark themes

## Contributing Icons

If you would like to contribute icon designs:

1. Follow the design guidelines above
2. Create all required sizes
3. Test in multiple browsers
4. Submit via pull request with icon files
5. Include source files (SVG, PSD, etc.) if possible

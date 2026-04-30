#!/usr/bin/env bash

set -e

PROJECT_DIR="/Users/andrew/Projects/DM_Hub"
APP_DIR="/Applications/DnDex.app"
CONTENTS_DIR="$APP_DIR/Contents"
MACOS_DIR="$CONTENTS_DIR/MacOS"
RESOURCES_DIR="$CONTENTS_DIR/Resources"

echo "Creating directories..."
rm -rf "$APP_DIR"
mkdir -p "$MACOS_DIR"
mkdir -p "$RESOURCES_DIR"

echo "Creating Info.plist..."
cat << 'EOF' > "$CONTENTS_DIR/Info.plist"
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleExecutable</key>
    <string>DnDex</string>
    <key>CFBundleIconFile</key>
    <string>DnDex.icns</string>
    <key>CFBundleIdentifier</key>
    <string>com.andrew.dndex</string>
    <key>CFBundleName</key>
    <string>DnDex</string>
    <key>CFBundlePackageType</key>
    <string>APPL</string>
    <key>CFBundleShortVersionString</key>
    <string>1.0</string>
    <key>CFBundleVersion</key>
    <string>1</string>
</dict>
</plist>
EOF

echo "Creating executable script..."
cat << 'EOF' > "$MACOS_DIR/DnDex"
#!/usr/bin/env bash

export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:$PATH"
PROJECT_DIR="/Users/andrew/Projects/DM_Hub"
LOG_FILE="/Users/andrew/Library/Logs/DnDex-launcher.log"

mkdir -p "$(dirname "$LOG_FILE")"

cd "$PROJECT_DIR" || exit 1

echo "Starting DnDex Launcher at $(date)" >> "$LOG_FILE"

# Check if port 4173 is in use
PORT_4173_PIDS=$(lsof -ti:4173 || true)
if [ -n "$PORT_4173_PIDS" ]; then
    IS_OURS=$(ps -p $PORT_4173_PIDS -o args= | grep "vite preview" || true)
    if [ -n "$IS_OURS" ]; then
        echo "Found existing DnDex instance on port 4173, opening browser..." >> "$LOG_FILE"
        open "http://127.0.0.1:4173/DnDex/"
        exit 0
    else
        PORT=4174
    fi
else
    PORT=4173
fi

echo "Starting Vite preview on port $PORT..." >> "$LOG_FILE"

# Start the preview server in the background
nohup npx vite preview --port "$PORT" --host 127.0.0.1 >> "$LOG_FILE" 2>&1 &
PREVIEW_PID=$!

# Wait briefly
sleep 2

if ps -p $PREVIEW_PID > /dev/null; then
    echo "Started successfully (PID: $PREVIEW_PID). Opening browser..." >> "$LOG_FILE"
    open "http://127.0.0.1:$PORT/DnDex/"
else
    echo "Failed to start Vite preview." >> "$LOG_FILE"
fi
EOF

chmod +x "$MACOS_DIR/DnDex"

echo "Generating icon..."
TMP_ICON_DIR=$(mktemp -d)
SVG_FILE="$TMP_ICON_DIR/icon.svg"

cat << 'EOF' > "$SVG_FILE"
<svg viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
  <defs>
    <radialGradient id="gw-bg-glow" cx="50%" cy="50%" r="60%">
      <stop offset="0%" stop-color="#818cf8" stop-opacity="0.22" />
      <stop offset="100%" stop-color="#818cf8" stop-opacity="0" />
    </radialGradient>
    <radialGradient id="gw-center-glow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#818cf8" stop-opacity="0.35" />
      <stop offset="100%" stop-color="#818cf8" stop-opacity="0" />
    </radialGradient>
  </defs>
  <rect width="512" height="512" rx="96" fill="#05050a" />
  <rect width="512" height="512" rx="96" fill="url(#gw-bg-glow)" />
  <polygon points="256,64 422,160 422,352 256,448 90,352 90,160" fill="none" stroke="#818cf8" stroke-width="11" stroke-linejoin="round" opacity="0.92" />
  <line x1="256" y1="64"  x2="256" y2="256" stroke="#818cf8" stroke-width="5" opacity="0.38" />
  <line x1="422" y1="160" x2="256" y2="256" stroke="#818cf8" stroke-width="5" opacity="0.38" />
  <line x1="422" y1="352" x2="256" y2="256" stroke="#818cf8" stroke-width="5" opacity="0.38" />
  <line x1="256" y1="448" x2="256" y2="256" stroke="#818cf8" stroke-width="5" opacity="0.38" />
  <line x1="90"  y1="352" x2="256" y2="256" stroke="#818cf8" stroke-width="5" opacity="0.38" />
  <line x1="90"  y1="160" x2="256" y2="256" stroke="#818cf8" stroke-width="5" opacity="0.38" />
  <line x1="90" y1="256" x2="422" y2="256" stroke="#818cf8" stroke-width="4" opacity="0.18" />
  <circle cx="256" cy="64"  r="9" fill="#818cf8" opacity="0.75" />
  <circle cx="422" cy="160" r="7" fill="#818cf8" opacity="0.52" />
  <circle cx="422" cy="352" r="7" fill="#818cf8" opacity="0.52" />
  <circle cx="256" cy="448" r="9" fill="#818cf8" opacity="0.75" />
  <circle cx="90"  cy="352" r="7" fill="#818cf8" opacity="0.52" />
  <circle cx="90"  cy="160" r="7" fill="#818cf8" opacity="0.52" />
  <circle cx="256" cy="256" r="44" fill="url(#gw-center-glow)" />
  <circle cx="256" cy="256" r="20" fill="#818cf8" opacity="0.88" />
  <circle cx="256" cy="256" r="9"  fill="white"   opacity="0.92" />
</svg>
EOF

qlmanage -t -s 1024 -o "$TMP_ICON_DIR" "$SVG_FILE" > /dev/null 2>&1 || true
PNG_FILE="$TMP_ICON_DIR/icon.svg.png"

if [ ! -f "$PNG_FILE" ]; then
    echo "Icon generation failed. Creating empty icon."
    touch "$PNG_FILE"
fi

ICONSET_DIR="$TMP_ICON_DIR/DnDex.iconset"
mkdir -p "$ICONSET_DIR"

if [ -f "$PNG_FILE" ] && [ -s "$PNG_FILE" ]; then
    sips -z 16 16     "$PNG_FILE" --out "$ICONSET_DIR/icon_16x16.png" > /dev/null 2>&1
    sips -z 32 32     "$PNG_FILE" --out "$ICONSET_DIR/icon_16x16@2x.png" > /dev/null 2>&1
    sips -z 32 32     "$PNG_FILE" --out "$ICONSET_DIR/icon_32x32.png" > /dev/null 2>&1
    sips -z 64 64     "$PNG_FILE" --out "$ICONSET_DIR/icon_32x32@2x.png" > /dev/null 2>&1
    sips -z 128 128   "$PNG_FILE" --out "$ICONSET_DIR/icon_128x128.png" > /dev/null 2>&1
    sips -z 256 256   "$PNG_FILE" --out "$ICONSET_DIR/icon_128x128@2x.png" > /dev/null 2>&1
    sips -z 256 256   "$PNG_FILE" --out "$ICONSET_DIR/icon_256x256.png" > /dev/null 2>&1
    sips -z 512 512   "$PNG_FILE" --out "$ICONSET_DIR/icon_256x256@2x.png" > /dev/null 2>&1
    sips -z 512 512   "$PNG_FILE" --out "$ICONSET_DIR/icon_512x512.png" > /dev/null 2>&1
    sips -z 1024 1024 "$PNG_FILE" --out "$ICONSET_DIR/icon_512x512@2x.png" > /dev/null 2>&1
    
    iconutil -c icns "$ICONSET_DIR" -o "$RESOURCES_DIR/DnDex.icns"
fi

rm -rf "$TMP_ICON_DIR"

echo "Attempting to add to Dock..."
# Check if dockutil is available
if command -v dockutil &> /dev/null; then
    dockutil --add "$APP_DIR" --no-restart
    killall Dock
    echo "Added to Dock using dockutil."
else
    # Simple Python script to add to dock via defaults if it's not there
    python3 -c "
import plistlib, os, subprocess
dock_plist = os.path.expanduser('~/Library/Preferences/com.apple.dock.plist')
try:
    with open(dock_plist, 'rb') as f:
        plist = plistlib.load(f)
    apps = plist.get('persistent-apps', [])
    found = any('DnDex.app' in item.get('tile-data', {}).get('file-data', {}).get('_CFURLString', '') for item in apps)
    if not found:
        print('Adding to Dock...')
        new_app = {
            'tile-data': {
                'file-data': {
                    '_CFURLString': 'file:///Applications/DnDex.app/',
                    '_CFURLStringType': 15
                }
            },
            'tile-type': 'file-tile'
        }
        apps.append(new_app)
        plist['persistent-apps'] = apps
        with open(dock_plist, 'wb') as f:
            plistlib.dump(plist, f)
        subprocess.run(['killall', 'Dock'])
    else:
        print('Already in Dock.')
except Exception as e:
    print('Failed to modify Dock:', e)
" || echo "Using fallback for Dock. Please drag /Applications/DnDex.app to your Dock manually."
fi

echo "Installation complete: /Applications/DnDex.app"

export const SETUP_SH = `#!/usr/bin/env bash
set -euo pipefail

echo "api.kalpha.kr — Smart Curl installer (dead CLI)"

# Detect OS / distro
OS="unknown"
UNAME=$(uname -s || true)
if [ "$UNAME" = "Darwin" ]; then
  OS="macos"
elif [ "$UNAME" = "Linux" ]; then
  if [ -f /etc/os-release ]; then
    . /etc/os-release
    ID_LOWER=$(echo "\${ID:-}" | tr '[:upper:]' '[:lower:]')
    case "$ID_LOWER" in
      ubuntu|debian) OS="debian" ;;
      arch) OS="arch" ;;
      fedora|centos|rhel) OS="rpm" ;;
      *) OS="linux" ;;
    esac
  else
    OS="linux"
  fi
else
  OS="unknown"
fi

echo "Detected OS: $OS"

# Determine destination for user-install (no root) or system-install (with sudo)
DEST_DIR=""
if [ -w "/usr/local/bin" ]; then
  DEST_DIR="/usr/local/bin"
elif [ -n "\${XDG_BIN_HOME-}" ]; then
  DEST_DIR="\${XDG_BIN_HOME}"
else
  mkdir -p "$HOME/.local/bin"
  DEST_DIR="$HOME/.local/bin"
fi

INSTALL_TARGET="$DEST_DIR/dead"
echo "Installing to: $INSTALL_TARGET"

# Prepare the installed CLI (shell-based) with store/read commands
TMPFILE=$(mktemp /tmp/dead.XXXXXX)
cat > "$TMPFILE" <<'EOF'
#!/usr/bin/env bash
set -euo pipefail

API_URL=\${API_URL:-https://api.kalpha.kr}
# API key can be passed via DEAD_API_KEY env var or DEAD_API_KEY file
AUTH_HEADER=""
if [ -n "\${DEAD_API_KEY-}" ]; then
  AUTH_HEADER="-H 'Authorization: Bearer \${DEAD_API_KEY}'"
fi

usage(){
  cat <<-USAGE
Usage: dead <command> [options]

Commands:
  store [-m MESSAGE]    Store a message (reads stdin if no -m provided)
  read <id>             Read and consume a message by id
  -h, --help            Show help
  --version             Show version
USAGE
}

cmd="$1" || cmd=""
case "$cmd" in
  store)
    shift || true
    MESSAGE=""
    while [ "$#" -gt 0 ]; do
      case "$1" in
        -m) shift; MESSAGE="$1"; shift ;;
        --) shift; break ;;
        *) break ;;
      esac
    done
    # allow positional message: dead store "hello" or -m
    if [ -z "$MESSAGE" ]; then
      if [ "$#" -gt 0 ] && [[ "$1" != -* ]]; then
        MESSAGE="$1"
      else
        if [ -t 0 ]; then
          echo "Enter message, end with Ctrl-D:" >&2
        fi
        MESSAGE=$(cat -)
      fi
    fi
    if [ -z "$MESSAGE" ]; then
      echo "empty message" >&2; exit 2
    fi
    # send as plain text so server will treat body as message
    # post and extract id from json response (try jq -> python3 -> sed)
    if [ -n "\${DEAD_API_KEY-}" ]; then
      RESP=$(curl -sS -X POST "$API_URL/store" -H "Content-Type: text/plain" -H "Authorization: Bearer \${DEAD_API_KEY}" --data-binary "$MESSAGE")
    else
      RESP=$(curl -sS -X POST "$API_URL/store" -H "Content-Type: text/plain" --data-binary "$MESSAGE")
    fi
    extract_id(){
      if command -v jq >/dev/null 2>&1; then
        echo "$RESP" | jq -r '.id'
      elif command -v python3 >/dev/null 2>&1; then
        echo "$RESP" | python3 -c "import sys,json;print(json.load(sys.stdin).get('id',''))"
      else
        echo "$RESP" | sed -n 's/.*"id"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p'
      fi
    }
    ID=$(extract_id)
    echo "$ID"
    ;;
  read)
    shift || true
    ID="$1"
    if [ -z "$ID" ]; then echo "Usage: dead read <id>" >&2; exit 2; fi
    # fetch and print only the message field
    if [ -n "\${DEAD_API_KEY-}" ]; then
      RESP=$(curl -sS "$API_URL/read/$ID" -H "Authorization: Bearer \${DEAD_API_KEY}")
    else
      RESP=$(curl -sS "$API_URL/read/$ID")
    fi
    if command -v jq >/dev/null 2>&1; then
      echo "$RESP" | jq -r '.message'
    elif command -v python3 >/dev/null 2>&1; then
      echo "$RESP" | python3 -c "import sys,json;print(json.load(sys.stdin).get('message',''))"
    else
      echo "$RESP" | sed -n 's/.*"message"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p'
    fi
    ;;
  -h|--help|help|"")
    usage
    ;;
  --version)
    echo "dead 0.1.0"
    ;;
  *)
    echo "Unknown command: $cmd" >&2
    usage
    exit 2
    ;;
esac
EOF

# Install binary
if [ -w "$INSTALL_TARGET" ] || [ -w "$(dirname "$INSTALL_TARGET")" ]; then
  mv "$TMPFILE" "$INSTALL_TARGET"
  chmod +x "$INSTALL_TARGET"
else
  if command -v sudo >/dev/null 2>&1; then
    echo "Requesting sudo to install to $INSTALL_TARGET"
    sudo sh -c "mv '$TMPFILE' '$INSTALL_TARGET' && chmod +x '$INSTALL_TARGET'"
  else
    echo "No permission to write to $INSTALL_TARGET and sudo not available. Installing to $HOME/.local/bin instead."
    mkdir -p "$HOME/.local/bin"
    mv "$TMPFILE" "$HOME/.local/bin/dead"
    chmod +x "$HOME/.local/bin/dead"
    INSTALL_TARGET="$HOME/.local/bin/dead"
  fi
fi

echo "Installed: $INSTALL_TARGET"
if command -v dead >/dev/null 2>&1; then
  echo "Run 'dead --help' to get started."
else
  echo "Note: add $DEST_DIR to your PATH if not already. Example: export PATH=\"$HOME/.local/bin:$PATH\""
fi
`;

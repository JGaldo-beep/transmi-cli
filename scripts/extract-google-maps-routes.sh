#!/usr/bin/env bash
# Extract TransMilenio routes from Google Maps
# Usage: ./extract-google-maps-routes.sh "origin" "destination"

set -e

ORIGIN="$1"
DESTINATION="$2"

if [ -z "$ORIGIN" ] || [ -z "$DESTINATION" ]; then
  echo "Usage: $0 <origin> <destination>"
  exit 1
fi

# Construct Google Maps URL
URL="https://www.google.com/maps/dir/${ORIGIN// /+},+Bogotá/${DESTINATION// /+},+Bogotá/@4.6533,-74.0836,12z/data=!3m1!4b1!4m2!4m1!3e3"

# Open Google Maps
agent-browser open "$URL" >/dev/null 2>&1

# Wait for page to load
agent-browser wait --load networkidle >/dev/null 2>&1

# Extract routes information
ROUTES=$(cat <<'EOF' | agent-browser eval --stdin
(function() {
  const panel = document.querySelector('div[role="main"]');
  if (!panel) {
    return JSON.stringify({ success: false, error: 'Panel not found' });
  }

  const panelText = panel.innerText;

  // Check if route calculation failed
  if (panelText.includes('no pudimos calcular la ruta')) {
    return JSON.stringify({
      success: false,
      error: 'Google Maps no pudo calcular una ruta en transporte público para estas direcciones'
    });
  }

  // Extract all route buttons
  const routeButtons = Array.from(document.querySelectorAll('main button[data-trip-index], main a[data-trip-index]'));

  if (routeButtons.length === 0) {
    // Fallback: parse from panel text
    return JSON.stringify({
      success: true,
      routes: [],
      rawText: panelText.substring(0, 3000)
    });
  }

  const routes = routeButtons.map((btn, index) => {
    const text = btn.innerText || btn.textContent || '';
    return {
      index,
      summary: text.substring(0, 200)
    };
  });

  return JSON.stringify({
    success: true,
    routes,
    fullPanel: panelText
  });
})();
EOF
)

# Close browser
agent-browser close >/dev/null 2>&1

# Output the result
echo "$ROUTES"

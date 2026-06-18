#!/bin/bash
rm -rf public
mkdir -p public
cp -R assets ai-assistant matrix neural calculus probability vector references *.html public/ 2>/dev/null || true
printf "window.aimlConfig = { SUPABASE_URL: '%s', SUPABASE_ANON_KEY: '%s' };\n" "$SUPABASE_URL" "$SUPABASE_ANON_KEY" > public/config.js
printf '{ "SUPABASE_URL": "%s", "SUPABASE_ANON_KEY": "%s" }\n' "$SUPABASE_URL" "$SUPABASE_ANON_KEY" > public/config.json

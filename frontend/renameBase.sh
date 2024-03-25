#/bin/bash

find ./dist -type f -exec sed -i 's|/base_url|'"$VITE_BASE_URL"'|g' {} +

node server.js

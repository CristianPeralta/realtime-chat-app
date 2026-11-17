#!/bin/sh
set -eu

secret_file=/run/session/secret
if [ -z "${SESSION_SECRET:-}" ]; then
  mkdir -p /run/session
  if [ ! -s "$secret_file" ]; then
    node -e "require('fs').writeFileSync(process.argv[1], require('crypto').randomBytes(32).toString('hex'))" "$secret_file"
  fi
  SESSION_SECRET=$(cat "$secret_file")
  export SESSION_SECRET
fi

npm run watch &
exec npm run start

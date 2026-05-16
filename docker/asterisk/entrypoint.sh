#!/usr/bin/env sh
set -eu

if [ ! -f /etc/asterisk/keys/asterisk.pem ]; then
  openssl req -x509 -newkey rsa:2048 -nodes \
    -keyout /etc/asterisk/keys/asterisk.key \
    -out /etc/asterisk/keys/asterisk.crt \
    -days 3650 \
    -subj "/CN=localhost" >/dev/null 2>&1
  cat /etc/asterisk/keys/asterisk.key /etc/asterisk/keys/asterisk.crt > /etc/asterisk/keys/asterisk.pem
  chown asterisk:asterisk /etc/asterisk/keys/asterisk.key /etc/asterisk/keys/asterisk.crt /etc/asterisk/keys/asterisk.pem
  chmod 600 /etc/asterisk/keys/asterisk.key /etc/asterisk/keys/asterisk.pem
fi

exec "$@"

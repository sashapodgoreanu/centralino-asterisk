#!/usr/bin/env sh
set -eu

: "${POSTGRES_HOST:=postgres}"
: "${POSTGRES_PORT:=5432}"
: "${POSTGRES_USER:=asterisk}"
: "${POSTGRES_PASSWORD:=asterisk}"
: "${POSTGRES_DB:=asterisk}"

export PGPASSWORD="$POSTGRES_PASSWORD"

psql_base="psql -v ON_ERROR_STOP=1 -h $POSTGRES_HOST -p $POSTGRES_PORT -U $POSTGRES_USER -d $POSTGRES_DB"

until pg_isready -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U "$POSTGRES_USER" -d "$POSTGRES_DB"; do
  sleep 1
done

$psql_base -c "CREATE TABLE IF NOT EXISTS schema_migrations (version varchar(255) PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now());"

for migration in $(find /migrations -maxdepth 1 -type f -name '*.sql' | sort); do
  version="$(basename "$migration")"
  applied="$($psql_base -tAc "SELECT 1 FROM schema_migrations WHERE version = '$version';")"

  if [ "$applied" = "1" ]; then
    echo "Skipping $version"
    continue
  fi

  echo "Applying $version"
  $psql_base -f "$migration"
  $psql_base -c "INSERT INTO schema_migrations (version) VALUES ('$version');"
done

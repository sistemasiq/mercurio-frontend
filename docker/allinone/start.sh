#!/bin/sh
# Arranque de la imagen todo-en-uno: prepara /data y levanta los 4 procesos.
set -eu

PG_BIN=$(ls -d /usr/lib/postgresql/*/bin | sort -V | tail -1)
export PG_BIN

mkdir -p /data/postgres /data/minio
chown -R postgres:postgres /data/postgres
chmod 700 /data/postgres

# Primera vez: inicializa el cluster de PostgreSQL con el usuario y la BD de la app.
if [ ! -s /data/postgres/PG_VERSION ]; then
    echo "[woowkids] Inicializando PostgreSQL en /data/postgres"
    printf '%s' "$POSTGRES_PASSWORD" >/tmp/pgpass
    chown postgres /tmp/pgpass
    su postgres -s /bin/sh -c "$PG_BIN/initdb -D /data/postgres -U '$POSTGRES_USER' \
        --pwfile=/tmp/pgpass --auth=scram-sha-256 --encoding=UTF8 >/dev/null"
    rm -f /tmp/pgpass
    su postgres -s /bin/sh -c "$PG_BIN/pg_ctl -D /data/postgres -o '-c listen_addresses=127.0.0.1' -w start >/dev/null"
    PGPASSWORD="$POSTGRES_PASSWORD" psql -h 127.0.0.1 -U "$POSTGRES_USER" -d postgres -q \
        -c "CREATE DATABASE \"$POSTGRES_DB\""
    su postgres -s /bin/sh -c "$PG_BIN/pg_ctl -D /data/postgres -m fast -w stop >/dev/null"
fi

exec supervisord -c /etc/woowkids/supervisord.conf

#!/usr/bin/env bash
set -euo pipefail

# Migra el contenido de una base local MySQL hacia Clever Cloud
# y luego ejecuta una normalizacion post-import.

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FIX_SQL="$ROOT_DIR/src/db/004_post_import_normalize.sql"
TMP_DUMP="${TMP_DUMP:-$ROOT_DIR/tmp_local_dump.sql}"

LOCAL_DB_HOST="${LOCAL_DB_HOST:-127.0.0.1}"
LOCAL_DB_PORT="${LOCAL_DB_PORT:-3306}"
LOCAL_DB_USER="${LOCAL_DB_USER:-root}"
LOCAL_DB_PASSWORD="${LOCAL_DB_PASSWORD:-}"
LOCAL_DB_NAME="${LOCAL_DB_NAME:-bookmarks}"

CLEVER_DB_HOST="${CLEVER_DB_HOST:-}"
CLEVER_DB_PORT="${CLEVER_DB_PORT:-3306}"
CLEVER_DB_USER="${CLEVER_DB_USER:-}"
CLEVER_DB_PASSWORD="${CLEVER_DB_PASSWORD:-}"
CLEVER_DB_NAME="${CLEVER_DB_NAME:-}"

if [[ -z "$CLEVER_DB_HOST" || -z "$CLEVER_DB_USER" || -z "$CLEVER_DB_PASSWORD" || -z "$CLEVER_DB_NAME" ]]; then
  echo "Faltan variables de destino Clever Cloud."
  echo "Defini: CLEVER_DB_HOST, CLEVER_DB_PORT, CLEVER_DB_USER, CLEVER_DB_PASSWORD, CLEVER_DB_NAME"
  exit 1
fi

if [[ ! -f "$FIX_SQL" ]]; then
  echo "No se encontro SQL de normalizacion: $FIX_SQL"
  exit 1
fi

echo "[1/4] Exportando base local ${LOCAL_DB_NAME} ..."
MYSQL_PWD="$LOCAL_DB_PASSWORD" mysqldump \
  -h "$LOCAL_DB_HOST" \
  -P "$LOCAL_DB_PORT" \
  -u "$LOCAL_DB_USER" \
  --single-transaction \
  --routines \
  --triggers \
  --no-tablespaces \
  "$LOCAL_DB_NAME" > "$TMP_DUMP"

echo "[2/4] Importando dump en Clever Cloud ${CLEVER_DB_NAME} ..."
MYSQL_PWD="$CLEVER_DB_PASSWORD" mysql \
  -h "$CLEVER_DB_HOST" \
  -P "$CLEVER_DB_PORT" \
  -u "$CLEVER_DB_USER" \
  "$CLEVER_DB_NAME" < "$TMP_DUMP"

echo "[3/4] Ejecutando normalizacion post-import ..."
MYSQL_PWD="$CLEVER_DB_PASSWORD" mysql \
  -h "$CLEVER_DB_HOST" \
  -P "$CLEVER_DB_PORT" \
  -u "$CLEVER_DB_USER" \
  "$CLEVER_DB_NAME" < "$FIX_SQL"

echo "[4/4] Limpieza de dump temporal ..."
rm -f "$TMP_DUMP"

echo "Migracion finalizada con exito."

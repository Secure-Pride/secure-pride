#!/usr/bin/env bash
# /usr/local/sbin/refresh-wifi-crl
# Fetch the Wi-Fi CA's revocation list, check it is genuine, and install
# it where FreeRADIUS looks. Safe to run as often as you like.
set -euo pipefail

CA_URL="${CA_URL:-https://ca.example.internal:9443}"
WIFI_DIR="/etc/freeradius/3.0/certs/wifi"
CA_D="$WIFI_DIR/ca.d"

work="$(mktemp -d)"
trap 'rm -rf "$work"' EXIT

curl --fail --silent --show-error --max-time 30 \
  --cacert "$CA_D/root.pem" \
  -o "$work/crl.der" "$CA_URL/crl"

openssl crl -inform DER -in "$work/crl.der" -out "$work/crl.pem"

# Refuse a list that was not signed by our own CA.
openssl crl -in "$work/crl.pem" -noout -CAfile "$WIFI_DIR/ca.pem" 2>&1 \
  | grep -q "verify OK" || { echo "CRL signature check failed" >&2; exit 1; }

install -m 0644 -o root -g freerad "$work/crl.pem" "$CA_D/crl.pem.new"
mv -f "$CA_D/crl.pem.new" "$CA_D/crl.pem"
openssl rehash "$CA_D"
echo "CRL refreshed: $(openssl crl -in "$CA_D/crl.pem" -noout -nextupdate)"

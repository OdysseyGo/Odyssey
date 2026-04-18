#!/usr/bin/env bash
# Odyssey Payment API Test Script
# Usage: ./test_payments.sh <username> <password>

BASE_URL="http://localhost:8000"
USERNAME=${1:-"rodi"}
PASSWORD=${2:-"rodi1234"}

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

pass() { echo -e "${GREEN}[PASS]${NC} $1"; }
fail() { echo -e "${RED}[FAIL]${NC} $1"; }
info() { echo -e "${YELLOW}[INFO]${NC} $1"; }
section() { echo -e "\n${YELLOW}=== $1 ===${NC}"; }

# ── Login ────────────────────────────────────────────────────────────────────
section "Authentication"
LOGIN=$(curl -s -X POST "$BASE_URL/api/users/login/" \
  -H "Content-Type: application/json" \
  -d "{\"username\": \"$USERNAME\", \"password\": \"$PASSWORD\"}")

TOKEN=$(echo "$LOGIN" | python3 -c "import sys,json; print(json.load(sys.stdin).get('access',''))" 2>/dev/null)

if [ -z "$TOKEN" ]; then
  fail "Login failed. Response: $LOGIN"
  exit 1
fi
pass "Login successful (user: $USERNAME)"

AUTH="-H \"Authorization: Bearer $TOKEN\""

# helper: authenticated GET
get() {
  curl -s "$BASE_URL$1" -H "Authorization: Bearer $TOKEN"
}

# helper: authenticated POST
post() {
  curl -s -X POST "$BASE_URL$1" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "$2"
}

# ── Plans ────────────────────────────────────────────────────────────────────
section "Subscription Plans"
PLANS=$(get "/api/payments/plans/")
MONTHLY=$(echo "$PLANS" | python3 -c "
import sys, json
d = json.load(sys.stdin)
plans = d if isinstance(d, list) else d.get('results', [])
m = next((p for p in plans if p.get('plan') == 'MONTHLY'), None)
print(m.get('price_display','') if m else '')
" 2>/dev/null)
if [ -n "$MONTHLY" ]; then
  pass "Plans endpoint OK — Monthly: $MONTHLY"
else
  fail "Plans endpoint failed. Response: $PLANS"
fi

# ── AI Allowance ─────────────────────────────────────────────────────────────
section "AI Generation Allowance"
ALLOWANCE=$(get "/api/payments/ai-allowance/")
USED=$(echo "$ALLOWANCE" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('used','?'))" 2>/dev/null)
LIMIT=$(echo "$ALLOWANCE" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('limit','?'))" 2>/dev/null)
UNLIMITED=$(echo "$ALLOWANCE" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('unlimited','?'))" 2>/dev/null)
if [ "$USED" != "?" ]; then
  pass "AI allowance OK — used: $USED / $LIMIT, unlimited: $UNLIMITED"
else
  fail "AI allowance endpoint failed. Response: $ALLOWANCE"
fi

# ── Credit Balance ────────────────────────────────────────────────────────────
section "Credit Balance"
BALANCE=$(get "/api/payments/credits/balance/")
CREDITS=$(echo "$BALANCE" | python3 -c "
import sys, json
d = json.load(sys.stdin)
v = d.get('credits', d.get('balance', '?'))
print(v)
" 2>/dev/null)
if [ "$CREDITS" != "?" ]; then
  pass "Credit balance OK — credits: $CREDITS"
else
  fail "Credit balance endpoint failed. Response: $BALANCE"
fi

# ── Credit Packs ─────────────────────────────────────────────────────────────
section "Credit Packs"
PACKS=$(get "/api/payments/credit-packs/")
PACK_COUNT=$(echo "$PACKS" | python3 -c "import sys,json; d=json.load(sys.stdin); print(len(d) if isinstance(d,list) else 0)" 2>/dev/null)
if [ "$PACK_COUNT" -gt 0 ] 2>/dev/null; then
  pass "Credit packs OK — $PACK_COUNT pack(s) available"
  echo "$PACKS" | python3 -c "
import sys, json
packs = json.load(sys.stdin)
for p in packs:
    print(f\"    - {p['name']}: {p['credits']} credits\")
" 2>/dev/null
else
  fail "No credit packs found (have you seeded them?). Response: $PACKS"
fi

# ── Subscription Status ───────────────────────────────────────────────────────
section "Subscription Status"
SUB=$(get "/api/payments/subscription/")
STATUS=$(echo "$SUB" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('status', d.get('detail','none')))" 2>/dev/null)
pass "Subscription status: $STATUS"

# ── Subscribe Checkout ────────────────────────────────────────────────────────
section "Subscription Checkout URL"
CHECKOUT=$(post "/api/payments/subscribe/" '{"plan": "MONTHLY"}')
URL=$(echo "$CHECKOUT" | python3 -c "import sys,json; print(json.load(sys.stdin).get('checkout_url',''))" 2>/dev/null)
if [[ "$URL" == https://checkout.stripe.com* ]]; then
  pass "Checkout URL generated successfully"
  info "Open this URL in your browser and pay with card 4242 4242 4242 4242:"
  echo "  $URL"
else
  fail "Checkout URL failed. Response: $CHECKOUT"
fi

# ── Credit Balance (with transactions) ───────────────────────────────────────
section "Transaction History"
BAL=$(get "/api/payments/credits/balance/")
TXN_COUNT=$(echo "$BAL" | python3 -c "
import sys, json
d = json.load(sys.stdin)
txns = d.get('recent_transactions', [])
print(len(txns))
" 2>/dev/null)
pass "Recent transactions: $TXN_COUNT"

# ── Creator Earnings (only for creator users) ─────────────────────────────────
section "Creator Earnings"
EARNINGS=$(get "/api/payments/creator/earnings/")
HAS_ERROR=$(echo "$EARNINGS" | python3 -c "import sys,json; d=json.load(sys.stdin); print('detail' in d)" 2>/dev/null)
if [ "$HAS_ERROR" = "True" ]; then
  info "Creator earnings skipped (user is not a creator)"
else
  pass "Creator earnings OK: $EARNINGS"
fi

echo -e "\n${GREEN}Done.${NC}"

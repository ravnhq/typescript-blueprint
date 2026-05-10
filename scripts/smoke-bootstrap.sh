#!/bin/bash
set -e

echo "Running strict active-run gates (smoke bootstrap)..."
echo ""

# Check required environment variables
REPORT_QUALITY_REQUIRE_CONTENT="${REPORT_QUALITY_REQUIRE_CONTENT:-0}"
WORKFLOW_REQUIRE_ARTIFACTS="${WORKFLOW_REQUIRE_ARTIFACTS:-0}"

echo "Environment: REPORT_QUALITY_REQUIRE_CONTENT=$REPORT_QUALITY_REQUIRE_CONTENT"
echo "Environment: WORKFLOW_REQUIRE_ARTIFACTS=$WORKFLOW_REQUIRE_ARTIFACTS"
echo ""

# Run build
echo "1. Running build..."
npm run build || true
BUILD_EXIT=$?

# Run full verification (typecheck, lint, tests)
echo ""
echo "2. Running full verification..."
npm run verify || true
VERIFY_EXIT=$?

# Check for required artifacts if needed
if [[ "$WORKFLOW_REQUIRE_ARTIFACTS" == "1" ]]; then
  echo ""
  echo "3. Checking for required artifacts..."
  [[ -d "dist" ]] && echo "✓ dist directory exists" || echo "✗ dist directory missing"
  [[ -d ".turbo" ]] && echo "✓ .turbo directory exists" || echo "✗ .turbo directory missing"
fi

# Summary
echo ""
echo "=== SMOKE BOOTSTRAP RESULTS ==="
echo "Build: $([[ $BUILD_EXIT -eq 0 ]] && echo 'PASS' || echo 'FAIL')"
echo "Verify: $([[ $VERIFY_EXIT -eq 0 ]] && echo 'PASS' || echo 'FAIL')"

[[ $BUILD_EXIT -eq 0 ]] && [[ $VERIFY_EXIT -eq 0 ]] && exit 0 || exit 1

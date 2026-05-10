#!/bin/bash
set -e

echo "Running canonical verification gates..."
echo ""

# Run typecheck
echo "1. Running typecheck..."
npm run typecheck || true
TYPECHECK_EXIT=$?

# Run lint
echo ""
echo "2. Running lint..."
npm run lint || true
LINT_EXIT=$?

# Run unit tests
echo ""
echo "3. Running unit tests..."
npm run test:unit || true
TEST_EXIT=$?

# Run format check
echo ""
echo "4. Running format check..."
npm run format:check || true
FORMAT_EXIT=$?

# Run AI tooling check
echo ""
echo "5. Running AI tooling check..."
npm run test:ai-tooling || true
AI_EXIT=$?

echo ""
echo "=== VERIFICATION GATE RESULTS ==="
echo "Typecheck: $([[ $TYPECHECK_EXIT -eq 0 ]] && echo 'PASS' || echo 'FAIL')"
echo "Lint: $([[ $LINT_EXIT -eq 0 ]] && echo 'PASS' || echo 'FAIL')"
echo "Unit Tests: $([[ $TEST_EXIT -eq 0 ]] && echo 'PASS' || echo 'FAIL')"
echo "Format Check: $([[ $FORMAT_EXIT -eq 0 ]] && echo 'PASS' || echo 'FAIL')"
echo "AI Tooling: $([[ $AI_EXIT -eq 0 ]] && echo 'PASS' || echo 'FAIL')"

# Exit with failure if any check failed
[[ $TYPECHECK_EXIT -eq 0 ]] && [[ $LINT_EXIT -eq 0 ]] && [[ $TEST_EXIT -eq 0 ]] && [[ $FORMAT_EXIT -eq 0 ]] && [[ $AI_EXIT -eq 0 ]] && exit 0 || exit 1

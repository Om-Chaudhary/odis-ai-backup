#!/bin/bash

# Ralph Wiggum - Start New Plan
# Archives previous work and creates fresh plan.md and activity.md

set -e

FEATURE_NAME="$1"

if [ -z "$FEATURE_NAME" ]; then
  echo "Usage: $0 <feature-name>"
  echo "Example: $0 vapi-webhook"
  exit 1
fi

TIMESTAMP=$(date +%Y-%m-%d)
ARCHIVE_DIR="plans/completed"
SCREENSHOTS_ARCHIVE="screenshots-archive"

# Create archive directories if they don't exist
mkdir -p "$ARCHIVE_DIR"
mkdir -p "$SCREENSHOTS_ARCHIVE"

echo "🗂️  Archiving previous Ralph run..."

# Archive plan.md if it exists and is not the template
if [ -f "plan.md" ] && ! cmp -s "plan.md" "plan-template.md"; then
  mv plan.md "$ARCHIVE_DIR/$TIMESTAMP-$FEATURE_NAME-plan.md"
  echo "✓ Archived plan.md → $ARCHIVE_DIR/$TIMESTAMP-$FEATURE_NAME-plan.md"
else
  echo "⊘ No active plan.md to archive"
fi

# Archive activity.md if it exists and has content
if [ -f "activity.md" ] && [ -s "activity.md" ]; then
  mv activity.md "$ARCHIVE_DIR/$TIMESTAMP-$FEATURE_NAME-activity.md"
  echo "✓ Archived activity.md → $ARCHIVE_DIR/$TIMESTAMP-$FEATURE_NAME-activity.md"
else
  echo "⊘ No active activity.md to archive"
fi

# Archive screenshots if directory exists and has files
if [ -d "screenshots" ] && [ "$(ls -A screenshots)" ]; then
  mv screenshots "$SCREENSHOTS_ARCHIVE/$TIMESTAMP-$FEATURE_NAME"
  echo "✓ Archived screenshots → $SCREENSHOTS_ARCHIVE/$TIMESTAMP-$FEATURE_NAME/"
else
  echo "⊘ No screenshots to archive"
fi

echo ""
echo "📝 Creating fresh workspace..."

# Create fresh plan.md from template
cp plan-template.md plan.md
echo "✓ Created plan.md from template"

# Create fresh activity.md from template
cp activity-template.md activity.md
echo "✓ Created activity.md from template"

# Create screenshots directory
mkdir -p screenshots
echo "✓ Created screenshots/ directory"

echo ""
echo "✨ Ready for new Ralph run!"
echo ""
echo "Next steps:"
echo "  1. Edit plan.md with your tasks: code plan.md"
echo "  2. Test Ralph with 5 iterations: ./ralph.sh 5"
echo "  3. Run full loop: ./ralph.sh 20"

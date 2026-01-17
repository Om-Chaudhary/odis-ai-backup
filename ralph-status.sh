#!/bin/bash

# Ralph Wiggum - Check Status
# Shows current progress of active Ralph run

echo "📊 Ralph Wiggum Status"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check if plan.md exists
if [ ! -f "plan.md" ]; then
  echo "❌ No active plan.md found"
  echo ""
  echo "Create a new plan with: ./ralph-new.sh <feature-name>"
  exit 1
fi

# Count total tasks
TOTAL_TASKS=$(grep -c '"passes":' plan.md 2>/dev/null || echo "0")

# Count completed tasks
COMPLETED_TASKS=$(grep -c '"passes": true' plan.md 2>/dev/null || echo "0")

# Count remaining tasks
REMAINING_TASKS=$((TOTAL_TASKS - COMPLETED_TASKS))

# Calculate percentage
if [ "$TOTAL_TASKS" -gt 0 ]; then
  PERCENTAGE=$((COMPLETED_TASKS * 100 / TOTAL_TASKS))
else
  PERCENTAGE=0
fi

echo "Progress: $COMPLETED_TASKS / $TOTAL_TASKS tasks completed ($PERCENTAGE%)"
echo ""

# Show progress bar
BAR_LENGTH=40
FILLED=$((COMPLETED_TASKS * BAR_LENGTH / TOTAL_TASKS))
EMPTY=$((BAR_LENGTH - FILLED))

printf "["
printf "%${FILLED}s" | tr ' ' '█'
printf "%${EMPTY}s" | tr ' ' '░'
printf "]\n"
echo ""

# Show current task (first with "passes": false)
echo "Current Task:"
CURRENT_TASK=$(grep -A 2 '"passes": false' plan.md | head -3 | grep '"description"' | head -1 | sed 's/.*"description": "\(.*\)",/\1/')

if [ -n "$CURRENT_TASK" ]; then
  echo "  → $CURRENT_TASK"
else
  echo "  ✅ All tasks complete!"
fi

echo ""

# Show recent activity
if [ -f "activity.md" ]; then
  echo "Recent Activity:"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  tail -15 activity.md | grep -v '^$' | tail -10
else
  echo "No activity.md found"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Show quick actions
echo ""
echo "Quick Actions:"
echo "  View full activity:     less activity.md"
echo "  View full plan:         less plan.md"
echo "  Continue Ralph:         ./ralph.sh 10"
echo "  View screenshots:       ls -lh screenshots/"
echo "  Check quality:          pnpm check"

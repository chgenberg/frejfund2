#!/bin/bash

echo "🚀 FrejFund Readiness Tree Deployment Script"
echo "=============================================="
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Phase 1: Database Migration
echo -e "${BLUE}PHASE 1: Database Migration${NC}"
echo "Running Prisma migration..."
cd /Users/christophergenberg/Desktop/frejfund-2.0

if npx prisma migrate dev --name add_readiness_tree; then
    echo -e "${GREEN}✅ Database migration successful${NC}"
else
    echo -e "${RED}❌ Database migration failed${NC}"
    exit 1
fi

echo ""

# Phase 2: Verify Files
echo -e "${BLUE}PHASE 2: Verifying Code Files${NC}"

files=(
    "src/lib/readiness-tree-builder.ts"
    "src/app/api/readiness-tree/route.ts"
    "src/components/ReadinessTreeViewer.tsx"
    "src/components/ReadinessActionPlanner.tsx"
)

all_exist=true
for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✅ $file exists${NC}"
    else
        echo -e "${RED}❌ $file missing${NC}"
        all_exist=false
    fi
done

if [ "$all_exist" = false ]; then
    echo -e "${RED}Some files are missing!${NC}"
    exit 1
fi

echo ""

# Phase 3: Type Check
echo -e "${BLUE}PHASE 3: Type Checking${NC}"
if npx tsc --noEmit; then
    echo -e "${GREEN}✅ TypeScript compilation successful${NC}"
else
    echo -e "${RED}❌ TypeScript compilation failed${NC}"
    exit 1
fi

echo ""

# Phase 4: Build Check
echo -e "${BLUE}PHASE 4: Building Project${NC}"
if npm run build; then
    echo -e "${GREEN}✅ Next.js build successful${NC}"
else
    echo -e "${RED}❌ Next.js build failed${NC}"
    exit 1
fi

echo ""

# Summary
echo -e "${GREEN}════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ ALL PHASES COMPLETE!${NC}"
echo -e "${GREEN}════════════════════════════════════════${NC}"
echo ""
echo "Next steps:"
echo "1. Start dev server: npm run dev"
echo "2. Open http://localhost:3000"
echo "3. Edit src/app/analysis/page.tsx to integrate components"
echo "4. Test the flow end-to-end"
echo "5. Deploy: git push origin main"
echo ""
echo "For detailed instructions, see DEPLOYMENT_GUIDE.md"

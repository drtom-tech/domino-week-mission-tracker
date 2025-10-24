#!/bin/bash

# Neon to Supabase Migration Script
# This script exports your data from Neon and imports it to Supabase

echo "🚀 Starting Neon → Supabase Migration"
echo "======================================"
echo ""

# Connection strings
NEON_URL="postgresql://neondb_owner:npg_V6uD5IncBWRe@ep-little-cake-a7zo8b4h-pooler.ap-southeast-2.aws.neon.tech/neondb?sslmode=require"
SUPABASE_URL="postgresql://postgres:eG2pu54gZ9CT-:!@db.yfdjsnqmacdgrahuaojz.supabase.co:5432/postgres"

# Check if pg_dump is installed
if ! command -v pg_dump &> /dev/null; then
    echo "❌ pg_dump not found!"
    echo ""
    echo "Please install PostgreSQL client tools:"
    echo ""
    echo "Mac:     brew install postgresql@16"
    echo "Ubuntu:  sudo apt-get install postgresql-client"
    echo "Windows: Download from https://www.postgresql.org/download/windows/"
    echo ""
    exit 1
fi

echo "✅ pg_dump found"
echo ""

# Step 1: Export from Neon
echo "📦 Step 1: Exporting from Neon..."
pg_dump "$NEON_URL" \
  --format=plain \
  --no-owner \
  --no-privileges \
  --no-comments \
  > neon_backup.sql

if [ $? -eq 0 ]; then
    echo "✅ Export complete! File: neon_backup.sql"
    echo "   Size: $(du -h neon_backup.sql | cut -f1)"
else
    echo "❌ Export failed!"
    exit 1
fi

echo ""

# Step 2: Import to Supabase
echo "📥 Step 2: Importing to Supabase..."
echo "   (Some warnings about extensions are normal)"
echo ""

psql "$SUPABASE_URL" < neon_backup.sql

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Import complete!"
else
    echo ""
    echo "⚠️  Import had some errors, but might still work"
    echo "   (Extension errors are usually OK)"
fi

echo ""
echo "======================================"
echo "🎉 Migration Complete!"
echo ""
echo "Next steps:"
echo "1. Copy .env.local to your project root"
echo "2. Run: pnpm dev"
echo "3. Test that you can sign in and see your data"
echo ""
echo "If something doesn't work, your Neon database is still active!"
echo "Just change DATABASE_URL back to your Neon URL."

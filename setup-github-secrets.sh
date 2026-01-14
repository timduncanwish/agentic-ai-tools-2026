#!/bin/bash

# GitHub Actions Setup Script for Vercel Deployment

echo "==================================="
echo "GitHub Actions + Vercel Setup"
echo "==================================="
echo ""

# Vercel Project Configuration
VERCEL_PROJECT_ID="prj_iH0w8t1TmHLO7VtnYZpEbwSrwd3L"
VERCEL_ORG_ID="team_9nhAFRJ5CGA9jVP8FiEdrgOI"
REPO_OWNER="timduncanwish"
REPO_NAME="agentic-ai-tools-2026"

echo "📋 Vercel Project Information:"
echo "  Project ID: $VERCEL_PROJECT_ID"
echo "  Org ID: $VERCEL_ORG_ID"
echo "  Repository: $REPO_OWNER/$REPO_NAME"
echo ""

echo "🔑 Step 1: Get your Vercel Token"
echo "-----------------------------------"
echo "1. Visit: https://vercel.com/account/tokens"
echo "2. Click 'Create Token'"
echo "3. Name it: 'GitHub Actions'"
echo "4. Scope: Full Account"
echo "5. Copy the generated token"
echo ""
read -p "Paste your Vercel Token here: " VERCEL_TOKEN

echo ""
echo "🔐 Step 2: Setting GitHub Secrets..."
echo "-----------------------------------"

# Add secrets to GitHub repository
export PATH="$PATH:/c/Program Files/GitHub CLI"

# Set Vercel Token
echo "Adding VERCEL_TOKEN..."
gh secret set VERCEL_TOKEN -b"$VERCEL_TOKEN" --repo "$REPO_OWNER/$REPO_NAME"

# Set Vercel Project ID
echo "Adding VERCEL_PROJECT_ID..."
gh secret set VERCEL_PROJECT_ID -b"$VERCEL_PROJECT_ID" --repo "$REPO_OWNER/$REPO_NAME"

# Set Vercel Org ID
echo "Adding VERCEL_ORG_ID..."
gh secret set VERCEL_ORG_ID -b"$VERCEL_ORG_ID" --repo "$REPO_OWNER/$REPO_NAME"

echo ""
echo "✅ Secrets configured successfully!"
echo "-----------------------------------"
echo ""
echo "🔍 Verify secrets:"
gh secret list --repo "$REPO_OWNER/$REPO_NAME"

echo ""
echo "🎉 Setup complete! Next steps:"
echo "1. Run: git add .github/workflows/"
echo "2. Run: git commit -m 'Add GitHub Actions for auto-deployment'"
echo "3. Run: git push origin main"
echo "4. Check: https://github.com/$REPO_OWNER/$REPO_NAME/actions"

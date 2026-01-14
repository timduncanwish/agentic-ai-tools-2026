#!/usr/bin/env node
/**
 * Simplified deployment script for TrendRush
 * Deploys static site to Vercel
 */

const { execSync } = require('child_process');
const fs = require('fs').promises;
const path = require('path');

console.log('🚀 TrendRush Deployment Script\n');

async function deploy() {
    try {
        // Check if dist directory exists
        const distPath = path.join(__dirname, 'dist');
        try {
            await fs.access(distPath);
        } catch {
            console.error('❌ dist directory not found. Please build the site first.');
            process.exit(1);
        }

        // Check if Vercel CLI is installed
        console.log('📦 Checking Vercel CLI...');
        try {
            execSync('vercel --version', { stdio: 'inherit' });
            console.log('✅ Vercel CLI found\n');
        } catch {
            console.log('⚠️  Vercel CLI not found. Installing...\n');
            execSync('npm install -g vercel', { stdio: 'inherit' });
            console.log('✅ Vercel CLI installed\n');
        }

        // Create vercel.json configuration
        console.log('📝 Creating Vercel configuration...');
        const vercelConfig = {
            version: 2,
            name: 'agentic-ai-tools-2026',
            buildCommand: 'echo "Static site - no build needed"',
            outputDirectory: 'dist',
            public: true,
            routes: [
                {
                    src: '/(.*)',
                    dest: '/$1'
                }
            ]
        };

        await fs.writeFile(
            path.join(__dirname, 'vercel.json'),
            JSON.stringify(vercelConfig, null, 2)
        );
        console.log('✅ Configuration created\n');

        // Deploy to Vercel
        console.log('📤 Deploying to Vercel...');
        console.log('=====================================\n');

        // Ask if production or preview
        const isProd = process.argv.includes('--prod') || process.argv.includes('-p');

        const deployCmd = isProd
            ? 'vercel --prod'
            : 'vercel';

        execSync(deployCmd, {
            cwd: __dirname,
            stdio: 'inherit'
        });

        console.log('\n=====================================');
        console.log('✅ Deployment complete!\n');

        console.log('📋 Next Steps:');
        console.log('1. Test your deployed site');
        console.log('2. Submit sitemap to Google Search Console:');
        console.log('   https://search.google.com/search-console');
        console.log('3. Submit sitemap to Bing Webmaster Tools:');
        console.log('   https://www.bing.com/webmasters');
        console.log('4. Add Google Analytics tracking');
        console.log('5. Set up AdSense for monetization\n');

    } catch (error) {
        console.error('❌ Deployment failed:', error.message);
        process.exit(1);
    }
}

// Run deployment
deploy();

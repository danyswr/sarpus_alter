#!/usr/bin/env node

import { build } from 'vite'
import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'

console.log('🚀 Building Mahasiswa Feedback Platform for Vercel...')

try {
  // Build frontend dengan Vite
  console.log('📦 Building frontend...')
  await build()
  
  // Build server untuk Vercel
  console.log('⚙️ Building server...')
  execSync('esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=api --outbase=server', { stdio: 'inherit' })
  
  // Rename built server file untuk Vercel API format
  if (fs.existsSync('api/index.js')) {
    console.log('✅ Server build complete')
  }
  
  console.log('✨ Build successful! Ready for Vercel deployment.')
  
} catch (error) {
  console.error('❌ Build failed:', error)
  process.exit(1)
}
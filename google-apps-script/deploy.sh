#!/bin/bash

# ExJAM Registration System - Deployment Helper Script
# This script helps you copy the Apps Script files to clipboard for deployment

echo "🚀 ExJAM Registration System - Deployment Helper"
echo "================================================"
echo ""

# Check if pbcopy is available (macOS)
if command -v pbcopy &> /dev/null; then
    COPY_CMD="pbcopy"
elif command -v xclip &> /dev/null; then
    COPY_CMD="xclip -selection clipboard"
else
    echo "❌ No clipboard command found. Please copy manually."
    COPY_CMD="cat"
fi

# Function to copy file to clipboard
copy_to_clipboard() {
    local file=$1
    local description=$2
    
    echo "📋 Copying $description..."
    echo "File: $file"
    echo "---"
    
    if [ -f "$file" ]; then
        $COPY_CMD < "$file"
        echo "✅ Copied to clipboard!"
    else
        echo "❌ File not found: $file"
    fi
    echo ""
}

# Main deployment process
echo "📁 Available files for deployment:"
echo "1. ExjamRegistrationSystem.gs - Main registration system"
echo "2. QRBarcodeIntegration.gs - QR codes and barcodes"
echo "3. PhotoProcessing.gs - Photo upload and processing"
echo "4. DEPLOYMENT_GUIDE.md - Complete deployment instructions"
echo ""

echo "🎯 Deployment Steps:"
echo "1. Go to https://script.google.com"
echo "2. Create a new project"
echo "3. Copy and paste each file below"
echo ""

# Copy main registration system
read -p "Press Enter to copy ExjamRegistrationSystem.gs to clipboard..."
copy_to_clipboard "ExjamRegistrationSystem.gs" "Main Registration System"

# Copy QR/Barcode integration
read -p "Press Enter to copy QRBarcodeIntegration.gs to clipboard..."
copy_to_clipboard "QRBarcodeIntegration.gs" "QR Code and Barcode Integration"

# Copy photo processing
read -p "Press Enter to copy PhotoProcessing.gs to clipboard..."
copy_to_clipboard "PhotoProcessing.gs" "Photo Processing System"

echo "🎉 All files copied!"
echo ""
echo "📖 Next steps:"
echo "1. Follow the DEPLOYMENT_GUIDE.md for complete instructions"
echo "2. Enable required Google APIs"
echo "3. Configure the system settings"
echo "4. Test the deployment"
echo ""
echo "📚 For detailed instructions, see: DEPLOYMENT_GUIDE.md"

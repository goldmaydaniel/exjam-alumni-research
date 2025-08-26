#!/usr/bin/env python3
"""
Setup Script for ExJAM Registration System

This script sets up the registration system with QR codes and barcodes for the PG Conference.
"""

import subprocess
import sys
import os
from pathlib import Path

def install_requirements():
    """Install required Python packages."""
    print("Installing required packages...")
    
    requirements = [
        "pandas>=1.5.0",
        "numpy>=1.21.0",
        "matplotlib>=3.5.0",
        "seaborn>=0.11.0",
        "qrcode>=7.3",
        "Pillow>=9.0.0",
        "python-barcode>=0.14.0",
        "reportlab>=3.6.0",
        "google-auth>=2.0.0",
        "google-auth-oauthlib>=1.0.0",
        "google-auth-httplib2>=0.1.0",
        "google-api-python-client>=2.0.0"
    ]
    
    for package in requirements:
        try:
            print(f"Installing {package}...")
            subprocess.check_call([sys.executable, "-m", "pip", "install", package])
            print(f"✓ {package} installed successfully")
        except subprocess.CalledProcessError as e:
            print(f"✗ Failed to install {package}: {e}")
            return False
    
    return True

def test_qr_code_generation():
    """Test QR code generation functionality."""
    print("\nTesting QR code generation...")
    
    try:
        import qrcode
        from PIL import Image
        
        # Create a test QR code
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_L,
            box_size=10,
            border=4,
        )
        qr.add_data("Test QR Code for ExJAM PG Conference")
        qr.make(fit=True)
        
        img = qr.make_image(fill_color="black", back_color="white")
        test_file = "test_qr_code.png"
        img.save(test_file)
        
        if os.path.exists(test_file):
            print(f"✓ QR code test successful: {test_file}")
            os.remove(test_file)  # Clean up
            return True
        else:
            print("✗ QR code test failed")
            return False
            
    except ImportError as e:
        print(f"✗ QR code test failed - missing dependency: {e}")
        return False
    except Exception as e:
        print(f"✗ QR code test failed: {e}")
        return False

def test_barcode_generation():
    """Test barcode generation functionality."""
    print("\nTesting barcode generation...")
    
    try:
        import barcode
        from barcode.writer import ImageWriter
        
        # Create a test barcode
        barcode_class = barcode.get_barcode_class('code128')
        barcode_instance = barcode_class('EXJAM-TEST-2025', writer=ImageWriter())
        
        test_file = "test_barcode.png"
        barcode_instance.save(test_file)
        
        if os.path.exists(test_file):
            print(f"✓ Barcode test successful: {test_file}")
            os.remove(test_file)  # Clean up
            return True
        else:
            print("✗ Barcode test failed")
            return False
            
    except ImportError as e:
        print(f"✗ Barcode test failed - missing dependency: {e}")
        return False
    except Exception as e:
        print(f"✗ Barcode test failed: {e}")
        return False

def test_pdf_generation():
    """Test PDF generation functionality."""
    print("\nTesting PDF generation...")
    
    try:
        from reportlab.pdfgen import canvas
        from reportlab.lib.pagesizes import A4
        
        # Create a test PDF
        test_file = "test_badge.pdf"
        c = canvas.Canvas(test_file, pagesize=A4)
        c.drawString(100, 750, "ExJAM PG Conference - Test Badge")
        c.drawString(100, 700, "Name: Test Participant")
        c.drawString(100, 650, "Registration ID: EXJAM-TEST-2025")
        c.save()
        
        if os.path.exists(test_file):
            print(f"✓ PDF generation test successful: {test_file}")
            os.remove(test_file)  # Clean up
            return True
        else:
            print("✗ PDF generation test failed")
            return False
            
    except ImportError as e:
        print(f"✗ PDF generation test failed - missing dependency: {e}")
        return False
    except Exception as e:
        print(f"✗ PDF generation test failed: {e}")
        return False

def create_directories():
    """Create necessary directories for the registration system."""
    print("\nCreating directories...")
    
    directories = [
        "qr_codes",
        "barcodes", 
        "badges",
        "data",
        "reports",
        "logs"
    ]
    
    for directory in directories:
        Path(directory).mkdir(exist_ok=True)
        print(f"✓ Created directory: {directory}")
    
    return True

def create_config_file():
    """Create a configuration file for the registration system."""
    print("\nCreating configuration file...")
    
    config_content = """# ExJAM Registration System Configuration

[EVENT]
name = ExJAM President General's Conference - Maiden Flight
date = November 28-30, 2025
venue = NAF Conference Centre, FCT, ABUJA
theme = Strive to Excel

[REGISTRATION]
form_title = ExJAM PG Conference Registration
auto_generate_ids = true
id_prefix = EXJAM
require_approval = false

[QR_CODES]
size = 10
error_correction = L
border = 4
fill_color = black
back_color = white

[BARCODES]
type = code128
writer = ImageWriter
text_distance = 1.0

[BADGES]
page_size = A4
title_font_size = 24
body_font_size = 12
include_qr_code = true
include_barcode = true

[REPORTS]
auto_generate = true
include_statistics = true
include_charts = true
format = markdown

[GOOGLE_FORMS]
enabled = false
credentials_file = 
scopes = 
"""
    
    try:
        with open("registration_config.ini", "w") as f:
            f.write(config_content)
        print("✓ Configuration file created: registration_config.ini")
        return True
    except Exception as e:
        print(f"✗ Failed to create configuration file: {e}")
        return False

def run_demo():
    """Run a demonstration of the registration system."""
    print("\nRunning registration system demo...")
    
    try:
        # Import the enhanced registration module
        sys.path.append('tools/data-collection')
        from enhanced_registration_module import EnhancedExjamRegistrationModule
        
        # Initialize the registration module
        registration = EnhancedExjamRegistrationModule()
        
        # Generate sample QR codes and barcodes
        print("Generating sample QR codes and barcodes...")
        
        # Generate event QR codes
        qr_codes = registration.generate_event_qr_codes()
        
        # Generate event barcodes
        barcodes = registration.generate_event_barcodes()
        
        # Generate sample participant registration codes
        registration_id = registration.generate_unique_id()
        sample_codes = registration.generate_registration_codes(registration_id)
        
        # Create sample participant badge
        sample_participant = {
            'full_name': 'Ahmed A Mimi',
            'graduation_year': '2010',
            'email': 'ahmed.mimi@example.com',
            'phone': '+234 123 456 7890',
            'current_location': 'FCT, Abuja, Nigeria',
            'organization': 'ExJAM Association',
            'occupation': 'National President',
            'registration_id': registration_id
        }
        
        badge_file = registration.create_participant_badge(sample_participant)
        
        print("\n✓ Demo completed successfully!")
        print(f"Generated files:")
        print(f"  - QR codes: {len(qr_codes)} files")
        print(f"  - Barcodes: {len(barcodes)} files")
        print(f"  - Sample badge: {badge_file}")
        
        return True
        
    except Exception as e:
        print(f"✗ Demo failed: {e}")
        return False

def main():
    """Main setup function."""
    print("=== ExJAM Registration System Setup ===\n")
    
    # Step 1: Install requirements
    if not install_requirements():
        print("\n✗ Setup failed at requirements installation")
        return False
    
    # Step 2: Create directories
    if not create_directories():
        print("\n✗ Setup failed at directory creation")
        return False
    
    # Step 3: Create configuration file
    if not create_config_file():
        print("\n✗ Setup failed at configuration file creation")
        return False
    
    # Step 4: Test QR code generation
    if not test_qr_code_generation():
        print("\n✗ Setup failed at QR code test")
        return False
    
    # Step 5: Test barcode generation
    if not test_barcode_generation():
        print("\n✗ Setup failed at barcode test")
        return False
    
    # Step 6: Test PDF generation
    if not test_pdf_generation():
        print("\n✗ Setup failed at PDF test")
        return False
    
    # Step 7: Run demo
    if not run_demo():
        print("\n✗ Setup failed at demo")
        return False
    
    print("\n=== Setup Completed Successfully! ===")
    print("\nThe ExJAM Registration System is now ready to use.")
    print("\nNext steps:")
    print("1. Configure Google Forms API credentials (optional)")
    print("2. Customize the registration form as needed")
    print("3. Run the enhanced registration module:")
    print("   python tools/data-collection/enhanced_registration_module.py")
    print("\nFor more information, see the README.md file.")
    
    return True

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)

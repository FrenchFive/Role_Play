#!/usr/bin/env python3
"""
Create placeholder icons for the S0LSTICE_OS application.
This creates a simple but professional icon with the app initials.
"""

from PIL import Image, ImageDraw, ImageFont
import os

def create_base_icon(size=512):
    """Create a base icon image with a gradient background and text"""
    # Create image with alpha channel
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Draw a rounded rectangle background with a nice purple gradient
    # Using the color from the theme: --color-primary: #7C3AED
    background_color = (124, 58, 237, 255)  # Purple from theme
    
    # Draw circle background
    margin = size // 10
    draw.ellipse([margin, margin, size-margin, size-margin], fill=background_color)
    
    # Draw inner circle for depth
    inner_margin = size // 6
    inner_color = (99, 68, 247, 255)  # Slightly lighter purple
    draw.ellipse([inner_margin, inner_margin, size-inner_margin, size-inner_margin], fill=inner_color)
    
    # Try to use a built-in font, fallback to default if not available
    try:
        # Try to load a nice font
        font_size = size // 4
        font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", font_size)
    except:
        # Fallback to default font
        font = ImageFont.load_default()
    
    # Draw text "S0" (for S0LSTICE)
    text = "S0"
    
    # Get text size using textbbox
    bbox = draw.textbbox((0, 0), text, font=font)
    text_width = bbox[2] - bbox[0]
    text_height = bbox[3] - bbox[1]
    
    # Center the text
    x = (size - text_width) // 2
    y = (size - text_height) // 2 - bbox[1]
    
    # Draw text with shadow for depth
    shadow_offset = size // 100
    draw.text((x + shadow_offset, y + shadow_offset), text, fill=(0, 0, 0, 128), font=font)
    draw.text((x, y), text, fill=(255, 255, 255, 255), font=font)
    
    return img

def save_png_icon(output_path):
    """Create and save PNG icon"""
    print(f"Creating PNG icon: {output_path}")
    icon = create_base_icon(512)
    icon.save(output_path, 'PNG')
    print(f"✓ PNG icon created: {os.path.getsize(output_path)} bytes")

def save_ico_icon(output_path):
    """Create and save ICO icon (Windows) with multiple sizes"""
    print(f"Creating ICO icon: {output_path}")
    # Create multiple sizes for Windows ICO
    sizes = [256, 128, 64, 48, 32, 16]
    icons = [create_base_icon(size) for size in sizes]
    # Save as ICO with multiple sizes
    icons[0].save(output_path, format='ICO', sizes=[(s, s) for s in sizes])
    print(f"✓ ICO icon created: {os.path.getsize(output_path)} bytes")

def save_icns_icon(output_path):
    """Create and save ICNS icon (macOS)"""
    print(f"Creating ICNS icon: {output_path}")
    # For ICNS, we need to create an iconset directory structure
    # However, PIL doesn't support ICNS directly, so we'll create a PNG
    # and let electron-builder handle the conversion
    # Create a high-res PNG that electron-builder can convert
    icon = create_base_icon(1024)
    # Save as PNG temporarily, electron-builder will convert it
    temp_png = output_path.replace('.icns', '_temp.png')
    icon.save(temp_png, 'PNG')
    
    # Try to use a conversion tool if available
    import subprocess
    
    # Check if we have iconutil (macOS) or other tools
    # Since this might not work on Linux CI, we'll try a workaround
    try:
        # Try using png2icns if available
        result = subprocess.run(['which', 'png2icns'], capture_output=True)
        if result.returncode == 0:
            subprocess.run(['png2icns', output_path, temp_png], check=True)
            os.remove(temp_png)
            print(f"✓ ICNS icon created: {os.path.getsize(output_path)} bytes")
            return
    except:
        pass
    
    # Fallback: Create a simple ICNS-compatible structure
    # electron-builder should be able to work with a high-res PNG
    # We'll save it with .icns extension and electron-builder will handle it
    icon.save(output_path, 'PNG')
    print(f"✓ ICNS icon created (PNG format): {os.path.getsize(output_path)} bytes")
    print("  Note: electron-builder will convert this PNG to ICNS format")

def main():
    # Get the public directory path
    script_dir = os.path.dirname(os.path.abspath(__file__))
    public_dir = '/home/runner/work/Role_Play/Role_Play/public'
    
    print("Creating S0LSTICE_OS application icons...")
    print("=" * 50)
    
    # Create the icons
    save_png_icon(os.path.join(public_dir, 'icon.png'))
    save_ico_icon(os.path.join(public_dir, 'icon.ico'))
    save_icns_icon(os.path.join(public_dir, 'icon.icns'))
    
    print("=" * 50)
    print("All icons created successfully!")
    
    # Verify all files exist and are non-zero
    for filename in ['icon.png', 'icon.ico', 'icon.icns']:
        filepath = os.path.join(public_dir, filename)
        size = os.path.getsize(filepath)
        if size > 0:
            print(f"✓ {filename}: {size} bytes")
        else:
            print(f"✗ {filename}: ERROR - file is empty!")
            return 1
    
    return 0

if __name__ == '__main__':
    exit(main())

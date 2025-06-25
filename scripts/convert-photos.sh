#!/bin/bash

# Convert various photo formats to web-compatible formats with metadata preservation
# Handles HEIC, TIFF, BMP, AVIF, and other formats that need conversion for web compatibility

MEDIA_DIR="../media"

echo "Looking for photos that need web conversion..."

# Function to get conversion settings for a format
get_conversion_settings() {
    local ext="$1"
    case "$ext" in
        heic|HEIC)
            echo "jpg:85"
            ;;
        tiff|tif|TIFF|TIF)
            echo "jpg:90"
            ;;
        bmp|BMP)
            echo "jpg:85"
            ;;
        avif|AVIF)
            echo "webp:85"
            ;;
        # Web-compatible formats - no conversion needed
        jpg|jpeg|png|webp|gif|JPG|JPEG|PNG|WEBP|GIF)
            echo "skip"
            ;;
        *)
            echo "unknown"
            ;;
    esac
}

# Check available tools
echo "Checking available tools..."
IMAGEMAGICK_AVAILABLE=false
EXIFTOOL_AVAILABLE=false

if command -v magick &> /dev/null || command -v convert &> /dev/null; then
    IMAGEMAGICK_AVAILABLE=true
    echo "✓ ImageMagick found"
else
    echo "❌ ImageMagick not found. Please install ImageMagick for photo conversion."
    exit 1
fi

if command -v exiftool &> /dev/null; then
    EXIFTOOL_AVAILABLE=true
    echo "✓ ExifTool found (for metadata verification)"
else
    echo "⚠ ExifTool not found. Metadata verification will be skipped."
fi

conversion_count=0
failed_conversions=0

# Find all image files recursively
find "$MEDIA_DIR" -type f \( -iname "*.heic" -o -iname "*.tiff" -o -iname "*.tif" -o -iname "*.bmp" -o -iname "*.avif" \) | while read -r image_file; do
    # Get file extension
    extension="${image_file##*.}"
    
    # Check if this format needs conversion
    conversion_info=$(get_conversion_settings "$extension")
    
    # Skip if format doesn't need conversion or is unknown
    if [[ "$conversion_info" == "skip" ]] || [[ "$conversion_info" == "unknown" ]]; then
        continue
    fi
    
    # Parse conversion settings
    output_format="${conversion_info%%:*}"
    quality="${conversion_info##*:}"
    
    # Get the directory and filename without extension
    dir=$(dirname "$image_file")
    basename_no_ext=$(basename "$image_file" | sed 's/\.[^.]*$//')
    
    # Create output filename
    output_file="$dir/$basename_no_ext.$output_format"
    
    echo ""
    echo "Converting: $image_file -> $output_file"
    echo "  Format: $extension -> $output_format (quality: $quality)"
    
    # Skip if output already exists and is newer than source
    if [ -f "$output_file" ]; then
        if [ "$output_file" -nt "$image_file" ]; then
            echo "  Skipping: $basename_no_ext.$output_format already exists and is newer"
            continue
        else
            echo "  Replacing: $basename_no_ext.$output_format exists but is older than source"
        fi
    fi
    
    # Check original metadata if exiftool is available
    original_date=""
    original_gps=0
    original_camera=0
    
    if [ "$EXIFTOOL_AVAILABLE" = true ]; then
        echo "  Checking original metadata..."
        original_date=$(exiftool -s -s -s -DateTimeOriginal "$image_file" 2>/dev/null)
        original_gps=$(exiftool -s -s -s -GPSLatitude -GPSLongitude "$image_file" 2>/dev/null | wc -l)
        original_camera=$(exiftool -s -s -s -Make -Model "$image_file" 2>/dev/null | wc -l)
        
        [ -n "$original_date" ] && echo "    📅 Date: $original_date"
        [ "$original_gps" -gt 0 ] && echo "    📍 GPS data found"
        [ "$original_camera" -gt 0 ] && echo "    📷 Camera info found"
    fi
    
    # Convert using ImageMagick while preserving EXIF metadata
    conversion_result=1
    
    # Try primary conversion method
    if command -v magick &> /dev/null; then
        # Use ImageMagick 7+ syntax with safer options for TIFF
        magick "$image_file" -limit memory 256MB -limit disk 1GB -quality "$quality" "$output_file" 2>/dev/null
        conversion_result=$?
    elif command -v convert &> /dev/null; then
        # Use ImageMagick 6 syntax with safer options for TIFF  
        convert "$image_file" -limit memory 512MB -limit disk 2GB -quality "$quality" "$output_file" 2>/dev/null
        conversion_result=$?
    fi
    
    # If primary conversion failed, try fallback method (strip problematic metadata)
    if [ $conversion_result -ne 0 ]; then
        echo "    Primary conversion failed, trying fallback method..."
        if command -v magick &> /dev/null; then
            magick "$image_file" -strip -limit memory 512MB -limit disk 2GB -quality "$quality" "$output_file" 2>/dev/null
            conversion_result=$?
        elif command -v convert &> /dev/null; then
            convert "$image_file" -strip -limit memory 512MB -limit disk 2GB -quality "$quality" "$output_file" 2>/dev/null
            conversion_result=$?
        fi
        
        if [ $conversion_result -eq 0 ]; then
            echo "    ✓ Fallback conversion succeeded (metadata stripped for compatibility)"
        fi
    fi
    
    # Verify metadata was preserved if exiftool is available
    if [ "$EXIFTOOL_AVAILABLE" = true ] && [ $conversion_result -eq 0 ]; then
        echo "  Verifying metadata preservation..."
        converted_date=$(exiftool -s -s -s -DateTimeOriginal "$output_file" 2>/dev/null)
        converted_gps=$(exiftool -s -s -s -GPSLatitude -GPSLongitude "$output_file" 2>/dev/null | wc -l)
        converted_camera=$(exiftool -s -s -s -Make -Model "$output_file" 2>/dev/null | wc -l)
        
        metadata_preserved=true
        
        if [ -n "$original_date" ] && [ -n "$converted_date" ]; then
            echo "    ✓ Date preserved: $converted_date"
        elif [ -n "$original_date" ]; then
            echo "    ⚠ Date lost during conversion"
            metadata_preserved=false
        fi
        
        if [ "$original_gps" -gt 0 ] && [ "$converted_gps" -gt 0 ]; then
            echo "    ✓ GPS data preserved"
        elif [ "$original_gps" -gt 0 ]; then
            echo "    ⚠ GPS data lost during conversion"
            metadata_preserved=false
        fi
        
        if [ "$original_camera" -gt 0 ] && [ "$converted_camera" -gt 0 ]; then
            echo "    ✓ Camera info preserved"
        elif [ "$original_camera" -gt 0 ]; then
            echo "    ⚠ Camera info lost during conversion"
            metadata_preserved=false
        fi
        
        if [ "$metadata_preserved" = true ]; then
            echo "    ✅ All metadata successfully preserved!"
        else
            echo "    ⚠️ Some metadata may have been lost"
        fi
    fi
    
    if [ $conversion_result -eq 0 ]; then
        echo "  ✓ Successfully converted: $basename_no_ext.$extension -> $basename_no_ext.$output_format"
        conversion_count=$((conversion_count + 1))
        # Original files are preserved (not deleted)
    else
        echo "  ❌ Failed to convert: $image_file"
        failed_conversions=$((failed_conversions + 1))
        
        # Log the failure for debugging
        echo "    Error: ImageMagick conversion failed for $image_file" >&2
    fi
done

echo ""
if [ $failed_conversions -gt 0 ]; then
    echo "⚠️  Photo conversion completed with errors!"
    echo "   Successful: $conversion_count files"
    echo "   Failed: $failed_conversions files"
    echo ""
    echo "Check the logs above for specific error details."
    echo "Failed conversions may be due to:"
    echo "  • Corrupted image files"
    echo "  • Unsupported TIFF variants"
    echo "  • Memory limitations"
    echo ""
    exit 1
else
    echo "✅ Photo conversion complete! Converted $conversion_count files."
fi
echo ""
echo "Format conversion summary:"
echo "  • HEIC/HEIF → JPEG (universal browser support)"
echo "  • TIFF/TIF → JPEG (better compression, universal support)"  
echo "  • BMP → JPEG (much smaller file size)"
echo "  • AVIF → WebP (better browser support)"
echo "  • JPEG, PNG, WebP, GIF → No conversion needed"
# Photo Metadata Generation Scripts

This directory contains automated scripts for processing photos and generating metadata for the photo gallery.

## Features

- **EXIF Data Extraction**: Automatically extracts date, location, and camera information from image metadata
- **HEIC Support**: Converts Apple HEIC files to web-compatible JPEG format **with full metadata preservation**
- **Location Privacy**: Converts GPS coordinates to general regional names for privacy
- **Automated Organization**: Organizes photos by folder structure
- **Web Optimization**: Generates optimized metadata for fast gallery loading

## Supported Formats

- **JPEG/JPG** - Full EXIF support
- **PNG** - Basic metadata
- **WebP** - Modern web format
- **HEIC** - Apple format (auto-converted to JPEG with metadata preserved)
- **AVIF** - Next-gen format
- **TIFF** - Professional format
- **BMP** - Basic bitmap
- **GIF** - Animated images

## Scripts

### `convert-photos.sh` (Bash) - **Run First**
Converts non-web-compatible photo formats to web-friendly formats with full metadata preservation.

**Supported Conversions:**
- **HEIC** → JPEG (universal browser support)
- **TIFF/TIF** → JPEG (better compression, universal support)  
- **BMP** → JPEG (much smaller file size)
- **AVIF** → WebP (better browser support)

### `generate-photos` (Rust) - **Run Second**
Scans the media directory and generates `photos.json` with metadata. **Does NOT convert files.**

**Features:**
- Extracts EXIF timestamps and formats them nicely (e.g., "December 25, 2024")
- Converts GPS coordinates to general locations (e.g., "Washington D.C. area")  
- Generates unique IDs and clean titles from filenames
- **Smart duplicate prevention** - skips converted files if originals exist
- Points metadata to converted web-compatible filenames
- Supports all image formats with proper format detection

### `convert-photos.sh` (Bash) - **Conversion Details**

**Features:**
- Automatically finds all non-web-compatible files in media directory
- **High-quality conversion** with format-specific quality settings:
  - HEIC/BMP → JPEG (85% quality)
  - TIFF → JPEG (90% quality for professional files)
  - AVIF → WebP (85% quality)
- **Preserves all EXIF metadata** including:
  - 📅 Date/time information (DateTimeOriginal)
  - 📍 GPS coordinates (latitude/longitude)
  - 📷 Camera information (make/model)
- Detailed metadata verification before and after conversion
- **Smart skip logic** - only converts if output doesn't exist or is older
- Preserves original files (not deleted)
- Reports on metadata preservation success/failure

## Usage

### Manual
```bash
# 1. Convert non-web-compatible formats to web formats (with metadata preservation)
./convert-photos.sh

# 2. Generate metadata JSON (avoiding duplicates)
cargo run --bin generate-photos
```

### Automated (GitHub Actions)
The workflow automatically:
1. Installs ImageMagick, libheif, and ExifTool
2. **Converts photos** using `convert-photos.sh` with full metadata preservation
3. **Generates metadata** using Rust script with smart duplicate prevention
4. Commits converted photos and updated photos.json
5. Deploys to GitHub Pages

## Workflow & Roles

### **Separation of Concerns**
- **Bash script** (`convert-photos.sh`): Handles actual file conversion using ImageMagick
- **Rust script** (`generate-photos`): Handles metadata extraction and JSON generation
- **No overlap**: Rust script does NOT convert files, Bash script does NOT generate metadata

### **Smart Duplicate Prevention**
1. **Conversion script**: Only converts if output doesn't exist or is older than source
2. **Metadata script**: Skips converted files if original exists (e.g., skips `photo.jpg` if `photo.heic` exists)
3. **Result**: One metadata entry per photo, pointing to web-compatible version

## Location Privacy

GPS coordinates are converted to general regions for privacy:
- **Exact coordinates**: `38.8951, -77.0364`
- **General location**: `"Washington D.C. area"`

Supports regions worldwide including US states, major countries, and hemisphere fallbacks.

## HEIC Conversion & Metadata Preservation

### Why Convert HEIC?
- HEIC files are not supported by web browsers
- Conversion to JPEG ensures universal compatibility
- Original HEIC files are preserved (not deleted)

### Metadata Preservation Process
1. **Before conversion**: Script reads original HEIC metadata
2. **During conversion**: ImageMagick preserves EXIF data (no `-strip` flag)
3. **After conversion**: Script verifies all metadata was preserved
4. **Report**: Shows which metadata fields were successfully preserved

### Example Output
```
Converting: media/photos/IMG_1234.heic -> media/photos/IMG_1234.jpg
  Checking original HEIC metadata...
    📅 Date: 2024:12:25 14:30:00
    📍 GPS data found
    📷 Camera info found
  Verifying metadata preservation...
    ✓ Date preserved: 2024:12:25 14:30:00
    ✓ GPS data preserved
    ✓ Camera info preserved
    ✅ All metadata successfully preserved!
✓ Successfully converted: IMG_1234.heic -> IMG_1234.jpg
```

### Tools Used
- **ImageMagick**: Primary conversion tool
- **ExifTool**: Metadata verification and inspection
- **libheif**: HEIF format support for ImageMagick

This ensures your photos maintain all their important metadata (timestamps, location, camera settings) even after conversion to web-compatible formats.
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::collections::HashMap;
use std::fs;
use std::io::BufReader;
use std::path::Path;
use walkdir::WalkDir;

#[derive(Serialize, Deserialize, Debug)]
struct Photo {
    id: String,
    filename: String,
    folder: String,
    title: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    subtitle: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    location: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    date: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    camera: Option<String>,
}

fn main() -> Result<(), Box<dyn std::error::Error>> {
    let media_dir = "../media";
    let output_file = "../photos.json";

    let mut photos = Vec::new();
    let mut photo_groups: HashMap<String, Vec<std::path::PathBuf>> = HashMap::new();

    // Walk through media directory and group files by stem
    for entry in WalkDir::new(media_dir)
        .into_iter()
        .filter_map(|e| e.ok())
        .filter(|e| e.file_type().is_file())
    {
        let path = entry.path();

        // Check if it's an image file
        if let Some(extension) = path.extension() {
            let ext = extension.to_string_lossy().to_lowercase();
            if matches!(
                ext.as_str(),
                "jpg" | "jpeg" | "png" | "webp" | "tiff" | "heic" | "avif" | "bmp" | "gif"
            ) {
                // Group files by their stem (filename without extension)
                if let Some(stem) = path.file_stem() {
                    let key = format!(
                        "{}/{}",
                        path.parent().unwrap_or_else(|| Path::new("")).display(),
                        stem.to_string_lossy()
                    );
                    photo_groups
                        .entry(key)
                        .or_default()
                        .push(path.to_path_buf());
                }
            }
        }
    }

    // Process each group and pick the best file
    for (_group_name, files) in photo_groups {
        if let Some(best_file) = select_best_file_from_group(&files) {
            println!(
                "Processing {} (selected from {} candidates)",
                best_file.display(),
                files.len()
            );
            if files.len() > 1 {
                println!(
                    "  Skipped: {}",
                    files
                        .iter()
                        .filter(|f| *f != &best_file)
                        .map(|f| f.file_name().unwrap_or_default().to_string_lossy())
                        .collect::<Vec<_>>()
                        .join(", ")
                );
            }

            if let Ok(photo) = process_image(&best_file, media_dir) {
                photos.push(photo);
            }
        }
    }

    // Sort photos by date (newest first), then by title
    photos.sort_by(|a, b| match (&b.date, &a.date) {
        (Some(date_b), Some(date_a)) => date_b.cmp(date_a),
        (Some(_), None) => std::cmp::Ordering::Less,
        (None, Some(_)) => std::cmp::Ordering::Greater,
        (None, None) => a.title.cmp(&b.title),
    });

    // Write to JSON file
    let json = serde_json::to_string_pretty(&photos)?;
    fs::write(output_file, json)?;

    println!("Generated photos.json with {} photos", photos.len());
    Ok(())
}

fn select_best_file_from_group(files: &[std::path::PathBuf]) -> Option<std::path::PathBuf> {
    if files.is_empty() {
        return None;
    }

    if files.len() == 1 {
        return Some(files[0].clone());
    }

    // Format priority: web-compatible formats first, then original formats
    let format_priority = |ext: &str| -> i32 {
        match ext {
            // Web-compatible formats (highest priority)
            "webp" => 100,
            "jpg" | "jpeg" => 90,
            "png" => 80,
            "gif" => 70,

            // Original formats that need conversion (lower priority)
            "heic" => 60,
            "tiff" | "tif" => 50,
            "avif" => 40,
            "bmp" => 30,

            // Unknown formats (lowest priority)
            _ => 0,
        }
    };

    // Find the best file based on format priority and modification time
    let mut best_file = &files[0];
    let mut best_priority = 0;
    let mut best_modified = std::time::SystemTime::UNIX_EPOCH;

    for file in files {
        let priority = if let Some(ext) = file.extension() {
            format_priority(&ext.to_string_lossy().to_lowercase())
        } else {
            0
        };

        let modified = file
            .metadata()
            .and_then(|m| m.modified())
            .unwrap_or(std::time::SystemTime::UNIX_EPOCH);

        // Prefer higher priority, then newer files
        if priority > best_priority || (priority == best_priority && modified > best_modified) {
            best_file = file;
            best_priority = priority;
            best_modified = modified;
        }
    }

    Some(best_file.clone())
}

fn process_image(path: &Path, media_dir: &str) -> Result<Photo, Box<dyn std::error::Error>> {
    // Generate relative path from media directory
    let relative_path = path.strip_prefix(media_dir)?;

    // Check if this format needs conversion for web compatibility
    let (needs_conversion, output_extension, conversion_note) = check_format_conversion(path);

    let filename = if needs_conversion {
        // For non-web-compatible files, point to converted version
        let converted_path = relative_path.with_extension(output_extension);
        format!("media/{}", converted_path.to_string_lossy())
    } else {
        format!("media/{}", relative_path.to_string_lossy())
    };

    // Extract folder from path
    let folder = relative_path
        .parent()
        .and_then(|p| p.file_name())
        .map(|s| s.to_string_lossy().to_string())
        .unwrap_or_else(|| "misc".to_string());

    // Generate unique ID from path
    let mut hasher = Sha256::new();
    hasher.update(filename.as_bytes());
    let id = format!("{:x}", hasher.finalize())[..8].to_string();

    // Extract title from filename
    let title = path
        .file_stem()
        .map(|s| s.to_string_lossy().to_string())
        .unwrap_or_else(|| "Untitled".to_string())
        .replace(['-', '_'], " ");

    // Try to extract EXIF data
    let (date, location, camera) = extract_exif_data(path);

    // Add note about format conversion if needed
    if needs_conversion {
        println!(
            "Found {}: {} -> {}",
            conversion_note,
            path.display(),
            filename
        );
    }

    Ok(Photo {
        id,
        filename,
        folder,
        title,
        subtitle: None,
        location,
        date,
        camera,
    })
}

fn check_format_conversion(path: &Path) -> (bool, &'static str, &'static str) {
    if let Some(extension) = path.extension() {
        let ext = extension.to_string_lossy().to_lowercase();
        match ext.as_str() {
            // Formats that need conversion for web compatibility
            "heic" => (
                true,
                "jpg",
                "HEIC file (convert to JPEG for web compatibility)",
            ),
            "tiff" | "tif" => (
                true,
                "jpg",
                "TIFF file (convert to JPEG for better web support)",
            ),
            "bmp" => (true, "jpg", "BMP file (convert to JPEG for smaller size)"),
            "avif" => (
                true,
                "webp",
                "AVIF file (convert to WebP for broader support)",
            ),

            // Web-compatible formats (no conversion needed)
            "jpg" | "jpeg" | "png" | "webp" | "gif" => (false, "", ""),

            // Default: no conversion
            _ => (false, "", ""),
        }
    } else {
        (false, "", "")
    }
}

fn extract_exif_data(path: &Path) -> (Option<String>, Option<String>, Option<String>) {
    let mut date = None;
    let mut location = None;
    let mut camera = None;

    if let Ok(file) = std::fs::File::open(path) {
        let mut buf_reader = BufReader::new(&file);

        if let Ok(exifreader) = exif::Reader::new().read_from_container(&mut buf_reader) {
            // Extract date
            if let Some(field) =
                exifreader.get_field(exif::Tag::DateTimeOriginal, exif::In::PRIMARY)
            {
                let date_str = field.display_value().with_unit(&exifreader).to_string();
                if let Ok(parsed_date) =
                    chrono::NaiveDateTime::parse_from_str(&date_str, "%Y-%m-%d %H:%M:%S")
                {
                    date = Some(parsed_date.format("%B %d, %Y").to_string());
                } else if let Ok(parsed_date) =
                    chrono::NaiveDateTime::parse_from_str(&date_str, "%Y:%m:%d %H:%M:%S")
                {
                    date = Some(parsed_date.format("%B %d, %Y").to_string());
                }
            }

            // Extract camera make and model
            let mut make = None;
            let mut model = None;

            if let Some(field) = exifreader.get_field(exif::Tag::Make, exif::In::PRIMARY) {
                make = Some(
                    field
                        .display_value()
                        .with_unit(&exifreader)
                        .to_string()
                        .trim()
                        .to_string(),
                );
            }

            if let Some(field) = exifreader.get_field(exif::Tag::Model, exif::In::PRIMARY) {
                model = Some(
                    field
                        .display_value()
                        .with_unit(&exifreader)
                        .to_string()
                        .trim()
                        .to_string(),
                );
            }

            camera = match (make, model) {
                (Some(m), Some(n)) => {
                    if n.starts_with(&m) {
                        Some(n)
                    } else {
                        Some(format!("{} {}", m, n))
                    }
                }
                (Some(m), None) => Some(m),
                (None, Some(n)) => Some(n),
                (None, None) => None,
            };

            // Extract GPS coordinates
            if let Some(lat_field) = exifreader.get_field(exif::Tag::GPSLatitude, exif::In::PRIMARY)
            {
                if let Some(lat_ref_field) =
                    exifreader.get_field(exif::Tag::GPSLatitudeRef, exif::In::PRIMARY)
                {
                    if let Some(lon_field) =
                        exifreader.get_field(exif::Tag::GPSLongitude, exif::In::PRIMARY)
                    {
                        if let Some(lon_ref_field) =
                            exifreader.get_field(exif::Tag::GPSLongitudeRef, exif::In::PRIMARY)
                        {
                            if let (Some(lat), Some(lon)) = (
                                parse_gps_coordinate(&lat_field.value, &lat_ref_field.value),
                                parse_gps_coordinate(&lon_field.value, &lon_ref_field.value),
                            ) {
                                location = coordinates_to_general_location(lat, lon);
                            }
                        }
                    }
                }
            }
        }
    }

    (date, location, camera)
}

fn parse_gps_coordinate(coord_value: &exif::Value, ref_value: &exif::Value) -> Option<f64> {
    if let (exif::Value::Rational(coord_rationals), exif::Value::Ascii(ref_bytes)) =
        (coord_value, ref_value)
    {
        if coord_rationals.len() >= 3 && !ref_bytes.is_empty() {
            let degrees = coord_rationals[0].to_f64();
            let minutes = coord_rationals[1].to_f64();
            let seconds = coord_rationals[2].to_f64();

            let mut coordinate = degrees + minutes / 60.0 + seconds / 3600.0;

            if let Ok(ref_str) = std::str::from_utf8(&ref_bytes[0]) {
                if ref_str.starts_with('S') || ref_str.starts_with('W') {
                    coordinate = -coordinate;
                }
            }

            return Some(coordinate);
        }
    }
    None
}

fn coordinates_to_general_location(lat: f64, lon: f64) -> Option<String> {
    // Simple coordinate-to-region mapping for common areas
    // This is a basic implementation - for production you'd use a geocoding service

    // North America
    if (25.0..=71.0).contains(&lat) && (-168.0..=-52.0).contains(&lon) {
        // USA regions
        if lat >= 47.0 && (-125.0..=-116.0).contains(&lon) {
            return Some("Pacific Northwest".to_string());
        }
        if (32.0..=42.0).contains(&lat) && (-125.0..=-114.0).contains(&lon) {
            return Some("California".to_string());
        }
        if (40.0..=45.0).contains(&lat) && (-80.0..=-71.0).contains(&lon) {
            return Some("New York region".to_string());
        }
        if (38.0..=39.5).contains(&lat) && (-77.5..=-76.5).contains(&lon) {
            return Some("Washington D.C. area".to_string());
        }
        if (25.0..=31.0).contains(&lat) && (-87.0..=-80.0).contains(&lon) {
            return Some("Florida".to_string());
        }
        return Some("United States".to_string());
    }

    // Europe
    if (35.0..=71.0).contains(&lat) && (-10.0..=40.0).contains(&lon) {
        if (51.0..=55.0).contains(&lat) && (-8.0..=2.0).contains(&lon) {
            return Some("United Kingdom".to_string());
        }
        if (48.0..=51.0).contains(&lat) && (2.0..=8.0).contains(&lon) {
            return Some("France".to_string());
        }
        if (47.0..=55.0).contains(&lat) && (6.0..=15.0).contains(&lon) {
            return Some("Germany".to_string());
        }
        return Some("Europe".to_string());
    }

    // Asia
    if (-10.0..=81.0).contains(&lat) && (60.0..=180.0).contains(&lon) {
        if (35.0..=46.0).contains(&lat) && (129.0..=146.0).contains(&lon) {
            return Some("Japan".to_string());
        }
        if (18.0..=54.0).contains(&lat) && (73.0..=135.0).contains(&lon) {
            return Some("China region".to_string());
        }
        return Some("Asia".to_string());
    }

    // Default fallback with approximate coordinates
    if lat >= 0.0 {
        if lon >= 0.0 {
            Some("Eastern Hemisphere".to_string())
        } else {
            Some("Western Hemisphere".to_string())
        }
    } else {
        Some("Southern Hemisphere".to_string())
    }
}

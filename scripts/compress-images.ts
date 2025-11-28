import sharp from 'sharp';
import { readdirSync, statSync } from 'fs';
import { join } from 'path';

const imagesDir = join(process.cwd(), 'src/images');
const targetQuality = 85; // Good balance between quality and file size
const maxWidth = 2400; // Max width for hero images

async function compressImage(filename: string) {
  const inputPath = join(imagesDir, filename);

  // Skip README and non-image files
  if (!filename.match(/\.(jpg|jpeg|png|webp)$/i)) {
    return;
  }

  // Get original file size
  const originalStats = statSync(inputPath);
  const originalSizeMB = (originalStats.size / (1024 * 1024)).toFixed(2);

  console.log(`\nCompressing ${filename} (${originalSizeMB}MB)...`);

  // Create a temporary output path
  const tempPath = join(imagesDir, `temp-${filename}`);

  try {
    // Compress the image
    await sharp(inputPath)
      .resize(maxWidth, null, {
        withoutEnlargement: true,
        fit: 'inside',
      })
      .jpeg({
        quality: targetQuality,
        progressive: true,
        mozjpeg: true,
      })
      .toFile(tempPath);

    // Get compressed file size
    const compressedStats = statSync(tempPath);
    const compressedSizeMB = (compressedStats.size / (1024 * 1024)).toFixed(2);
    const savedPercent = (
      ((originalStats.size - compressedStats.size) / originalStats.size) *
      100
    ).toFixed(1);

    console.log(
      `  ✓ Compressed to ${compressedSizeMB}MB (saved ${savedPercent}%)`
    );

    // Replace original with compressed version
    const fs = await import('fs/promises');
    await fs.unlink(inputPath);
    await fs.rename(tempPath, inputPath);
  } catch (error) {
    console.error(`  ✗ Error compressing ${filename}:`, error);
    // Clean up temp file if it exists
    try {
      const fs = await import('fs/promises');
      await fs.unlink(tempPath);
    } catch {}
  }
}

async function main() {
  console.log('🖼️  Starting image compression...');
  console.log(`Target quality: ${targetQuality}%`);
  console.log(`Max width: ${maxWidth}px\n`);

  const files = readdirSync(imagesDir);
  const imageFiles = files.filter((f) =>
    f.match(/\.(jpg|jpeg|png|webp)$/i)
  );

  console.log(`Found ${imageFiles.length} images to compress`);

  // Process images sequentially to avoid memory issues
  for (const file of imageFiles) {
    await compressImage(file);
  }

  console.log('\n✅ Image compression complete!');
}

main().catch(console.error);

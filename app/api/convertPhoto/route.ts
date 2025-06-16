import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { inputFile } = body;

    if (!inputFile) {
      return NextResponse.json({ error: 'inputFile is required' }, { status: 400 });
    }

    const inputFilePath = path.join(process.cwd(), 'public', inputFile);
    const outputFileName = `converted-photo-${Date.now()}.png`;
    const outputFilePath = path.join(process.cwd(), 'public', outputFileName);

    if (!fs.existsSync(inputFilePath)) {
      return NextResponse.json({ error: 'Input file not found' }, { status: 404 });
    }

    const metadata = await sharp(inputFilePath).metadata();
    const width = metadata.width || 0;
    const height = metadata.height || 0;

    if (width === 0 || height === 0) {
      return NextResponse.json({ error: 'Invalid image dimensions' }, { status: 400 });
    }

    const singleWidth = width / 4;
    const singleHeight = height;

    const images = await Promise.all(
      [0, 1, 2, 3].map((i) =>
        sharp(inputFilePath)
          .extract({ left: i * singleWidth, top: 0, width: singleWidth, height: singleHeight })
          .toBuffer()
      )
    );

    const row1 = await sharp({
      create: {
        width: singleWidth * 2,
        height: singleHeight,
        channels: 4,
        background: { r: 255, g: 255, b: 255, alpha: 1 },
      },
    })
      .composite([
        { input: images[0], top: 0, left: 0 },
        { input: images[1], top: 0, left: singleWidth },
      ])
      .toBuffer();

    const row2 = await sharp({
      create: {
        width: singleWidth * 2,
        height: singleHeight,
        channels: 4,
        background: { r: 255, g: 255, b: 255, alpha: 1 },
      },
    })
      .composite([
        { input: images[2], top: 0, left: 0 },
        { input: images[3], top: 0, left: singleWidth },
      ])
      .toBuffer();

    await sharp({
      create: {
        width: singleWidth * 2,
        height: singleHeight * 2,
        channels: 4,
        background: { r: 255, g: 255, b: 255, alpha: 1 },
      },
    })
      .composite([
        { input: row1, top: 0, left: 0 },
        { input: row2, top: singleHeight, left: 0 },
      ])
      .toFile(outputFilePath);

    return NextResponse.json({
      message: 'Image converted successfully',
      outputFile: `/${outputFileName}`,
    });
  } catch (error) {
    console.error('Image processing error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

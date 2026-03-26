import { execFile } from 'child_process';
import { mkdirSync, renameSync, rmSync } from 'fs';
import * as path from 'path';
import sharp from 'sharp';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);
const thumbnailTargets = new Set(['members', 'products', 'article', 'articles', 'reviews']);
const trimTargets = new Set(['products']);
const THUMB_MAX_DIMENSION = 960;

export const canGenerateThumbnailForTarget = (target: string): boolean => thumbnailTargets.has(target);

export const buildUploadThumbnailPath = (originalPath: string): string => {
	const parsed = path.parse(originalPath);
	return path.join(parsed.dir, 'thumbs', parsed.base);
};

export const normalizeUploadedImage = async (originalPath: string, target: string): Promise<void> => {
	if (!trimTargets.has(target)) return;

	const parsed = path.parse(originalPath);
	const normalizedPath = path.join(parsed.dir, `${parsed.name}.normalized${parsed.ext}`);

	try {
		await sharp(originalPath, { failOn: 'none' }).rotate().trim().toFile(normalizedPath);
		renameSync(normalizedPath, originalPath);
	} catch (err: any) {
		rmSync(normalizedPath, { force: true });
		console.log('Image normalization skipped:', err?.message ?? err);
	}
};

export const generateUploadThumbnail = async (originalPath: string, target: string): Promise<string | null> => {
	if (!canGenerateThumbnailForTarget(target)) return null;

	const thumbPath = buildUploadThumbnailPath(originalPath);
	mkdirSync(path.dirname(thumbPath), { recursive: true });

	try {
		await execFileAsync('/usr/bin/sips', ['-Z', String(THUMB_MAX_DIMENSION), originalPath, '--out', thumbPath]);
		return thumbPath;
	} catch (err: any) {
		console.log('Thumbnail generation skipped:', err?.message ?? err);
		return null;
	}
};

import { execFile } from 'child_process';
import { mkdirSync } from 'fs';
import * as path from 'path';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);
const thumbnailTargets = new Set(['members', 'products', 'article', 'articles', 'reviews']);
const THUMB_MAX_DIMENSION = 960;

export const canGenerateThumbnailForTarget = (target: string): boolean => thumbnailTargets.has(target);

export const buildUploadThumbnailPath = (originalPath: string): string => {
	const parsed = path.parse(originalPath);
	return path.join(parsed.dir, 'thumbs', parsed.base);
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

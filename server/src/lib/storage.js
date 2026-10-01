import multer from 'multer';
import crypto from 'crypto';
import { supabase } from '../config/supabase.js';

const SUBMISSION_TYPES = {
  'application/pdf': 'pdf',
  'application/zip': 'zip',
  'application/x-zip-compressed': 'zip',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'image/png': 'png',
  'image/jpeg': 'jpg',
};
const IMAGE_TYPES = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp' };

const upload = (types, maxMb) => multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: maxMb * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (types[file.mimetype]) return cb(null, true);
    cb(Object.assign(new Error(`File type not allowed (${Object.values(types).join(', ')})`), { status: 400 }));
  },
});

export const submissionUpload = upload(SUBMISSION_TYPES, 10);
export const avatarUpload = upload(IMAGE_TYPES, 2);

const safeName = (name) => name.replace(/[^\w.-]+/g, '_').slice(-80);

export async function storeFile(bucket, folder, file) {
  const path = `${folder}/${Date.now()}-${crypto.randomBytes(3).toString('hex')}-${safeName(file.originalname)}`;
  const { error } = await supabase.storage.from(bucket).upload(path, file.buffer, { contentType: file.mimetype });
  if (error) throw Object.assign(new Error(`Upload failed: ${error.message}`), { status: 500 });
  return path;
}

export const publicUrl = (bucket, path) => supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;

export async function withFileUrls(submissions) {
  const list = Array.isArray(submissions) ? submissions : [submissions];
  await Promise.all(list.filter((s) => s?.file_path).map(async (s) => {
    const { data } = await supabase.storage.from('submissions').createSignedUrl(s.file_path, 3600);
    s.file_url = data?.signedUrl || null;
  }));
  return submissions;
}

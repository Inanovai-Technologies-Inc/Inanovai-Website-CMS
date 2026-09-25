/**
 * Validates, stores, and notifies on public Career applications.
 */

import type { Core } from '@strapi/strapi';

const MAX_RESUME_SIZE = 5 * 1024 * 1024;
const MAX_FIELD_LENGTH = 5000;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SUPPORTED_MIME_TYPES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
]);
const SUPPORTED_EXTENSIONS = new Set(['.pdf', '.doc', '.docx', '.txt']);

type MultipartFile = {
  filepath?: string;
  path?: string;
  originalFilename?: string | null;
  name?: string;
  mimetype?: string | null;
  type?: string | null;
  size?: number;
};

type SubmissionInput = {
  body: unknown;
  files: unknown;
};

type SubmitResult = {
  status: number;
  body: Record<string, unknown>;
};

type CareerRecord = {
  id: number;
  title?: string;
  slug?: string;
};

type UploadedFile = {
  id: number;
  name?: string;
  url?: string;
  mime?: string;
  size?: number;
  ext?: string;
};

function fieldValue(body: Record<string, unknown>, field: string): string {
  const value = body[field];
  if (Array.isArray(value)) return typeof value[0] === 'string' ? value[0].trim() : '';
  return typeof value === 'string' ? value.trim() : '';
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function getResumeFile(files: unknown): MultipartFile | null {
  const data = (files ?? {}) as Record<string, unknown>;
  const value = data.resume;
  const file = Array.isArray(value) ? value[0] : value;
  return file && typeof file === 'object' ? (file as MultipartFile) : null;
}

function getFileName(file: MultipartFile): string {
  return file.originalFilename?.trim() || file.name?.trim() || 'resume';
}

function getFileMime(file: MultipartFile): string {
  return file.mimetype?.trim().toLowerCase() || file.type?.trim().toLowerCase() || '';
}

function hasSupportedResumeType(file: MultipartFile): boolean {
  const mime = getFileMime(file);
  const fileName = getFileName(file).toLowerCase();
  const extension = fileName.includes('.') ? fileName.slice(fileName.lastIndexOf('.')) : '';

  return SUPPORTED_MIME_TYPES.has(mime) || SUPPORTED_EXTENSIONS.has(extension);
}

function validationError(error: string): SubmitResult {
  return { status: 400, body: { error } };
}

export default ({ strapi }: { strapi: Core.Strapi }) => ({
  async submit(input: SubmissionInput): Promise<SubmitResult> {
    const body = (input.body ?? {}) as Record<string, unknown>;
    const fullName = fieldValue(body, 'fullName');
    const email = fieldValue(body, 'email');
    const phone = fieldValue(body, 'phone');
    const coverMessage = fieldValue(body, 'coverMessage');
    const careerSlug = fieldValue(body, 'career');
    const resume = getResumeFile(input.files);

    if (!fullName) return validationError('Full name is required.');
    if (!email) return validationError('Email is required.');
    if (!EMAIL_PATTERN.test(email)) return validationError('Email is not valid.');
    if (!careerSlug) return validationError('Career slug is required.');
    if (!resume) return validationError('Resume is required.');

    if ([fullName, email, phone, coverMessage, careerSlug].some((value) => value.length > MAX_FIELD_LENGTH)) {
      return validationError('One of the fields is too long.');
    }

    if (typeof resume.size === 'number' && resume.size > MAX_RESUME_SIZE) {
      return { status: 413, body: { error: 'Resume must be 5 MB or smaller.' } };
    }

    if (!hasSupportedResumeType(resume)) {
      return { status: 400, body: { error: 'Resume must be a PDF, DOC, DOCX, or TXT file.' } };
    }

    let career: CareerRecord | null;
    try {
      career = await strapi.db.query('api::career.career').findOne({
        where: { slug: careerSlug, isActive: true },
        select: ['id', 'title', 'slug'],
      });
    } catch (error) {
      strapi.log.error('Failed to resolve career for application submission', error as Error);
      return { status: 500, body: { error: 'Could not verify the selected career.' } };
    }

    if (!career) {
      return { status: 404, body: { error: 'The selected career is not available.' } };
    }

    let uploadedResume: UploadedFile | null = null;
    try {
      const uploadedFiles = await strapi.plugin('upload').service('upload').upload({
        data: {},
        files: resume,
      });
      uploadedResume = Array.isArray(uploadedFiles) ? uploadedFiles[0] : uploadedFiles;

      if (!uploadedResume?.id) {
        throw new Error('Upload service did not return a file record.');
      }
    } catch (error) {
      strapi.log.error('Failed to upload resume for career application', error as Error);
      return { status: 500, body: { error: 'Could not store the resume.' } };
    }

    let application: { id: number; documentId?: string };
    try {
      application = await strapi.entityService.create('api::application.application', {
        data: {
          fullName,
          email,
          phone: phone || undefined,
          coverMessage: coverMessage || undefined,
          resume: uploadedResume.id,
          career: career.id,
          statuses: 'new',
          submittedAt: new Date(),
        },
      }) as { id: number; documentId?: string };
    } catch (error) {
      strapi.log.error('Failed to save career application', error as Error);
      try {
        await strapi.plugin('upload').service('upload').delete(uploadedResume.id);
      } catch (cleanupError) {
        strapi.log.error('Failed to clean up resume after application save failure', cleanupError as Error);
      }
      return { status: 500, body: { error: 'Could not save your application.' } };
    }

    const recipient = process.env.CAREERS_RECIPIENT_EMAIL?.trim();
    if (!recipient) {
      strapi.log.error('Career application saved but CAREERS_RECIPIENT_EMAIL is not configured.');
      return {
        status: 502,
        body: {
          success: false,
          saved: true,
          notificationFailed: true,
          applicationId: application.documentId ?? application.id,
          error: 'Your application was saved, but the notification could not be sent.',
        },
      };
    }

    const resumeName = uploadedResume.name || getFileName(resume);
    const resumeMime = uploadedResume.mime || getFileMime(resume) || 'unknown';
    const resumeSize = typeof uploadedResume.size === 'number' ? `${uploadedResume.size} KB` : 'unknown size';
    const resumeReference = uploadedResume.url || 'Stored in Strapi Uploads';
    const subject = `New career application: ${career.title ?? careerSlug}`;
    const text = [
      `Applicant name: ${fullName}`,
      `Applicant email: ${email}`,
      `Phone: ${phone || 'Not provided'}`,
      `Position applied for: ${career.title ?? careerSlug}`,
      '',
      'Cover message:',
      coverMessage || 'Not provided',
      '',
      `Resume: ${resumeName}`,
      `Resume type: ${resumeMime}`,
      `Resume size: ${resumeSize}`,
      `Resume reference: ${resumeReference}`,
    ].join('\n');
    const html = [
      `<p><strong>Applicant name:</strong> ${escapeHtml(fullName)}</p>`,
      `<p><strong>Applicant email:</strong> ${escapeHtml(email)}</p>`,
      `<p><strong>Phone:</strong> ${escapeHtml(phone || 'Not provided')}</p>`,
      `<p><strong>Position applied for:</strong> ${escapeHtml(career.title ?? careerSlug)}</p>`,
      '<p><strong>Cover message:</strong></p>',
      `<p>${escapeHtml(coverMessage || 'Not provided').replace(/\n/g, '<br />')}</p>`,
      `<p><strong>Resume:</strong> ${escapeHtml(resumeName)} (${escapeHtml(resumeMime)}, ${escapeHtml(resumeSize)})</p>`,
      `<p><strong>Resume reference:</strong> ${escapeHtml(resumeReference)}</p>`,
    ].join('\n');

    try {
      await strapi.plugin('email').service('email').send({
        to: recipient,
        replyTo: email,
        subject,
        text,
        html,
      });
    } catch (error) {
      strapi.log.error(`Career application ${application.documentId ?? application.id} saved but notification email failed`, error as Error);
      return {
        status: 502,
        body: {
          success: false,
          saved: true,
          notificationFailed: true,
          applicationId: application.documentId ?? application.id,
          error: 'Your application was saved, but the notification could not be sent.',
        },
      };
    }

    return {
      status: 201,
      body: {
        success: true,
        applicationId: application.documentId ?? application.id,
      },
    };
  },
});

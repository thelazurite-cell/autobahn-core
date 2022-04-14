import { Attachment } from './attachment';

export class SpecReadError extends Error {
    attachments: Attachment[] = [];
}

/**
 * chatbot controller
 */

import type { Core } from '@strapi/strapi';

type ChatRole = 'user' | 'assistant';
type ChatMessage = { role: ChatRole; content: string };

type PageContext =
  | { page: 'home'; section?: string }
  | { page: 'careers' }
  | { page: 'blog-list' }
  | { page: 'blog-post'; slug: string }
  | { page: 'not-found' };

const MAX_MESSAGE_LENGTH = 2000;
const MAX_HISTORY_LENGTH = 20;
const KNOWN_PAGES = new Set(['home', 'careers', 'blog-list', 'blog-post', 'not-found']);

function sanitizeHistory(input: unknown): ChatMessage[] {
  if (!Array.isArray(input)) return [];
  return input
    .filter(
      (m): m is ChatMessage =>
        Boolean(m) && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string' && m.content.length <= MAX_MESSAGE_LENGTH,
    )
    .slice(-MAX_HISTORY_LENGTH);
}

function sanitizePageContext(input: any): PageContext {
  const page = input?.page;
  if (!KNOWN_PAGES.has(page)) return { page: 'not-found' };
  if (page === 'blog-post') {
    return typeof input.slug === 'string' && input.slug ? { page, slug: input.slug } : { page: 'not-found' };
  }
  if (page === 'home') {
    return { page, section: typeof input.section === 'string' ? input.section : undefined };
  }
  return { page };
}

export default ({ strapi }: { strapi: Core.Strapi }) => ({
  async sendMessage(ctx: any) {
    const body = ctx.request.body ?? {};
    const message = typeof body.message === 'string' ? body.message.trim() : '';

    if (!message) {
      ctx.status = 400;
      ctx.body = { error: 'A message is required.' };
      return;
    }
    if (message.length > MAX_MESSAGE_LENGTH) {
      ctx.status = 400;
      ctx.body = { error: 'Message is too long.' };
      return;
    }

    const pageContext = sanitizePageContext(body.pageContext);
    const history = sanitizeHistory(body.history);

    try {
      const reply = await strapi.service('api::chatbot.chatbot').reply(message, pageContext, history);
      ctx.body = { reply };
    } catch (err) {
      strapi.log.error('Chatbot request failed', err as Error);
      ctx.status = 502;
      ctx.body = { reply: "I'm having trouble responding right now. Please try again in a moment, or use the contact form." };
    }
  },
});

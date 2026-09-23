/**
 * chatbot service
 *
 * Builds a grounding context bundle from the site's own content types
 * (never duplicated/hardcoded — fetched fresh per request) and calls the
 * AI provider. The provider API key lives only here, server-side.
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

const GEMINI_MODEL = 'gemini-3.5-flash';
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;
const MAX_HISTORY_MESSAGES = 20;
const MAX_TOKENS = 1024;

const SYSTEM_PROMPT_INTRO = `You are the website assistant for Inanovai Technologies, embedded on Inanovai's own website.

Only answer using the CONTEXT block below, which is pulled live from Inanovai's content management system. Do not use outside knowledge about companies, products, or topics unrelated to Inanovai.

Rules:
- Only answer questions about Inanovai Technologies, its ANJU product, services, why Inanovai, careers, blog content, demos, or how to contact Inanovai.
- If the visitor asks something unrelated to Inanovai or this website (general knowledge, other companies, coding help, current events, etc.), politely say you can only help with questions about Inanovai and this website, and suggest the contact form for anything else.
- If the CONTEXT doesn't contain the answer, say you don't have that information rather than guessing, and suggest contacting Inanovai directly.
- Use the CURRENT PAGE note below to resolve pronouns like "this product", "this article", or "this page".
- Keep answers concise and conversational, suited to a small chat widget — a few sentences, not an essay.
- You cannot search the web, send messages, or perform any action outside answering from the provided context.`;

function blocksToText(blocks: unknown): string {
  if (!Array.isArray(blocks)) return '';
  const lines: string[] = [];
  for (const block of blocks as any[]) {
    const children = Array.isArray(block?.children) ? block.children : [];
    const text = children.map((child: any) => (typeof child?.text === 'string' ? child.text : '')).join('');
    if (text.trim()) lines.push(text.trim());
  }
  return lines.join('\n');
}

function section(title: string, body: string): string {
  const trimmed = body.trim();
  return trimmed ? `## ${title}\n${trimmed}\n` : '';
}

async function fetchSingle(uid: string): Promise<any | null> {
  try {
    return await strapi.documents(uid as any).findFirst({});
  } catch {
    return null;
  }
}

async function fetchMany(uid: string, params: Record<string, unknown> = {}): Promise<any[]> {
  try {
    const result = await strapi.documents(uid as any).findMany({ pagination: { pageSize: 100 }, ...params } as any);
    return Array.isArray(result) ? result : [];
  } catch {
    return [];
  }
}

async function buildContactContext(): Promise<string> {
  const contact = await fetchSingle('api::contact.contact');
  if (!contact) return '';
  return section(
    'Contact Inanovai',
    [
      contact.location ? `Location: ${contact.location}` : '',
      contact.website ? `Website: ${contact.website}` : '',
      contact.specialties ? `Specialties: ${contact.specialties}` : '',
    ]
      .filter(Boolean)
      .join('\n'),
  );
}

async function buildHomeContext(): Promise<string> {
  const [
    home,
    serviceSection,
    services,
    whyUsSection,
    whyUs,
    demoSection,
    demos,
    anjuSection,
    capabilities,
    integrations,
    integrationCards,
  ] = await Promise.all([
    fetchMany('api::home.home'),
    fetchSingle('api::service-section.service-section'),
    fetchMany('api::service.service'),
    fetchSingle('api::why-us-section.why-us-section'),
    fetchMany('api::why-us.why-us'),
    fetchSingle('api::demo-section.demo-section'),
    fetchMany('api::demo.demo'),
    fetchSingle('api::anju-section.anju-section'),
    fetchMany('api::anju-capability.anju-capability'),
    fetchMany('api::anju-integration.anju-integration'),
    fetchMany('api::anju-integration-card.anju-integration-card'),
  ]);

  const homeEntry = Array.isArray(home) ? home[0] : home;
  const integration = integrations[0];
  const parts: string[] = [];

  if (homeEntry) {
    parts.push(
      section(
        'Inanovai — Home',
        [homeEntry.heading, homeEntry.headingAccent, homeEntry.description, homeEntry.secondaryDescription]
          .filter(Boolean)
          .join('\n'),
      ),
    );
  }

  if (anjuSection || capabilities.length || integration) {
    parts.push(
      section(
        "ANJU (Inanovai's AI product)",
        [
          anjuSection?.heading,
          anjuSection?.description,
          capabilities.length ? 'Capabilities:\n' + capabilities.map((c: any) => `- ${c.title}: ${c.body}`).join('\n') : '',
          integration?.description ? `Deployment: ${integration.description}` : '',
          integrationCards.length ? 'Integrates with: ' + integrationCards.map((c: any) => c.name).join(', ') : '',
        ]
          .filter(Boolean)
          .join('\n\n'),
      ),
    );
  }

  if (serviceSection || services.length) {
    parts.push(
      section(
        'Services',
        [serviceSection?.description, services.map((s: any) => `- ${s.title} (${s.category}): ${s.description}`).join('\n')]
          .filter(Boolean)
          .join('\n'),
      ),
    );
  }

  if (whyUsSection || whyUs.length) {
    parts.push(
      section(
        'Why Inanovai',
        [whyUsSection?.description, whyUs.map((w: any) => `- ${w.title}: ${w.body}`).join('\n')].filter(Boolean).join('\n'),
      ),
    );
  }

  if (demoSection || demos.length) {
    parts.push(
      section(
        'Demos',
        [demoSection?.description, demos.map((d: any) => `- ${d.title} (${d.category}, ${d.duration}): ${d.description}`).join('\n')]
          .filter(Boolean)
          .join('\n'),
      ),
    );
  }

  return parts.join('\n');
}

async function buildCareersContext(): Promise<string> {
  const [careerSection, careers] = await Promise.all([
    fetchSingle('api::career-section.career-section'),
    fetchMany('api::career.career', { filters: { isActive: true } }),
  ]);

  const parts: string[] = [];
  if (careerSection?.description) parts.push(section('Careers at Inanovai', careerSection.description));

  if (careers.length) {
    const listing = careers
      .map((c: any) =>
        [
          `- ${c.title} (${c.location ?? 'location not specified'}${c.employmentType ? `, ${c.employmentType}` : ''})`,
          c.experience ? `  Experience: ${c.experience}` : '',
          c.description ? `  ${c.description}` : '',
          c.skills ? `  Skills: ${c.skills}` : '',
        ]
          .filter(Boolean)
          .join('\n'),
      )
      .join('\n');
    parts.push(section('Open Positions', listing));
  } else {
    parts.push(section('Open Positions', 'There are no open positions listed right now.'));
  }

  return parts.join('\n');
}

async function buildBlogListContext(): Promise<string> {
  const blogs = await fetchMany('api::blog.blog');
  if (!blogs.length) return '';
  const listing = blogs.map((b: any) => `- "${b.title}" (${b.category ?? 'General'}): ${b.excerpt ?? ''}`).join('\n');
  return section('Blog articles', listing);
}

async function buildBlogPostContext(slug: string): Promise<{ text: string; found: boolean }> {
  const posts = await fetchMany('api::blog.blog', { filters: { slug } });
  const post = posts[0];
  if (!post) return { text: '', found: false };

  const content = blocksToText(post.content);
  return {
    text: section(
      `Current article: "${post.title}"`,
      [post.category ? `Category: ${post.category}` : '', post.excerpt ? `Excerpt: ${post.excerpt}` : '', content]
        .filter(Boolean)
        .join('\n\n'),
    ),
    found: true,
  };
}

async function buildContext(pageContext: PageContext): Promise<{ text: string; pageNote: string; blogPostFound: boolean }> {
  const contactContext = await buildContactContext();

  if (pageContext.page === 'careers') {
    return {
      text: [await buildCareersContext(), contactContext].filter(Boolean).join('\n'),
      pageNote: 'The visitor is currently on the Careers page.',
      blogPostFound: true,
    };
  }

  if (pageContext.page === 'blog-list') {
    return {
      text: [await buildBlogListContext(), contactContext].filter(Boolean).join('\n'),
      pageNote: 'The visitor is currently on the Blog listing page.',
      blogPostFound: true,
    };
  }

  if (pageContext.page === 'blog-post') {
    const { text, found } = await buildBlogPostContext(pageContext.slug);
    return {
      text: [text, contactContext].filter(Boolean).join('\n'),
      pageNote: found
        ? 'The visitor is currently reading a specific blog article — the one titled in the CONTEXT above. When they say "this article", they mean that one.'
        : 'The visitor opened a blog article link that no longer exists.',
      blogPostFound: found,
    };
  }

  if (pageContext.page === 'home') {
    const sectionLabel = pageContext.section ?? 'hero';
    return {
      text: [await buildHomeContext(), contactContext].filter(Boolean).join('\n'),
      pageNote: `The visitor is on the Inanovai homepage, currently scrolled to the "${sectionLabel}" section. When they say "this product", they mean ANJU, Inanovai's AI product.`,
      blogPostFound: true,
    };
  }

  return {
    text: contactContext,
    pageNote: 'The visitor is on a page that does not exist on the Inanovai website (a 404 page).',
    blogPostFound: true,
  };
}

function buildSystemPrompt(pageNote: string, contextText: string): string {
  return [SYSTEM_PROMPT_INTRO, `\nCURRENT PAGE\n${pageNote}`, `\nCONTEXT\n${contextText || '(no content available)'}`].join('\n');
}

async function callGemini(systemPrompt: string, history: ChatMessage[], message: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured on the server.');
  }

  const trimmedHistory = history.slice(-MAX_HISTORY_MESSAGES).filter((m) => m.role === 'user' || m.role === 'assistant');

  // Gemini has no separate history role for the assistant — its turns use
  // "model" instead of "assistant".
  const contents = [...trimmedHistory, { role: 'user', content: message }].map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));

  const response = await fetch(GEMINI_API_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-goog-api-key': apiKey,
    },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: systemPrompt }] },
      contents,
      generationConfig: { maxOutputTokens: MAX_TOKENS },
    }),
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => '');
    throw new Error(`Gemini API request failed with status ${response.status}. ${errText}`);
  }

  const payload = (await response.json()) as any;
  const parts = payload?.candidates?.[0]?.content?.parts;
  const text = Array.isArray(parts) ? parts.map((p: any) => (typeof p?.text === 'string' ? p.text : '')).join('') : '';
  return text.trim();
}

export default ({ strapi }: { strapi: Core.Strapi }) => ({
  async reply(message: string, pageContext: PageContext, history: ChatMessage[]): Promise<string> {
    const { text: contextText, pageNote, blogPostFound } = await buildContext(pageContext);

    if (pageContext.page === 'blog-post' && !blogPostFound) {
      return "I can't find that article anymore — it may have been moved or removed. Try the Blog page for current articles, or use the contact form for anything else.";
    }

    const systemPrompt = buildSystemPrompt(pageNote, contextText);
    const reply = await callGemini(systemPrompt, history, message);
    return reply || "Sorry, I couldn't come up with a response. Could you try rephrasing that?";
  },
});

export async function renderMarkdown(raw: string): Promise<string> {
  // Dynamic imports to handle ES modules in CommonJS environment
  const [marked] = await Promise.all([import('marked')]);

  const file = await marked.parse(raw); // convert markdown to html

  return String(file);
}

import rss from "@astrojs/rss";
import { HOME, SITE } from "@consts";
import { getCollection } from "astro:content";
import MarkdownIt from 'markdown-it';
import sanitizeHtml from 'sanitize-html';
const parser = new MarkdownIt();

type Context = {
  site: string
}

export async function GET(context: Context) {
  const blog = (await getCollection("blog"))
    .filter(post => !post.data.draft);

  const items = blog.sort((a, b) => new Date(b.data.date).valueOf() - new Date(a.data.date).valueOf());

  return rss({
    title: SITE.NAME,
    description: HOME.DESCRIPTION,
    site: context.site,
    items: items.map((item) => ({
      title: item.data.title,
      description: item.data.description,
      pubDate: item.data.date,
      link: `/${item.collection}/${item.id}/`,
      content: item.body && sanitizeHtml(parser.render(item.body), {
        allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img'])
      }),
    })),
  });
}

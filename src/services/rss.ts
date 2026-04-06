import { XMLParser } from 'fast-xml-parser';
import { RssItem } from '../types/rss';

const RSS_URL = 'https://vnexpress.net/rss/the-thao.rss';

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '',
  trimValues: true,
  removeNSPrefix: true,
  parseTagValue: false,
});

const decodeHtml = (html: string): string =>
  html
    .replace(/<!\[CDATA\[|\]\]>/g, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();

const extractImage = (rawItem: Record<string, unknown>): string | undefined => {
  const mediaContent = rawItem['media:content'] as Record<string, string> | undefined;
  if (mediaContent?.url) {
    return mediaContent.url;
  }

  const enclosure = rawItem.enclosure as Record<string, string> | undefined;
  if (enclosure?.url) {
    return enclosure.url;
  }

  const description = (rawItem.description as string | undefined) || '';
  const match = description.match(/<img[^>]+src="([^"]+)"/i);
  return match?.[1];
};

export const fetchSportsRss = async (): Promise<RssItem[]> => {
  const response = await fetch(RSS_URL);
  if (!response.ok) {
    throw new Error(`RSS request failed: ${response.status}`);
  }

  const xml = await response.text();
  const parsed = parser.parse(xml) as {
    rss?: {
      channel?: {
        item?: Record<string, unknown> | Record<string, unknown>[];
      };
    };
  };

  const rawItems = parsed.rss?.channel?.item;
  if (!rawItems) {
    return [];
  }

  const normalizedItems = Array.isArray(rawItems) ? rawItems : [rawItems];

  return normalizedItems
    .map((item) => {
      const title = (item.title as string | undefined)?.trim() || 'Không có tiêu đề';
      const link = (item.link as string | undefined)?.trim() || '';
      const pubDate = (item.pubDate as string | undefined)?.trim();
      const description = (item.description as string | undefined)?.trim();

      return {
        title,
        link,
        pubDate,
        description: description ? decodeHtml(description) : undefined,
        image: extractImage(item),
      } satisfies RssItem;
    })
    .filter((item) => item.link.length > 0);
};

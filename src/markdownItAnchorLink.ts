import MarkdownIt from 'markdown-it';

const anchorLinkReg = /\[.+?\]\(\s*#(\S+?)\s*\)/gi;

function slugify(s: string) {
  // Unicode-friendly
  var spaceRegex = /[ \xA0\u1680\u2000-\u200A\u202F\u205F\u3000]/g;
  return encodeURIComponent(s.replace(spaceRegex, '-').toLowerCase());
}

export function MarkdownItAnchorLink(md: MarkdownIt) {
  md.core.ruler.push('anchorLink', anchorLinkWorker);
}

function anchorLinkWorker(state: any) {
  return state.tokens.map(t => {
    if (
      t.type == 'inline' &&
      t.children &&
      t.children.length &&
      anchorLinkReg.test(t.content)
    ) {
      let matches: RegExpMatchArray | null;
      let links: string[] = [];
      anchorLinkReg.lastIndex = 0;
      while ((matches = anchorLinkReg.exec(t.content))) {
        links.push('#' + slugify(matches[1]));
      }
      let linkCount: number = t.children.reduce(
        (p, c) => (p += c.type == 'link_open' ? 1 : 0),
        0,
      );
      if (linkCount !== links.length) {
        console.log(
          'markdownExtended: Link count and link token count mismatch!',
        );
      } else {
        t.children.map(t => {
          if (t.type == 'link_open') t.attrs = [['href', links.shift()]];
        });
      }
    }
  });
}

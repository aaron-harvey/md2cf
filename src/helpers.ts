import axios from 'axios';
import url from 'url';
import Token from 'markdown-it/lib/token';
import himalaya from 'himalaya';

import { ConfluenceMacro, InlineAsyncData } from './types';
import { btoa } from './utils';
import { zip_deflate, encode64 } from './thirdparty/deflate';
import { unescape } from 'querystring';

export const padBlock = (tabs: number, message = '') =>
  `${'  '.repeat(tabs)}${message}`;

export const isDiagramType = (type: string) =>
  ['ditaa', 'planetuml', 'dot', 'mermaid', 'nomnoml'].includes(type);

export const getParamsTags = (
  token: Token,
  params: string[],
  opts: Record<string, unknown>,
) =>
  params.reduce((acc: string[], attr: string) => {
    const data = token.attrGet(attr) ?? opts[attr];
    if (data !== null && data !== undefined)
      acc.push(
        padBlock(
          token.level,
        `<ac:parameter ac:name="${attr}">${data}</ac:parameter>`
        )
      );
    return acc;
  }, []);

export function macroFactory({
  id,
  name,
  version,
  type,
  params,
  token,
}: ConfluenceMacro) {
  let contentStr = token.content;

  if (type === 'plain-text-body') contentStr = `<![CDATA[${contentStr}]]>`;

  let body =
    type !== 'empty-body'
      ? [
          padBlock(token.level + 1, `<ac:${type}>`),
          padBlock(token.level + 2, `${contentStr}`),
          padBlock(token.level + 1, `</ac:${type}>`),
        ].join('\n')
      : '\n';

  const paramTags = params?.filter
    ? getParamsTags(token, params?.filter, params?.defaults)
    : [];

  return [
    `<ac:structured-macro ac:macro-id="${id}" ac:name="${name}" ac:schema-version="${
      version ?? 1
    }">`,
    ...paramTags.map(i => padBlock(token.level + 1, i)),
    body,
    `</ac:structured-macro>\n`,
  ].join('\n');
}

export const isTaskMarkup = (i: string) => /^\[[\s\-xX]{1}\]\s/.test(i);

/**
 * Takes an array of tokens and returns a new array of task list tokens
 * Task list are inline tokens with:
 * <ul> @ i-2
 *  <li> @ i-2
 *    <p> @ i-1
 *     <inline> containging content that matches [ ] or [x]
 */
export function handleTaskListTokenBlock(tokens: Token[]) {
  let taskCount = 1;

  // Looks like this could be rewritten to utilize state machines to reduce complexity
  return tokens.reduce((arr, token, idx, array) => {
    if (token.type === 'inline' && token.children) {
      if (token.children.length > 1) {
        // slice the first item  since it's just [ ]\s
        token.children = token.children.slice(1);
      } else {
        // otherwise replace the [ ]\s
        token.children[0].content = token.children[0].content
          .replace(/\[[\sXx]{1}\]\s/i, '')
          .trim();
      }
    } else if (token.type === 'list_item_open') {
      token.type = 'task_list_item_open';
      const next = array[idx + 2];
      if (next.type === 'inline') {
        const taskIdToken = new Token('task_list_task_id', '', 0);
        const taskStatusToken = new Token('task_list_task_status', '', 0);

        taskIdToken.level = token.level + 1;
        taskStatusToken.level = token.level + 1;
        taskStatusToken.attrSet(
          'checked',
          `${next.content?.[1]?.toLowerCase() === 'x'}`,
        );
        taskIdToken.attrSet('id', `${taskCount++}`);
        arr.push(token, taskIdToken, taskStatusToken);
        return arr;
      }
    } else if (token.type === 'list_item_close') {
      token.type = 'task_list_item_close';
    } else if (token.type === 'bullet_list_open') {
      token.type = 'task_list_open';
    } else if (token.type === 'bullet_list_close') {
      token.type = 'task_list_close';
    } else if (token.type === 'paragraph_open') {
      token.type = 'task_list_body_open';
    } else if (token.type === 'paragraph_close') {
      token.type = 'task_list_body_close';
    } else {
      console.warn('unknown_token', token);
      return arr;
    }

    arr.push(token);
    return arr;
  }, [] as Token[]);
}


// function removeEmptyNodes(nodes) {
//   return nodes.fiter(node => {
//     if (node.type === 'element') {
//       node.children = removeEmptyNodes(node.children);
//       return true;
//     }
//     return node.content.length;
//   });
// }

// function stripWhitespace(nodes) {
//   return nodes.map(node => {
//     if (node.type === 'element') {
//       node.children = stripWhitespace(node.children);
//     } else {
//       node.content = node.content.trim();
//     }
//     return node;
//   });
// }

function filterForTags(nodes: any[], tag: string) {
  return nodes.filter(node => [node.tagName].includes('svg'));
}

export function extractSVG(content: string) {
  const tokens = himalaya.parse(content, himalaya.parseDefaults);

  try {
    const svg = filterForTags(tokens, 'svg');
    return himalaya.stringify([svg]);
  } catch (err) {
    console.error('generated invalid diagram; skipping', content);
    return '';
  }
}

export async function diagramTextToSVG(obj: InlineAsyncData) {
  let URL: url.URL;
  const type = obj.type;
  const imgType = type === 'ditaa' ? 'png' : 'svg';
  switch (type) {
    // base64 encoded payload
    case 'mermaid': {
      URL = new url.URL(`https://mermaid.ink/svg/${btoa(obj.content)}`);
      break;
    }

    case 'ditaa':
    case 'dot':
    case 'planetuml': {
      const marker = 'uml';
      const payload = `@start${marker}${type === 'ditaa' ? '\nditaa' : ''}\n${
        obj.content
      }\n@end${marker}`;
      console.log(payload);

      const zippedCode = encode64(
        zip_deflate(unescape(encodeURIComponent(payload)), 9),
      );

      // https://www.plantuml.com/plantuml/
      const host = 'http://localhost:8080';

      URL = new url.URL(`${host}/${imgType}/${zippedCode}`);
      console.log(URL.href);
      break;
    }
    default:
      return { id: obj.id, content: 'unknown graph type' };
  }

  const res = await axios.get<string>(URL.toString(), {
    responseType: 'arraybuffer',
  });
  if (!res?.data) {
    return {
      id: obj.id,
      content: 'http error during diagram render',
    };
  }

  let buf = Buffer.from(res.data, 'base64');
  return {
    id: obj.id,
    content: getInlineImageMarkup(
      type === 'ditaa' ? 'png' : 'svg',
      buf.toString('base64'),
    ),
  };
}

const getInlineImageMarkup = (type: 'png' | 'svg', src: string) => {
  return `<img src="data:image/${
    type === 'svg' ? 'svg+xml' : 'png'
  };base64,${src}" alt="diagram">\n`;
};

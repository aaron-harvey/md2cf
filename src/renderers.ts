import Renderer from 'markdown-it/lib/renderer';
import Token from 'markdown-it/lib/token';
import { macroFactory, padBlock } from './helpers';
import { Md2cf } from './md2cf';
import { InlineAsyncData } from './types';

export function renderCustomFence(this: Md2cf, tokens: Token[], idx: number) {
  return `hello ${tokens[idx].content.trim()}\n`;
}

export function renderHtmlScript(this: Md2cf, tokens: Token[], idx: number) {
  const token = tokens[idx];
  const id = token.attrGet('id') || this.idGenerator();
  return macroFactory({
    type: 'plain-text-body',
    name: 'html',
    id,
    token,
  });
}

export function renderTaskList(token: Token) {
  const pad = padBlock(token.level);
  switch (token.type) {
    // ul
    case 'task_list_open':
      return `${pad}<ac:task-list>\n`;
    case 'task_list_close':
      return `${pad}</ac:task-list>\n`;

    // li
    case 'task_list_item_open':
      return `${pad}<ac:task>\n`;
    case 'task_list_item_close':
      return `${pad}</ac:task>\n`;

    // properties
    case 'task_list_task_id':
      return `${pad}<ac:task-id>${token.attrGet('id')}</ac:task-id>\n`;
    case 'task_list_task_status':
      const status =
        token.attrGet('checked') === 'true' ? 'complete' : 'incomplete';
      return `${pad}<ac:task-status>${status}</ac:task-status>\n`;

    // task body
    case 'task_list_body_open':
      return `${pad}<ac:task-body>`;
    case 'task_list_body_close':
      return `</ac:task-body>\n`;

    default:
      return `[renderTaskList] unknown token: ${token.type}`;
  }
}

export function renderDiagram(
  this: Md2cf,
  tokens: Token[],
  idx: number,
  options,
  env,
  self: Renderer,
) {
  const token = tokens[idx];
  const id = this.idGenerator();

  // markdownit doesn't support async renderers
  // one solution:
  //  1. parse the AST and replace content to fetch with an id (stored in env)
  //  2. loop and pull and replace the ids with the fetched data
  //  4. render the AST to html
  const arr: InlineAsyncData[] = env.asyncReplace || [];
  const payload = {
    type: token.type,
    pos: idx,
    content: token.content,
    id,
  };

  token.content = id;
  arr.push(payload);

  env.asyncReplace = arr;
  // TODO: refactor this
  const text = new Token('text', '', 0);
  text.content = `${id}`;
  // html elements need to be wrapped inside of an html script macro
  return renderHtmlScript.call(this, [text], 0);
}

// Handled with css now, but an example of using a confluence macro
// renderAdmonition(token: Token) {
//   switch (token.type) {
//     case 'admonition_open':
//       return `<ac:structured-macro ac:id="${this.idGenerator()}" ac:name="${
//         token.info
//       }" ac:schema-version="1">\n  <ac:parameter ac:name="icon">${Boolean(
//         token.attrGet('icon'),
//       )}</ac:parameter>\n`;
//     case 'admonition_title_open':
//       return `  <ac:parameter ac:name="title">`;
//     case 'admonition_title_close':
//       return '</ac:parameter>\n  <ac:rich-text-body>\n';
//     case 'admonition_close':
//       return '  </ac:rich-text-body>\n</ac:structured-macro>\n';
//     default:
//       return '';
//   }
// }

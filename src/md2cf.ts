import path from 'path';
import mdIt from 'markdown-it';
import mdSup from 'markdown-it-sup';
import mdSub from 'markdown-it-sub';
import mdIns from 'markdown-it-ins';
import mdMark from 'markdown-it-mark';
import mdFootnote from 'markdown-it-footnote';
import mdInlineComments from 'markdown-it-inline-comments';
import mdInclude from 'markdown-it-include';
import mdNomnoml from '@ospatil/markdown-it-nomnoml';
import mdAttr from '@gerhobbelt/markdown-it-attrs';
import mdContainer from 'markdown-it-container';
import mdFence from '@kaishuu0123/markdown-it-fence';
import Token from 'markdown-it/lib/token';
import { assert } from 'tsafe';

import { MarkdownItAdmonition } from './markdownItAdmonition';
import {
  handleTaskListTokenBlock,
  isDiagramType,
  isTaskMarkup,
  macroFactory,
} from './helpers';
import { container_plugin as mdFrontmatter } from './thirdparty/front-matter-parser';
import { initializeIdGenerator } from './utils';
import {
  renderCustomFence,
  renderHtmlScript,
  renderTaskList,
  renderDiagram,
} from './renderers';

const ROOT = 'example';
export class Md2cf extends mdIt {
  metadata: Record<string, unknown> = {};
  idGenerator = initializeIdGenerator(9);

  constructor(options: mdIt.Options & { includeRoot?: string }) {
    super(options);

    const customFences = {
      customrender: renderCustomFence,
      html_script: renderHtmlScript,
      mermaid: renderDiagram,
      planetuml: renderDiagram,
      dot: renderDiagram,
      ditaa: renderDiagram,
    };

    const hookFence =
      (hookName: string, renderFn, marker = '`') =>
      () => {
        mdFence(this, hookName, {
          marker,
          render: renderFn.bind(this),
        });
      };

    const plugins: Array<
      mdIt.PluginWithParams | [mdIt.PluginWithParams, ...any]
    > = [
      // mdTextualUml,
      ...Object.entries(customFences).flatMap(([key, fn]) =>
        hookFence(key, fn),
      ),
      mdNomnoml,
      mdInlineComments,
      mdAttr,
      mdSup,
      mdSub,
      mdIns,
      mdMark,
      mdFootnote,
      [
        mdInclude,
        {
          includeRe: /\!{3}\s*include(.+?)\!{3}/i,
          bracesAreOptional: true,
          root: path.resolve(options.includeRoot || ROOT),
        },
      ],
      MarkdownItAdmonition,
      // MarkdownItAnchorLink,
      // [mdHeadingAnchor, {
      //   anchorClass: '', // default: 'markdown-it-headinganchor'
      //   addHeadingID: true,           // default: true
      //   addHeadingAnchor: true,       // default: true
      //   // slugify: function(str, md) {} // default: 'My Heading' -> 'MyHeading'
      // }],
      mdContainer,
      [
        mdFrontmatter,
        null,
        o => {
          this.metadata = o;
        },
      ],
    ];

    // apply all the plugins
    for (const f of plugins) this.use.apply(this, Array.isArray(f) ? f : [f]);

    // const renderAdmonition = this.renderAdmonition.bind(this);
    const renderFence = this.renderFence.bind(this);
    const superRules = { ...this.renderer.rules };
    const isCustomFence = info => Object.keys(customFences).includes(info);
    this.renderer.rules.fence = (
      tokens: Token[],
      idx: number,
      options: mdIt.Options,
      env,
      self,
    ) => {
      const token = tokens[idx];
      const info = token.info.trim();
      return isDiagramType(info) || isCustomFence(info)
        ? superRules.fence!(tokens, idx, options, env, self)
        : renderFence(token);
    };

    const superRenderToken = this.renderer.renderToken;
    this.renderer.renderToken = function (tokens, idx, options) {
      const token = tokens[idx];
      const type = token.type;

      if (type.startsWith('task_list')) return renderTaskList(token);
      return superRenderToken.call(this, tokens, idx, options);
    };

    // this.renderer.rules.image = (
    //   tokens: Token[],
    //   idx: number,
    //   options: mdIt.Options,
    //   env,
    //   self,
    // ) => {
    //   return superRules.image!.call(this, tokens, idx, options, env, self);
    // };

    // ('image', 'fix_planet_url', function (state) {
    //   return true;
    // })

    /**
     * Parse the inline tokens watching for task lists
     * TODO: This should be moved to a plugin &|| refactored
     */
    this.core.ruler.after('inline', 'confluence-task-lists', function (state) {
      const tokens = state.tokens.slice(0);

      let skipTill: string | null = null;
      let startIdx = 0;
      let initialDepth = 0;
      for (let i = 0; i < tokens.length; i++) {
        const token = tokens[i];

        // A task block was already found, try to track the end
        if (skipTill) {
          // Skip all tokens nested deeper than our start ul
          // OR any non target tokens
          if (token.level > initialDepth || token.type !== skipTill) continue;

          // A nested bullet list
          if (token.type === 'bullet_list_close') {
            assert(
              token.type === skipTill,
              'should be the end of the ul block',
            );
            const modified = handleTaskListTokenBlock(
              tokens.slice(startIdx, i + 1),
            );
            // splice the new stack into state
            state.tokens.splice(startIdx, i + 1 - startIdx, ...modified);
            // skip until the next task list
            skipTill = 'bullet_list_open';
            continue;
          }
        }

        // only worry about opening ul tags
        if (token.type !== 'bullet_list_open') continue;

        // Check if is this a tasklist
        const textToken = tokens[i + 3];
        if (textToken.type === 'inline' && isTaskMarkup(textToken.content)) {
          initialDepth = token.level;
          startIdx = i;
          skipTill = 'bullet_list_close';
          continue;
        }
      }
      return true;
    });
  }

  renderFence(token: Token) {
    const autoCollapse = Number(token.attrGet('autoCollapse'));
    const collapse = Boolean(token.attrGet('collapse')) || autoCollapse > 0;
    const id = token.attrGet('id') || this.idGenerator();
    const type = token.info.trim();

    return macroFactory({
      name: 'code',
      type: 'plain-text-body',
      id,
      params: {
        filter: [
          'title',
          'theme',
          'linenumbers',
          'language',
          'firstline',
          'collapse',
        ],
        defaults: {
          theme: 'RDark',
          get linenumbers() {
            return !!this.language;
          },
          get language() {
            return type || null;
          },
          firstline: 0,
          get collapse() {
            const lines = token.content.split('\n').length;
            return collapse && lines > autoCollapse;
          },
        },
      },
      token,
    });
  }
}

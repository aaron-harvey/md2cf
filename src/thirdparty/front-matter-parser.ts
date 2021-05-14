/**
 * This file was pulled in from `@asleeppiano/markdown-it-frontmatter`
 * due to how it was bundled - tsc & ESM modules are in a weird state currently
 *
 * Notable changes:
 *  - formatting
 *  - removing toml parse
 */
import jsyaml from 'js-yaml';

export function container_plugin(md, options, cb) {
  let min_markers = 3,
    marker_str = '-',
    marker_char = marker_str.charCodeAt(0),
    marker_len = marker_str.length;

  let parse = jsyaml.load;

  function frontMatter(state, startLine, endLine, silent) {
    let pos,
      nextLine,
      marker_count,
      token,
      old_parent,
      old_line_max,
      auto_closed = false,
      start_content,
      start = state.bMarks[startLine] + state.tShift[startLine],
      max = state.eMarks[startLine];

    // Check out the first character quickly,
    // this should filter out most of non-containers
    //
    if (startLine !== 0 || marker_char !== state.src.charCodeAt(start)) {
      return false;
    }

    // Check out the rest of the marker string
    //
    for (pos = start + 1; pos <= max; pos++) {
      if (marker_str[(pos - start) % marker_len] !== state.src[pos]) {
        start_content = pos + 1;
        break;
      }
    }

    marker_count = Math.floor((pos - start) / marker_len);
    if (marker_count < min_markers) {
      return false;
    }
    pos -= (pos - start) % marker_len;

    // Since start is found, we can report success here in validation mode
    //
    if (silent) {
      return true;
    }

    // Search for the end of the block
    //
    nextLine = startLine;

    for (;;) {
      nextLine++;
      if (nextLine >= endLine) {
        // unclosed block should be autoclosed by end of document.
        // also block seems to be autoclosed by end of parent
        break;
      }

      start = state.bMarks[nextLine] + state.tShift[nextLine];
      max = state.eMarks[nextLine];

      if (start < max && state.sCount[nextLine] < state.blkIndent) {
        // non-empty line with negative indent should stop the list:
        // - ```
        //  test
        break;
      }

      if (marker_char !== state.src.charCodeAt(start)) {
        continue;
      }

      if (state.sCount[nextLine] - state.blkIndent >= 4) {
        // closing fence should be indented less than 4 spaces
        continue;
      }

      for (pos = start + 1; pos <= max; pos++) {
        if (marker_str[(pos - start) % marker_len] !== state.src[pos]) {
          break;
        }
      }

      // closing code fence must be at least as long as the opening one
      if (Math.floor((pos - start) / marker_len) < marker_count) {
        continue;
      }

      // make sure tail has spaces only
      pos -= (pos - start) % marker_len;
      pos = state.skipSpaces(pos);

      if (pos < max) {
        continue;
      }

      // found!
      auto_closed = true;
      break;
    }

    old_parent = state.parentType;
    old_line_max = state.lineMax;

    state.parentType = 'container';

    // this will prevent lazy continuations from ever going past our end marker
    state.lineMax = nextLine;
    state.parentType = old_parent;
    state.lineMax = old_line_max;
    state.line = nextLine + (auto_closed ? 1 : 0);

    token = state.push('front_matter', null, 0);
    token.block = true;
    token.map = [startLine, nextLine];
    token.markup = state.src.slice(startLine, pos);
    token.hidden = true;

    const frontmatter = state.src.slice(start_content, start - 1);
    const parsedYaml = parse(frontmatter);
    cb(parsedYaml);

    return true;
  }
  md.block.ruler.before('table', 'front_matter', frontMatter);
}

// import { ConfluenceAPI } from './ConfluenceApi';
// import { ConfluencePage } from './types';

import path from 'path';
// import { walk } from './utils';
import fs from 'fs/promises';

import { Md2cf } from './md2cf';
import { InlineAsyncData } from './types';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { diagramTextToSVG } from './helpers';

const baseUrl = '';
const confluenceUrl = '';
const auth = {
  username: '',
  password: '',
};

const argv = yargs(hideBin(process.argv)).argv;

const file = argv._[0];
if (!file) {
  console.error('missing file or folder input');
  process.exit(1);
}

const parser = new Md2cf({
  xhtmlOut: true,
  breaks: true,
  linkify: true,
  typographer: true,
});

// create a tree from the target dir
const filePath = path.resolve(`dist/${file}`);
fs.readFile(filePath).then(async i => {
  const env = {
    asyncReplace: [] as InlineAsyncData[],
  };
  const tokens = parser.parse(i.toString(), env);

  // console.log(tokens);
  // TODO: utilize the parser to generate ids and change the token content
  let output = parser.renderer.render(tokens, parser.options, env);

  // Convert and replace diagrams with an svg
  const results = await Promise.allSettled(
    env.asyncReplace.map(diagramTextToSVG),
  );

  for (const result of results) {
    if (result.status !== 'fulfilled') {
      console.warn('http error in diagram generation', result);
      continue;
    }
    output = output.replace(result.value.id, result.value.content);
  }

  // console.log('\n', output);
  fs.writeFile('output.html', output);
});

// const tree = walk(DIR).then(i => console.log(i));

// const markup = parser.parse(content, {
//     codeStyling: {
//       linenumbers: false,
//       theme: 'dark',
//     },
//     marked: {
//       gfm: true,
//       breaks: true,
//       baseUrl: baseUrl,
//       smartLists: true,
//     },
//   });

// const confluence = new ConfluenceAPI(confluenceUrl, auth, spaceKey);
// const page: ConfluencePage = {
//   title: "Markdown Test",
//   body: markup,
// };

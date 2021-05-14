import * as path from 'path';
import generate from 'markdown-it-testgen';

import { Md2cf } from './md2cf';
import { initializeIdGenerator } from './utils';

let defaultParser = new Md2cf({
  xhtmlOut: true,
  breaks: true,
  linkify: true,
  typographer: true,
  html: true,
});

const tests = {
  'Task List': [
    'task-lists/single-task-with-list.spec.md',
    'task-lists/single-task-with-other.spec.md',
    'task-lists/single-nested-task.spec.md',
  ],
  'Code Fences': [
    'fences/code-fence-defaults.spec.md',
      'fences/fence-with-attrs.spec.md',
      'fences/custom-fence.spec.md',
      'fences/html-script.spec.md',
  ],
  Admonition: ['admonition/admonition.spec.md'],
  Diagram: [
    'diagrams/mermaid.spec.md',
    'diagrams/planetuml.spec.md',
  ],
};

const testgenFactory = (desc: string, filename: string) => {
  const filepath = path.resolve(`./tests/fixtures/${filename}`);
  return generate(
    filepath,
    {
      desc,
      header: true,
    },
    defaultParser,
  );
};

describe('Confluence Renderer', () => {
  beforeEach(() => {
    // Re-seed the id generator for each md file test
    defaultParser.idGenerator = initializeIdGenerator(5, '42');
  });
  Object.entries(tests).forEach(([desc, files]) => {
    for (const file of files) testgenFactory(desc, file);
  });
});

describe('Demo Render', () => {
  // testgenFactory('Demo', '../../example/adm.md');
  // testgenFactory('Demo', 'demo.spec.md');
});

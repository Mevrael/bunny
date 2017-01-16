
import { parseTemplate } from '../../src/utils/DOM';

parseTemplate('test', {
  title: 'Hello',
  author: {
    name: 'John'
  }
});

const fs = require('fs');

function cleanLines(str) {
  return str
    .split('\n')
    .map(line => line.replace(/\s+$/, ''))
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim() + '\n';
}

function stripCommentsWithAst(code, ext, ts) {
  if (!ts) {
    try {
      ts = require('typescript');
    } catch (_) {}
  }
  if (!ts) return null;
  const isJsx = ext === '.tsx' || ext === '.jsx';
  const scriptKind = ext === '.tsx' ? ts.ScriptKind.TSX :
                     ext === '.jsx' ? ts.ScriptKind.JSX :
                     ext === '.ts'  ? ts.ScriptKind.TS : ts.ScriptKind.JS;

  const sf = ts.createSourceFile('file' + ext, code, ts.ScriptTarget.Latest, true, scriptKind);
  const comments = [];

  function visit(node) {
    const leading = ts.getLeadingCommentRanges(code, node.getFullStart()) || [];
    const trailing = ts.getTrailingCommentRanges(code, node.getEnd()) || [];
    for (const c of [...leading, ...trailing]) comments.push(c);
    ts.forEachChild(node, visit);
  }
  visit(sf);

  const unique = Array.from(new Map(comments.map(c => [c.pos, c])).values());
  unique.sort((a, b) => b.pos - a.pos);

  let result = code;
  let blockCommentsCount = 0;
  let lineCommentsCount = 0;

  for (const c of unique) {
    const commentText = code.slice(c.pos, c.end);
    if (
      commentText.includes('eslint-disable') ||
      commentText.includes('prettier-ignore') ||
      commentText.includes('@license') ||
      commentText.includes('@ts-expect-error') ||
      commentText.includes('@ts-ignore') ||
      commentText.includes('istanbul ignore')
    ) {
      continue;
    }

    if (c.kind === ts.SyntaxKind.MultiLineCommentTrivia) {
      blockCommentsCount++;
    } else {
      lineCommentsCount++;
    }

    result = result.slice(0, c.pos) + result.slice(c.end);
  }

  const cleaned = cleanLines(result.replace(/^\s*\{\s*\}\s*$\n/gm, ''));

  return {
    cleaned,
    blockCommentsCount,
    lineCommentsCount
  };
}

function stripCommentsFromCStyle(content, ext) {
  let result = '';
  let i = 0;
  const len = content.length;

  let blockCommentsCount = 0;
  let lineCommentsCount = 0;

  while (i < len) {
    const ch = content[i];
    const next = i + 1 < len ? content[i + 1] : '';

    // Strings normais (aspas duplas)
    if (ch === '"') {
      let str = ch;
      i++;
      while (i < len) {
        const c = content[i];
        str += c;
        if (c === '\\' && i + 1 < len) {
          str += content[i + 1];
          i += 2;
          continue;
        }
        if (c === '"') {
          i++;
          break;
        }
        i++;
      }
      result += str;
      continue;
    }

    // Caracteres literais ou strings de aspas simples
    if (ch === '\'') {
      let str = ch;
      i++;
      while (i < len) {
        const c = content[i];
        str += c;
        if (c === '\\' && i + 1 < len) {
          str += content[i + 1];
          i += 2;
          continue;
        }
        if (c === '\'') {
          i++;
          break;
        }
        i++;
      }
      result += str;
      continue;
    }

    // Raw strings em Go (crases `...`)
    if (ch === '`') {
      let str = ch;
      i++;
      while (i < len && content[i] !== '`') {
        str += content[i];
        i++;
      }
      if (i < len) {
        str += '`';
        i++;
      }
      result += str;
      continue;
    }

    // Comentário de bloco /* ... */
    if (ch === '/' && next === '*') {
      const startPos = i;
      i += 2;
      while (i < len && !(content[i] === '*' && content[i + 1] === '/')) {
        i++;
      }
      i += 2;
      const commentText = content.slice(startPos, Math.min(i, len));
      if (commentText.includes('@license') || commentText.includes('Package ') && ext === '.go') {
        result += commentText;
      } else {
        blockCommentsCount++;
      }
      continue;
    }

    // Comentário de linha // ...
    if (ch === '/' && next === '/') {
      const startPos = i;
      i += 2;
      while (i < len && content[i] !== '\n') {
        i++;
      }
      const commentText = content.slice(startPos, i);
      if (
        commentText.includes('@license') ||
        commentText.includes('//go:build') ||
        commentText.includes('//go:generate') ||
        commentText.includes('//nolint') ||
        commentText.includes('// @ts-') ||
        commentText.includes('// #pragma')
      ) {
        result += commentText;
      } else {
        lineCommentsCount++;
      }
      continue;
    }

    // PHP shebang ou comentário com #
    if (ext === '.php' && ch === '#' && !result.endsWith('$')) {
      i++;
      while (i < len && content[i] !== '\n') {
        i++;
      }
      lineCommentsCount++;
      continue;
    }

    result += ch;
    i++;
  }

  return {
    cleaned: cleanLines(result),
    blockCommentsCount,
    lineCommentsCount
  };
}

function stripCommentsFromShellOrPython(content) {
  let result = '';
  let i = 0;
  const len = content.length;

  let blockCommentsCount = 0;
  let lineCommentsCount = 0;

  if (content.startsWith('#!')) {
    const firstLineEnd = content.indexOf('\n');
    if (firstLineEnd !== -1) {
      result += content.slice(0, firstLineEnd + 1);
      i = firstLineEnd + 1;
    }
  }

  while (i < len) {
    const ch = content[i];

    // Multiline quotes (Python docstrings ou raw strings """ / ''')
    if ((ch === '"' || ch === '\'') && content.slice(i, i + 3) === ch.repeat(3)) {
      const quoteType = ch.repeat(3);
      result += quoteType;
      i += 3;
      while (i < len && content.slice(i, i + 3) !== quoteType) {
        if (content[i] === '\\' && i + 1 < len) {
          result += content[i] + content[i + 1];
          i += 2;
          continue;
        }
        result += content[i];
        i++;
      }
      if (i < len) {
        result += quoteType;
        i += 3;
      }
      continue;
    }

    // String simples com '
    if (ch === '\'') {
      result += ch;
      i++;
      while (i < len) {
        const c = content[i];
        result += c;
        if (c === '\\' && i + 1 < len) {
          result += content[i + 1];
          i += 2;
          continue;
        }
        if (c === '\'') {
          i++;
          break;
        }
        i++;
      }
      continue;
    }

    // String simples com "
    if (ch === '"') {
      result += ch;
      i++;
      while (i < len) {
        const c = content[i];
        result += c;
        if (c === '\\' && i + 1 < len) {
          result += content[i + 1];
          i += 2;
          continue;
        }
        if (c === '"') {
          i++;
          break;
        }
        i++;
      }
      continue;
    }

    // Comentário #
    if (ch === '#') {
      i++;
      while (i < len && content[i] !== '\n') {
        i++;
      }
      lineCommentsCount++;
      continue;
    }

    result += ch;
    i++;
  }

  return {
    cleaned: cleanLines(result),
    blockCommentsCount: 0,
    lineCommentsCount
  };
}

function stripCommentsFromHtmlAndTemplates(content, ext, ts) {
  let blockCommentsCount = 0;
  let lineCommentsCount = 0;

  // 1. Limpa blocos <!-- ... --> (preserva condicionais <!--[if ...]> e licenças)
  let result = content.replace(/<!--[\s\S]*?-->/g, (match) => {
    if (match.startsWith('<!--[if') || match.includes('@license')) {
      return match;
    }
    blockCommentsCount++;
    return '';
  });

  // 2. Limpa tags <script> internas com parser JS se for Vue/Svelte/Astro/HTML
  result = result.replace(/(<script\b[^>]*>)([\s\S]*?)(<\/script>)/gi, (full, openTag, scriptBody, closeTag) => {
    if (ts) {
      const cleanedScript = stripCommentsWithAst(scriptBody, '.ts', ts);
      if (cleanedScript) {
        blockCommentsCount += cleanedScript.blockCommentsCount;
        lineCommentsCount += cleanedScript.lineCommentsCount;
        return `${openTag}\n${cleanedScript.cleaned}${closeTag}`;
      }
    }
    return full;
  });

  // 3. Limpa tags <style> internas com parser CSS
  result = result.replace(/(<style\b[^>]*>)([\s\S]*?)(<\/style>)/gi, (full, openTag, styleBody, closeTag) => {
    const cleanedCss = stripCommentsFromCss(styleBody);
    blockCommentsCount += cleanedCss.blockCommentsCount;
    return `${openTag}\n${cleanedCss.cleaned}${closeTag}`;
  });

  return {
    cleaned: cleanLines(result),
    blockCommentsCount,
    lineCommentsCount
  };
}

function stripCommentsFromCss(content) {
  let commentsRemoved = 0;
  const cleaned = content.replace(/\/\*[\s\S]*?\*\//g, (match) => {
    if (match.includes('@license')) return match;
    commentsRemoved++;
    return '';
  });

  return {
    cleaned: cleanLines(cleaned),
    blockCommentsCount: commentsRemoved,
    lineCommentsCount: 0
  };
}

function stripCommentsFromConfig(content, ext) {
  let result = '';
  let i = 0;
  const len = content.length;
  let blockCommentsCount = 0;
  let lineCommentsCount = 0;

  const isJsonc = ext === '.jsonc';

  while (i < len) {
    const ch = content[i];
    const next = i + 1 < len ? content[i + 1] : '';

    if (ch === '"' || ch === '\'') {
      const quote = ch;
      result += quote;
      i++;
      while (i < len) {
        const c = content[i];
        result += c;
        if (c === '\\' && i + 1 < len) {
          result += content[i + 1];
          i += 2;
          continue;
        }
        if (c === quote) {
          i++;
          break;
        }
        i++;
      }
      continue;
    }

    if (!isJsonc && ch === '#') {
      i++;
      while (i < len && content[i] !== '\n') {
        i++;
      }
      lineCommentsCount++;
      continue;
    }

    if (isJsonc && ch === '/' && next === '/') {
      i += 2;
      while (i < len && content[i] !== '\n') {
        i++;
      }
      lineCommentsCount++;
      continue;
    }

    if (isJsonc && ch === '/' && next === '*') {
      i += 2;
      while (i < len && !(content[i] === '*' && content[i + 1] === '/')) {
        i++;
      }
      i += 2;
      blockCommentsCount++;
      continue;
    }

    result += ch;
    i++;
  }

  return {
    cleaned: cleanLines(result),
    blockCommentsCount,
    lineCommentsCount
  };
}

module.exports = {
  stripCommentsWithAst,
  stripCommentsFromCStyle,
  stripCommentsFromShellOrPython,
  stripCommentsFromHtmlAndTemplates,
  stripCommentsFromCss,
  stripCommentsFromConfig
};

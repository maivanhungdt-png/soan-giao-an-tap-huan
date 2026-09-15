import {
  Math as DocxMath,
  MathRun,
  MathFraction,
  MathSuperScript,
  MathSubScript,
  MathRadical
} from 'docx';

/**
 * Tìm vị trí đóng ngoặc nhọn tương ứng với ngoặc mở
 */
export function findMatchingBrace(str: string, openIdx: number): number {
  let depth = 0;
  for (let j = openIdx; j < str.length; j++) {
    if (str[j] === '{') depth++;
    else if (str[j] === '}') {
      depth--;
      if (depth === 0) return j;
    }
  }
  return -1;
}

/**
 * Chuyển đổi các ký hiệu LaTeX thông dụng sang ký tự toán học Unicode chuẩn
 */
export function cleanLatexSymbols(latexStr: string): string {
  if (!latexStr) return "";
  let s = latexStr.replace(/^\$\$+|\$\$+$/g, '').replace(/^\$+|\$+$/g, '').trim();

  // Xử lý hệ phương trình / cases
  if (s.includes('\\begin{cases}')) {
    s = s.replace(/\\begin\{cases\}([\s\S]*?)\\end\{cases\}/g, (_m, body) => {
      const casesLines = body.split(/\\\\/).map(l => l.trim()).filter(Boolean);
      return `\\{ ${casesLines.join(' ;  ')} \\}`;
    });
  }

  // Chuẩn hóa phân số rac -> frac
  s = s.replace(/(?<!\\f|\\|f)rac\{/g, 'frac{');

  // Đơn giản hóa \left, \right
  s = s.replace(/\\left\s*([(\[{\\.|])/g, '$1')
       .replace(/\\right\s*([)\]}\\.|])/g, '$1');

  s = s.replace(/\\cdot\b/g, ' · ')
       .replace(/\\times\b/g, ' × ')
       .replace(/\\div\b/g, ' ÷ ')
       .replace(/\\pm\b/g, ' ± ')
       .replace(/\\mp\b/g, ' ∓ ')
       .replace(/\\le(?:q)?\b/g, ' ≤ ')
       .replace(/\\ge(?:q)?\b/g, ' ≥ ')
       .replace(/\\neq?\b/g, ' ≠ ')
       .replace(/\\approx\b/g, ' ≈ ')
       .replace(/\\equiv\b/g, ' ≡ ')
       .replace(/\\sim\b/g, ' ∽ ')
       .replace(/\\Rightarrow\b/g, ' ⇒ ')
       .replace(/\\Leftarrow\b/g, ' ⇐ ')
       .replace(/\\Leftrightarrow\b/g, ' ⇔ ')
       .replace(/\\to\b|\\rightarrow\b/g, ' → ')
       .replace(/\\leftarrow\b/g, ' ← ')
       .replace(/\\perp\b/g, ' ⊥ ')
       .replace(/\\parallel\b/g, ' ∥ ')
       .replace(/\\in\b/g, ' ∈ ')
       .replace(/\\notin\b/g, ' ∉ ')
       .replace(/\\subset(?:eq)?\b/g, ' ⊂ ')
       .replace(/\\supset(?:eq)?\b/g, ' ⊃ ')
       .replace(/\\cup\b/g, ' ∪ ')
       .replace(/\\cap\b/g, ' ∩ ')
       .replace(/\\emptyset\b/g, ' ∅ ')
       .replace(/\\pi\b/g, ' π ')
       .replace(/\\alpha\b/g, ' α ')
       .replace(/\\beta\b/g, ' β ')
       .replace(/\\gamma\b/g, ' γ ')
       .replace(/\\theta\b/g, ' θ ')
       .replace(/\\lambda\b/g, ' λ ')
       .replace(/\\mu\b/g, ' μ ')
       .replace(/\\sigma\b/g, ' σ ')
       .replace(/\\Delta\b/g, ' Δ ')
       .replace(/\\forall\b/g, ' ∀ ')
       .replace(/\\exists\b/g, ' ∃ ')
       .replace(/\\circ\b|\^\\circ\b/g, '°')
       .replace(/\\angle\b|\\sphericalangle\b/g, ' ∠ ')
       .replace(/\\widehat\{([^}]+)\}/g, '∠$1')
       .replace(/\\vec\{([^}]+)\}/g, '$1')
       .replace(/\\overrightarrow\{([^}]+)\}/g, '$1')
       .replace(/\\overline\{([^}]+)\}/g, '$1')
       .replace(/\\underline\{([^}]+)\}/g, '$1')
       .replace(/\\\{/g, '{')
       .replace(/\\\}/g, '}')
       .replace(/\\text\{([^}]+)\}/g, '$1')
       .replace(/\\mathrm\{([^}]+)\}/g, '$1')
       .replace(/\\mathbf\{([^}]+)\}/g, '$1')
       .replace(/\\mathit\{([^}]+)\}/g, '$1')
       .replace(/\\quad|\\qquad|\\;|\\,|\\!/g, ' ');

  // Xóa các backslash còn sót lại không thuộc frac hoặc sqrt
  s = s.replace(/\\(?!frac|sqrt)/g, '');

  return s;
}

/**
 * Chuyển đổi mã LaTeX thành phần tử docx.Math (OMML) chuẩn hiển thị trong Microsoft Word
 */
export function parseLatexToDocxMath(latexStr: string): DocxMath | null {
  if (!latexStr || typeof latexStr !== 'string') return null;
  const s = cleanLatexSymbols(latexStr);
  if (!s.trim()) return null;

  function parseSegment(str: string): any[] {
    const tokens: any[] = [];
    let i = 0;
    while (i < str.length) {
      // 1. Fractions: frac{num}{den}
      if (str.startsWith('frac{', i)) {
        const open1 = i + 4;
        const close1 = findMatchingBrace(str, open1);
        if (close1 !== -1 && str[close1 + 1] === '{') {
          const open2 = close1 + 1;
          const close2 = findMatchingBrace(str, open2);
          if (close2 !== -1) {
            const numText = str.substring(open1 + 1, close1);
            const denText = str.substring(open2 + 1, close2);
            tokens.push(new MathFraction({
              numerator: parseSegment(numText),
              denominator: parseSegment(denText)
            }));
            i = close2 + 1;
            continue;
          }
        }
      }

      // 2. Radicals: sqrt{rad}
      if (str.startsWith('sqrt{', i)) {
        const open = i + 4;
        const close = findMatchingBrace(str, open);
        if (close !== -1) {
          const radText = str.substring(open + 1, close);
          tokens.push(new MathRadical({
            children: parseSegment(radText)
          }));
          i = close + 1;
          continue;
        }
      }

      // 3. Superscripts: ^exp hoặc ^{exp}
      if (str[i] === '^') {
        let expText = '';
        let endIdx = i + 1;
        if (str[i + 1] === '{') {
          const close = findMatchingBrace(str, i + 1);
          if (close !== -1) {
            expText = str.substring(i + 2, close);
            endIdx = close + 1;
          } else {
            expText = str[i + 1] || '';
            endIdx = i + 2;
          }
        } else {
          expText = str[i + 1] || '';
          endIdx = i + 2;
        }

        const lastToken = tokens.pop();
        if (lastToken) {
          tokens.push(new MathSuperScript({
            children: [lastToken],
            superScript: parseSegment(expText)
          }));
        } else {
          tokens.push(new MathSuperScript({
            children: [new MathRun('')],
            superScript: parseSegment(expText)
          }));
        }
        i = endIdx;
        continue;
      }

      // 4. Subscripts: _sub hoặc _{sub}
      if (str[i] === '_') {
        let subText = '';
        let endIdx = i + 1;
        if (str[i + 1] === '{') {
          const close = findMatchingBrace(str, i + 1);
          if (close !== -1) {
            subText = str.substring(i + 2, close);
            endIdx = close + 1;
          } else {
            subText = str[i + 1] || '';
            endIdx = i + 2;
          }
        } else {
          subText = str[i + 1] || '';
          endIdx = i + 2;
        }

        const lastToken = tokens.pop();
        if (lastToken) {
          tokens.push(new MathSubScript({
            children: [lastToken],
            subScript: parseSegment(subText)
          }));
        } else {
          tokens.push(new MathSubScript({
            children: [new MathRun('')],
            subScript: parseSegment(subText)
          }));
        }
        i = endIdx;
        continue;
      }

      // 5. Plain text segment
      let plain = '';
      while (
        i < str.length &&
        !str.startsWith('frac{', i) &&
        !str.startsWith('sqrt{', i) &&
        str[i] !== '^' &&
        str[i] !== '_'
      ) {
        plain += str[i];
        i++;
      }
      if (plain) {
        tokens.push(new MathRun(plain));
      }
    }
    return tokens.length > 0 ? tokens : [new MathRun('')];
  }

  const elements = parseSegment(s);
  return new DocxMath({ children: elements });
}

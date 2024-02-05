let index = 0;
 let input = '';
const logging = false;

export function setInput(newInput) {
  input = newInput;
  index = 0;
}

export function getIndex() {
  return index;
}

export function parseSolid(data) {
  input = data;
  console.time('parsing');
  any(space);
  expect('solid');
  many(space);
  let name = many(alphaNumeric).join('');
  console.info(`solid \'${name}\'`);
  any(space);
  expect('\n');
  const facets = many(parseFacet);
  // many(space);
  // expect('endsolid BOLLEN');

  console.timeEnd('parsing');
  return { facets, stlName: name };
}

export function parseFacet() {
  any(space);
  expect('facet normal');
  many(space);
  const x = parseNumber();
  many(space);
  const y = parseNumber();
  many(space);
  const z = parseNumber();
  expect('\n');

  many(whitespace);
  expect('outer loop');
  expect('\n');

  const v1 = parseVertex();
  const v2 = parseVertex();
  const v3 = parseVertex();
  // console.log(v1,v2,v3);
  many(whitespace);
  expect('endloop');
  expect('\n');
  any(space);
  expect('endfacet');
  expect('\n');

  const normal = { x, y, z };
  return {
    normal,
    v1,
    v2,
    v3,
  };
}

export function parseScientificNumber() {
  const start = index;
  optional(() => expect('-'));
  many(digit);
  expect('.');
  many(digit);
  either(
    () => expect('e'),
    () => expect('E')
  );
  either(
    () => expect('+'),
    () => expect('-')
  );
  many(digit);
  const str = input.slice(start, index);
  // console.log(str);
  return parseFloat(str);
}

export function parseVertex() {
  if (logging) console.log('parseVertex', input, index);
  any(whitespace);
  const line = parseLine();
  if (logging) console.log('line', line);
  const parts = line.split(' ');
  if (logging) console.log(parts);
  const x = tryParseFloat(parts[1]);
  const y = tryParseFloat(parts[2]);
  const z = tryParseFloat(parts[3]);

  // many(whitespace);
  // expect('vertex');
  // many(space);

  // const x = parseNumber();

  // many(space);
  // const y = parseNumber();

  // many(space);
  // const z = parseNumber();

  // expect('\n');

  return { x, y, z };
}

function tryParseFloat(str) {
  const num = parseFloat(str);
  if (isNaN(num)) throw new ParseError(str + ' is not a number');
  return num;
}

function parseLine() {
  // if (logging) console.log('parseLine', input, index);
  const line = any(anyChar).join('');
  expect('\n');

  return line;
}

function optional(parser) {
  const savedIndex = index;
  try {
    return parser();
  } catch (ParseError) {
    if (logging) console.log(' ignore');
    index = savedIndex;
  }
}

export function expect(str) {
  let localIndex = 0;
  // console.log(index);
  // console.log(str[localIndex])
  // console.log(index,  input[index+localIndex])
  while (localIndex < str.length) {
    const expected = str[localIndex];
    const actual = input[index + localIndex];
    logging && console.log(`expected: '${expected}' got '${actual}'`);
    if (expected != actual)
      throw new ParseError(
        `expected '${expected}' (${expected.charCodeAt(
          0
        )}) but got '${actual}' (${actual.charCodeAt(0)})`
      );

    if (logging) console.log(str[localIndex]);

    localIndex++;
  }
  index += localIndex;
  return str;
}

function any(parser) {
  const list = [];
  do {
    try {
      const result = parser();
      if (logging) console.log('result', result);
      list.push(result);
    } catch (ParseError) {
      return list;
    }
  } while (true);
}

export function many(parser) {
  return [parser()].concat(any(parser));
}

function space() {
  logging && console.log('space');
  return expect(' ');
}

function tab() {
  return expect('\t');
}

function whitespace() {
  return either(space, tab);
}

// anything but \n
function anyChar() {
  // if (logging) console.log(' anyChar', input, index);
  const str = input[index];
  const code = str.charCodeAt(0);
  if (code == '\n'.charCodeAt(0)) {
    throw new ParseError('newline is not a char');
  }

  index++;
  return str;
}

// consume alpha
function alpha() {
  const str = input[index];
  const code = str.charCodeAt(0);
  if (
    !(code > 64 && code < 91) && // upper alpha (A-Z)
    !(code > 96 && code < 123)
  ) {
    // lower alpha (a-z)
    throw new ParseError(str + ' is not alpha');
  }

  // console.log(str);
  index++;
  return str;
}

// consume alpha or numeric
function alphaNumeric() {
  const str = input[index];
  const code = str.charCodeAt(0);
  if (
    !(code > 47 && code < 58) && // numeric (0-9)
    !(code > 64 && code < 91) && // upper alpha (A-Z)
    !(code > 96 && code < 123)
  ) {
    // lower alpha (a-z)
    throw new ParseError(str + ' is not alphanumeric');
  }

  if (logging) console.log(str);
  index++;
  return str;
}

// doesnt work with optional
export function digit() {
  logging && console.log('digit');
  const str = input[index];
  const code = str.charCodeAt(0);
  if (!(code > 47 && code < 58)) {
    throw new ParseError(str + ' is not numeric');
  }

  if (logging) console.log(str);
  index++;
  return str;
}

function either(p1, p2) {
  try {
    return p1();
  } catch (ParseError) {
    return p2();
  }
}

export function sequence(p1, p2) {
  const result1 = p1();
  const result2 = p2();
  return [result1, result2];
}

export function parseNumber() {
  logging && console.log('parseNumber');
  return either(parseFPNumber, parseScientificNumber);
}

export function parseFPNumber() {
  const start = index;
  optional(() => expect('-'));
  optional(() => sequence(() => many(digit), () => expect('.') ) );

  many(digit);
  return parseFloat(input.slice(start, index));
}

class ParseError extends Error {}

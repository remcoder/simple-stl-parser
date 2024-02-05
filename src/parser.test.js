import {
  parseFacet,
  parseSolid,
  parseVertex,
  parseFPNumber,
  digit,
  setInput, parseNumber, parseScientificNumber,
  sequence,
  expect,
  many
} from './parser';
import { it, expect as test, describe, beforeEach  } from 'vitest';

beforeEach(() => {
  setInput('')
});

describe('parse', () => {
  it('should parse a simple stl', () => {
    const data = `solid mesh
    facet normal 0 0 0
      outer loop
        vertex 0 0 0
        vertex 1 0 0
        vertex 1 1 0
      endloop
     endfacet
    facet normal 0 0 0
      outer loop
        vertex 0 0 0
        vertex 1 0 0
        vertex 1 1 1
      endloop
     endfacet
    facet normal 0 0 0
      outer loop
        vertex 0 0 0
        vertex 1 1 0
        vertex 1 1 1
      endloop
     endfacet
    facet normal 0 0 0
      outer loop
        vertex 1 0 0
        vertex 1 1 0
        vertex 1 1 1
      endloop
     endfacet
   endsolid m`;
    const result = parseSolid(data);
  });
});

// test facet

describe('parseFacet', () => {
  it('should parse a facet', () => {
    const data = `facet normal 0 0 0
    outer loop
      vertex 0 0 0
      vertex 1 0 0
      vertex 1 1 0
    endloop
   endfacet
   `;
    setInput(data);
    const result = parseFacet();
    // console.log(result);
  });
});

// test vertex

describe('parseVertex', () => {
  it('should parse a vertex', () => {
    const data = `vertex 1 4.2 -3\n`;
    setInput(data);
    const result = parseVertex();
    test(result).toEqual({ x: 1, y: 4.2, z: -3 });
  });

  it('should parse a vertex with scientific notiation', () => {
    const data = `vertex -1e-1 4.2 -3\n`;
    setInput(data);
    const result = parseVertex();
    test(result).toEqual({ x: -0.1, y: 4.2, z: -3 });
  });
});

// test number
describe('parseNumber', () => {
  it('should parse a single digit', () => {
    const data = `0`;
    setInput(data);
    const result = parseNumber();
  });

  it('should parse a decimal', () => {
    const data = `0.42`;
    setInput(data);
    const result = parseNumber();
  });

  it('should parse a number in scientific notation', () => {
    const data = `1E-1`;
    setInput(data);
    const result = parseNumber();
    test(result).toEqual(0.1);
  });

  it('should parse a number in scientific notation', () => {
    const data = `0.955654E-01`;
    setInput(data);
    const result = parseNumber();
    test(result).toEqual(0.0955654);
  });

  it('should parse a number in scientific notation', () => {
    const data = `-1.000000e+000`;
    setInput(data);
    const result = parseNumber();
    test(result).toEqual(-1);
  });
});

// test float
describe('parse float', () => {
  it('should parse a single digit', () => {
    const data = `0`;
    setInput(data);
    const result = parseFPNumber();
  });

  it('should parse a negative integer', () => {
    const data = `-1`;
    setInput(data);
    const result = parseFPNumber();
  });

  it('should parse a decimal', () => {
    const data = `1.2`;
    setInput(data);
    const result = parseFPNumber();
    test(result).toEqual(1.2);
  });

  it('should parse a negative decimal', () => {
    const data = `-42.84`;
    setInput(data);
    const result = parseFPNumber();
    test(result).toEqual(-42.84);
  });
});

describe('scientific notation', () => {
  it('should parse a number in scientific notation', () => {
    const data = `1E-1`;
    setInput(data);
    const result = parseScientificNumber();
    test(result).toEqual(0.1);
  });

  it('should parse a number in scientific notation', () => {
    const data = `0.955654E-01`;
    setInput(data);
    const result = parseScientificNumber();
    test(result).toEqual(0.0955654);
  });

  it('should parse a number in scientific notation', () => {
    const data = `-1.000000e+000`;
    setInput(data);
    const result = parseScientificNumber();
    test(result).toEqual(-1);
  });
  
  
});


// test digit
describe('parseDigit', () => {
  it('should parse a digit', () => {
    const data = `0`;
    setInput(data);
    const result = digit();
  });
});

describe('sequence', () => {
  it('should parse a sequence', () => {
    const data = `ab`;
    setInput(data);
    const result = sequence(() => expect('a'), ()=> expect('b'));
  });

  it('should parse a partial sequence', () => {
    const data = `abc`;
    setInput(data);
    const result = sequence(() => expect('a'), ()=> expect('b'));
  });

  it('should parse a sequence', () => {
    const data = `ab`;
    setInput(data);
    const result = sequence(() => expect('a'), ()=> expect('b'));
    
  });

  it('should not parse an invalid sequence', () => {
    const data = `ab`;
    setInput(data);
    const result = test (() => sequence(() => expect('x'), ()=> expect('y'))).toThrow();
  });

  it('should parse an variable length sequence', () => {
    const data = `1.`;
    setInput(data);
    const result = sequence(() => many(digit), () => expect('.') );
  });

  it('should parse an variable length sequence', () => {
    const data = `11.`;
    setInput(data);
    const result = sequence(() => many(digit), () => expect('.') );
  });
});
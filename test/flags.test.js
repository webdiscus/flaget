import { describe, test, expect } from 'vitest';
import { splitCli } from './utils/helpers.js';

import flaget from './utils/testLoader.js';

describe('flaget - flags', () => {
  test('parse long flag with value', () => {
    const cli = '--name value';
    const cliParams = flaget({ raw: cli.split(' ') });
    expect(cliParams).toEqual({ args: {}, flags: { name: 'value' }, _: [], _tail: [] });
  });

  test('parse negative flags', () => {
    const cli = '--no-foo';
    const cliParams = flaget({ raw: cli.split(' ') });
    expect(cliParams).toEqual({ args: {}, flags: { foo: false }, _: [], _tail: [] });
  });

  test('parse long flag with equals', () => {
    const cli = '--port=8080 --my-port=8080';
    const cliParams = flaget({ raw: cli.split(' ') });
    expect(cliParams).toEqual({
      args: {},
      flags: { port: 8080, 'my-port': 8080, myPort: 8080 },
      _: [],
      _tail: [],
    });
  });

  test('parse boolean true/false values', () => {
    const cli = '--debug=true --verbose=false';
    const cliParams = flaget({ raw: cli.split(' ') });
    expect(cliParams).toEqual({
      args: {},
      flags: { debug: true, verbose: false },
      _: [],
      _tail: []
    });
  });

  test('parse flag without value as true', () => {
    const cli = '--name value --try-draft -v';
    const cliParams = flaget({ raw: cli.split(' ') });
    expect(cliParams).toEqual({
      args: {},
      flags: {
        name: 'value',
        'try-draft': true,
        tryDraft: true,
        v: true,
      },
      _: [],
      _tail: []
    });
  });

  test('parse last flag without value as true', () => {
    const cli = '--name value --try-draft';
    const cliParams = flaget({ raw: cli.split(' ') });
    expect(cliParams).toEqual({
      args: {},
      flags: {
        name: 'value',
        'try-draft': true,
        tryDraft: true,
      },
      _: [],
      _tail: []
    });
  });

  test('parse values with spaces', () => {
    const cli = `--key1 'foo bar' --key2="foo bar" -- "two words"`;
    const cliParams = flaget({ raw: splitCli(cli) });
    expect(cliParams).toEqual({
      args: {},
      flags: {
        key1: 'foo bar',
        key2: 'foo bar',
      },
      _: [],
      _tail: ['two words']
    });
  });

  test('parse numeric values', () => {
    const cli = '--num 42 --pi 3.14';
    const cliParams = flaget({ raw: cli.split(' ') });
    expect(cliParams).toEqual({
      args: {},
      flags: { num: 42, pi: 3.14 },
      _: [],
      _tail: []
    });
  });

  test('parse short flags grouped', () => {
    const cli = '-abc';
    const cliParams = flaget({ raw: cli.split(' ') });
    expect(cliParams).toEqual({
      args: {},
      flags: { a: true, b: true, c: true },
      _: [],
      _tail: []
    });
  });

  test('parse short flag with value', () => {
    const cli = '-n 123';
    const cliParams = flaget({ raw: cli.split(' ') });
    expect(cliParams).toEqual({
      args: {},
      flags: { n: 123 },
      _: [],
      _tail: []
    });
  });

  test('parse multi-value flags', () => {
    const cli = '--tag a b --tag=c';
    const cliParams = flaget({
      raw: cli.split(' '),
      array: ['tag'],
    });
    expect(cliParams).toEqual({
      args: {},
      flags: { tag: ['a', 'b', 'c'] },
      _: [],
      _tail: []
    });
  });

  test('parse positional args', () => {
    const cli = 'pos1 --flag val pos2';
    const cliParams = flaget({ raw: cli.split(' ') });
    expect(cliParams).toEqual({
      args: {},
      flags: { flag: 'val' },
      _: ['pos1', 'pos2'],
      _tail: []
    });
  });

  test('stop parsing at --', () => {
    const cli = '--flag val -- --not-a-flag other';
    const cliParams = flaget({ raw: cli.split(' ') });
    expect(cliParams).toEqual({
      args: {},
      flags: { flag: 'val' },
      _: [],
      _tail: ['--not-a-flag', 'other']
    });
  });

  test('use alias for long key', () => {
    const cli = '--f val';
    const cliParams = flaget({ raw: cli.split(' '), alias: { f: 'foo' } });
    expect(cliParams).toEqual({
      args: {},
      flags: { foo: 'val' },
      _: [],
      _tail: []
    });
  });

  test('use short and long', () => {
    const cli = '-f a.js --file b.js';
    const cliParams = flaget({ raw: cli.split(' ') });
    expect(cliParams).toEqual({
      args: {},
      flags: { f: 'a.js', file: 'b.js' },
      _: [],
      _tail: []
    });
  });

  test('use short and alias', () => {
    const cli = '-f a.js --file b.js';
    const cliParams = flaget({ raw: cli.split(' '), alias: { f: 'file' } });
    expect(cliParams).toEqual({
      args: {},
      flags: { file: 'b.js' },
      _: [],
      _tail: []
    });
  });

  test('use short and alias with multi values', () => {
    const cli = '-f a.js --files b.js';
    const cliParams = flaget({ raw: cli.split(' '), alias: { f: 'files' }, array: ['files'] });
    expect(cliParams).toEqual({
      args: {},
      flags: { files: ['a.js', 'b.js'] },
      _: [],
      _tail: []
    });
  });

  test('use all options', () => {
    const cli = 'report -abc --force --cached=false --type=json --dash-flag value -l 20 -f a.js b.js --files c.js d.js -- one --two';
    const cliParams = flaget({
      raw: cli.split(' '),
      alias: { f: 'files', l: 'limit' },
      array: ['files'],
      default: { type: 'yaml', verbose: false },
    });

    expect(cliParams).toEqual({
      args: {},
      flags: {
        a: true,
        b: true,
        c: true,
        type: 'json',
        'dash-flag': 'value',
        dashFlag: 'value',
        force: true,
        cached: false,
        limit: 20,
        files: ['a.js', 'b.js', 'c.js', 'd.js'],
        verbose: false,
      },
      _: ['report'],
      _tail: ['one', '--two']
    });
  });

  test('last value wins', () => {
    const cli = '--tag=beta --tag=release';
    const cliParams = flaget({ raw: cli.split(' ') });
    expect(cliParams).toEqual({ args: {}, flags: { tag: 'release' }, _: [], _tail: [] });
  });

  test('last value wins, negated flag', () => {
    const cli = '--tag x --no-tag';
    const cliParams = flaget({ raw: cli.split(' ') });
    expect(cliParams).toEqual({ args: {}, flags: { tag: false }, _: [], _tail: [] });
  });

  test('apply default values', () => {
    const cliParams = flaget({ raw: [], default: { mode: 'production', output: 'dist' } });
    expect(cliParams).toEqual({
      args: {},
      flags: { mode: 'production', output: 'dist' },
      _: [],
      _tail: []
    });
  });
});

describe('flaget - negative numbers', () => {
  test('negative number as next argument is a value', () => {
    const cli = '--offset -5';
    const cliParams = flaget({ raw: cli.split(' ') });
    expect(cliParams).toEqual({ args: {}, flags: { offset: -5 }, _: [], _tail: [] });
  });

  test('negative decimal number as next argument is a value', () => {
    const cli = '--offset -0.5';
    const cliParams = flaget({ raw: cli.split(' ') });
    expect(cliParams).toEqual({ args: {}, flags: { offset: -0.5 }, _: [], _tail: [] });
  });

  test('negative number after short alias', () => {
    const cli = '-o -5';
    const cliParams = flaget({ raw: cli.split(' '), alias: { o: 'offset' } });
    expect(cliParams).toEqual({ args: {}, flags: { offset: -5 }, _: [], _tail: [] });
  });

  test('negative number in array', () => {
    const cli = '--range -5 10';
    const cliParams = flaget({ raw: cli.split(' '), array: ['range'] });
    expect(cliParams).toEqual({ args: {}, flags: { range: [-5, 10] }, _: [], _tail: [] });
  });

  test('dash with a letter is a flag', () => {
    const cli = '--offset -x';
    const cliParams = flaget({ raw: cli.split(' ') });
    expect(cliParams).toEqual({
      args: {},
      flags: { offset: true, x: true },
      _: [],
      _tail: [],
    });
  });
});

describe('flaget - short flag with equals', () => {
  test('number value', () => {
    const cli = '-n=007';
    const cliParams = flaget({ raw: cli.split(' ') });
    expect(cliParams).toEqual({ args: {}, flags: { n: 7 }, _: [], _tail: [] });
  });

  test('text value', () => {
    const cli = '-n=abc';
    const cliParams = flaget({ raw: cli.split(' ') });
    expect(cliParams).toEqual({ args: {}, flags: { n: 'abc' }, _: [], _tail: [] });
  });

  test('empty value gives empty string', () => {
    const cli = '-n=';
    const cliParams = flaget({ raw: cli.split(' ') });
    expect(cliParams).toEqual({ args: {}, flags: { n: '' }, _: [], _tail: [] });
  });

  test('alias with negative number', () => {
    const cli = '-o=-5';
    const cliParams = flaget({ raw: cli.split(' '), alias: { o: 'offset' } });
    expect(cliParams).toEqual({ args: {}, flags: { offset: -5 }, _: [], _tail: [] });
  });

  test('last flag in group takes value after equals', () => {
    const cli = '-abn=5';
    const cliParams = flaget({ raw: cli.split(' ') });
    expect(cliParams).toEqual({
      args: {},
      flags: { a: true, b: true, n: 5 },
      _: [],
      _tail: [],
    });
  });

  test('attached value without equals stays a group', () => {
    const cli = '-n007';
    const cliParams = flaget({ raw: cli.split(' ') });
    expect(cliParams).toEqual({
      args: {},
      flags: { n: true, 0: true, 7: true },
      _: [],
      _tail: [],
    });
  });
});

import { describe, test, expect } from 'vitest';

import flaget from './utils/testLoader.js';

describe('flaget - option string, long flags', () => {
  test('keep leading zeros', () => {
    const cli = '--name=007 --head=3';
    const cliParams = flaget({ raw: cli.split(' '), string: ['name'] });
    expect(cliParams).toEqual({
      args: {},
      flags: { name: '007', head: 3 },
      _: [],
      _tail: [],
    });
  });

  test('keep leading zeros, value as next argument', () => {
    const cli = '--name 007';
    const cliParams = flaget({ raw: cli.split(' '), string: ['name'] });
    expect(cliParams).toEqual({ args: {}, flags: { name: '007' }, _: [], _tail: [] });
  });

  test('keep trailing zeros', () => {
    const cli = '--version=1.10';
    const cliParams = flaget({ raw: cli.split(' '), string: ['version'] });
    expect(cliParams).toEqual({ args: {}, flags: { version: '1.10' }, _: [], _tail: [] });
  });

  test('keep true and false as text', () => {
    const cli = '--yes=true --no=false';
    const cliParams = flaget({ raw: cli.split(' '), string: ['yes', 'no'] });
    expect(cliParams).toEqual({
      args: {},
      flags: { yes: 'true', no: 'false' },
      _: [],
      _tail: [],
    });
  });

  test('no value at the end gives empty string', () => {
    const cli = '--name';
    const cliParams = flaget({ raw: cli.split(' '), string: ['name'] });
    expect(cliParams).toEqual({ args: {}, flags: { name: '' }, _: [], _tail: [] });
  });

  test('no value before another flag gives empty string', () => {
    const cli = '--name --other';
    const cliParams = flaget({ raw: cli.split(' '), string: ['name'] });
    expect(cliParams).toEqual({
      args: {},
      flags: { name: '', other: true },
      _: [],
      _tail: [],
    });
  });

  test('empty value after equals gives empty string', () => {
    const cli = '--name=';
    const cliParams = flaget({ raw: cli.split(' '), string: ['name'] });
    expect(cliParams).toEqual({ args: {}, flags: { name: '' }, _: [], _tail: [] });
  });

  test('negative number as next argument is a value', () => {
    const cli = '--name -5';
    const cliParams = flaget({ raw: cli.split(' '), string: ['name'] });
    expect(cliParams).toEqual({ args: {}, flags: { name: '-5' }, _: [], _tail: [] });
  });

  test('negated flag gives false', () => {
    const cli = '--no-name';
    const cliParams = flaget({ raw: cli.split(' '), string: ['name'] });
    expect(cliParams).toEqual({ args: {}, flags: { name: false }, _: [], _tail: [] });
  });

  test('dashed flag', () => {
    const cli = '--my-name=007';
    const cliParams = flaget({ raw: cli.split(' '), string: ['my-name'] });
    expect(cliParams).toEqual({
      args: {},
      flags: { 'my-name': '007', myName: '007' },
      _: [],
      _tail: [],
    });
  });

  test('default value is not changed', () => {
    const cliParams = flaget({ raw: [], string: ['name'], default: { name: 7 } });
    expect(cliParams).toEqual({ args: {}, flags: { name: 7 }, _: [], _tail: [] });
  });
});

describe('flaget - option string with alias', () => {
  test('alias follows its long name', () => {
    const cli = '-n 007';
    const cliParams = flaget({ raw: cli.split(' '), alias: { n: 'name' }, string: ['name'] });
    expect(cliParams).toEqual({ args: {}, flags: { name: '007' }, _: [], _tail: [] });
  });

  test('alias in group follows its long name', () => {
    const cli = '-abn 007';
    const cliParams = flaget({ raw: cli.split(' '), alias: { n: 'name' }, string: ['name'] });
    expect(cliParams).toEqual({
      args: {},
      flags: { a: true, b: true, name: '007' },
      _: [],
      _tail: [],
    });
  });
});

describe('flaget - option string with array', () => {
  test('array of strings', () => {
    const cli = '--keys 01 02';
    const cliParams = flaget({ raw: cli.split(' '), array: ['keys'], string: ['keys'] });
    expect(cliParams).toEqual({ args: {}, flags: { keys: ['01', '02'] }, _: [], _tail: [] });
  });

  test('array of strings, flag given several times', () => {
    const cli = '--keys=01 --keys 02';
    const cliParams = flaget({ raw: cli.split(' '), array: ['keys'], string: ['keys'] });
    expect(cliParams).toEqual({ args: {}, flags: { keys: ['01', '02'] }, _: [], _tail: [] });
  });
});

describe('flaget - option string, short flags (POSIX)', () => {
  test('value as next argument', () => {
    const cli = '-n 007';
    const cliParams = flaget({ raw: cli.split(' '), string: ['n'] });
    expect(cliParams).toEqual({ args: {}, flags: { n: '007' }, _: [], _tail: [] });
  });

  test('value after equals', () => {
    const cli = '-n=007';
    const cliParams = flaget({ raw: cli.split(' '), string: ['n'] });
    expect(cliParams).toEqual({ args: {}, flags: { n: '007' }, _: [], _tail: [] });
  });

  test('text value after equals', () => {
    const cli = '-n=ab';
    const cliParams = flaget({ raw: cli.split(' '), string: ['n'] });
    expect(cliParams).toEqual({ args: {}, flags: { n: 'ab' }, _: [], _tail: [] });
  });

  test('empty value after equals gives empty string', () => {
    const cli = '-n=';
    const cliParams = flaget({ raw: cli.split(' '), string: ['n'] });
    expect(cliParams).toEqual({ args: {}, flags: { n: '' }, _: [], _tail: [] });
  });

  test('attached value', () => {
    const cli = '-n007';
    const cliParams = flaget({ raw: cli.split(' '), string: ['n'] });
    expect(cliParams).toEqual({ args: {}, flags: { n: '007' }, _: [], _tail: [] });
  });

  test('attached text value', () => {
    const cli = '-nab';
    const cliParams = flaget({ raw: cli.split(' '), string: ['n'] });
    expect(cliParams).toEqual({ args: {}, flags: { n: 'ab' }, _: [], _tail: [] });
  });

  test('last flag in group takes next argument', () => {
    const cli = '-abn 007';
    const cliParams = flaget({ raw: cli.split(' '), string: ['n'] });
    expect(cliParams).toEqual({
      args: {},
      flags: { a: true, b: true, n: '007' },
      _: [],
      _tail: [],
    });
  });

  test('last flag in group takes value after equals', () => {
    const cli = '-abn=007';
    const cliParams = flaget({ raw: cli.split(' '), string: ['n'] });
    expect(cliParams).toEqual({
      args: {},
      flags: { a: true, b: true, n: '007' },
      _: [],
      _tail: [],
    });
  });

  test('last flag in group without value at the end gives empty string', () => {
    const cli = '-abn';
    const cliParams = flaget({ raw: cli.split(' '), string: ['n'] });
    expect(cliParams).toEqual({
      args: {},
      flags: { a: true, b: true, n: '' },
      _: [],
      _tail: [],
    });
  });

  test('last flag in group without value before another flag gives empty string', () => {
    const cli = '-abn --other';
    const cliParams = flaget({ raw: cli.split(' '), string: ['n'] });
    expect(cliParams).toEqual({
      args: {},
      flags: { a: true, b: true, n: '', other: true },
      _: [],
      _tail: [],
    });
  });

  test('group without string flags does not take a value', () => {
    const cli = '-abc 007';
    const cliParams = flaget({ raw: cli.split(' ') });
    expect(cliParams).toEqual({
      args: {},
      flags: { a: true, b: true, c: true },
      _: ['007'],
      _tail: [],
    });
  });
});

describe('flaget - option string, config error', () => {
  test('flag in boolean and string throws an error', () => {
    expect(() => flaget({ raw: [], boolean: ['name'], string: ['name'] })).toThrow(
      new TypeError('Flag "name" can not be in both "boolean" and "string" options'),
    );
  });
});

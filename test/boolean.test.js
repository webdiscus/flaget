import { describe, test, expect } from 'vitest';

import flaget from './utils/testLoader.js';

describe('flaget - boolean option', () => {
  test('a flag without a value is true', () => {
    expect(flaget({ raw: ['--yes'], boolean: ['yes'] }).flags).toEqual({ yes: true });
  });

  test('a flag never takes the next argument', () => {
    expect(flaget({ raw: ['--yes', 'false'], boolean: ['yes'] })).toEqual({ args: {}, flags: { yes: true }, _: ['false'], _tail: [] });
  });

  test('a value after equals gives true or false', () => {
    expect(flaget({ raw: ['--yes=true'], boolean: ['yes'] }).flags).toEqual({ yes: true });
    expect(flaget({ raw: ['--yes=false'], boolean: ['yes'] }).flags).toEqual({ yes: false });
    expect(flaget({ raw: ['-y=false'], alias: { y: 'yes' }, boolean: ['yes'] }).flags).toEqual({ yes: false });
  });

  test('another value after equals stays as written', () => {
    expect(flaget({ raw: ['--yes=no'], boolean: ['yes'] }).flags).toEqual({ yes: 'no' });
    expect(flaget({ raw: ['--yes='], boolean: ['yes'] }).flags).toEqual({ yes: '' });
    expect(flaget({ raw: ['--dry-run=1'], boolean: ['dry-run'] }).flags).toEqual({ 'dry-run': '1', dryRun: '1' });
  });

  test('a negated flag is false', () => {
    expect(flaget({ raw: ['--no-yes'], boolean: ['yes'] }).flags).toEqual({ yes: false });
  });
});

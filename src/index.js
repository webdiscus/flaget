/**
 * A lightweight CLI flag/argument parser for Node.js
 * Supports all standard CLI flag formats.
 *
 * Note:
 * The code is written to keep a good balance between readability and small size.
 * Naming, structure, and logic are optimized for minimal bundle size.
 *
 * @author webdiscus
 */

/**
 * Check if a string is a number, e.g. 5, -5, 0.5, -0.5.
 * @param {string} val The value to check.
 * @returns {boolean}
 */
const isNumber = (val) => /^-?\d+(\.\d+)?$/.test(val);

/**
 * Check if the next argument exists and is a value.
 * A negative number is a value, other arguments starting with "-" are flags.
 * @param {Array<string>} raw The raw argv array.
 * @param {number} i Current index.
 * @returns {boolean} True if the next argument is a value.
 */
const isArg = (raw, i) => {
  let val = raw[i + 1];
  return val != null && (val[0] !== '-' || isNumber(val));
};

/**
 * Convert a string to boolean or number if possible.
 * @param {string} val The value to convert.
 * @param {boolean} [isString] If true, the value is given as is.
 * @returns {string|boolean|number} The casted value.
 */
const cast = (val, isString) => {
  if (isString) return val;
  if (val === 'true') return true;
  if (val === 'false') return false;
  if (isNumber(val)) return Number(val);
  return val;
};

/**
 * Assign a flag value to both original and camelCase keys.
 * @param {{flags: Object<string, any>}} res The result object containing the `flags` property.
 * @param {string} key The original flag key.
 * @param {any} val The value to assign to the flag.
 */
const setFlag = (res, key, val) => {
  // transform kebab-case string to camelCase
  let camelKey = key.includes('-') ? key.replace(/-([a-z])/g, (_, char) => char.toUpperCase()) : key;

  res.flags[key] = val;
  if (camelKey !== key) {
    res.flags[camelKey] = val;
  }
};

/**
 * Collect one or more values for a multi-value key.
 * @param {Array} raw The argv array.
 * @param {number} i The index to start collecting from.
 * @param {string|undefined} val The initial raw value if inline.
 * @param {boolean} isString If true, the values are given as is.
 * @returns {{values: Array, offset: number}} The collected values and offset.
 */
const getArray = (raw, i, val, isString) => {
  let values = [];
  let j = i;

  if (val != null) {
    values.push(cast(val, isString));
    return { values, offset: 0 };
  }

  while (isArg(raw, j)) {
    values.push(cast(raw[++j], isString));
  }

  // offset is difference between current index "j" and start index "i"
  return { values, offset: j - i};
};

/**
 * Parse CLI flags and positional arguments from argv.
 *
 * @param {object} [options] Parsing options.
 * @param {Array} [options.raw=process.argv.slice(2)] The raw arguments to parse.
 * @param {object} [options.args=[]] Named positional arguments.
 *   Use strings to define positional keys, e.g. ['command', 'file'].
 *   A variadic last argument can be declared with a prefix: '...files'.
 * @param {object} [options.alias={}] Mapping of flag aliases to full flag names.
 * @param {Array} [options.array=[]] Flag keys that should be collected into arrays.
 * @param {Array} [options.boolean=[]] Flag keys that should always be parsed as booleans.
 * @param {Array} [options.string=[]] Flag keys whose values are never cast.
 * @param {object} [options.default={}] Default values for missing flags.
 * @returns {{
 *   _: string[],          // Positional arguments before "--"
 *   _tail: string[],      // Raw arguments after "--", unparsed
 *   args: object,         // Named positional arguments
 *   [flag: string]: any   // All flags as top-level properties (excluding reserved keys)
 * }} Parsed result object.
 */
const flaget = (options = {}) => {
  let { raw = process.argv.slice(2), alias = {}, array = [], boolean = [], string = [] } = options;
  let res = { args: {}, flags: {}, _: [], _tail: [] };

  for (let key of string) {
    if (boolean.includes(key)) throw new TypeError(`Flag "${key}" can not be in both "boolean" and "string" options`);
  }

  /**
   * Set a flag that can take a value.
   * @param {string} key The long flag key.
   * @param {string|null} val The inline value, or null to take the next argument.
   * @param {number} i The current argv index.
   * @returns {number} The updated index.
   */
  const setValue = (key, val, i) => {
    let isString = string.includes(key);

    // A boolean flag never takes the next argument. A value after `=` gives a boolean only for `true` and `false`,
    // another value stays as written: the caller decides.
    if (boolean.includes(key)) {
      setFlag(res, key, val == null || val === 'true' ? true : val === 'false' ? false : val);
      return i;
    }

    // flag with multi-value
    if (array.includes(key)) {
      let { values, offset } = getArray(raw, i, val, isString);
      setFlag(res, key, (res.flags[key] || []).concat(values));
      return i + offset;
    }

    // a string flag without value gives an empty string
    val = val != null ? cast(val, isString) : isArg(raw, i) ? cast(raw[++i], isString) : isString ? '' : true;
    setFlag(res, key, val);

    return i;
  };

  /**
   * Parse a long flag argument (e.g., --key, --no-key or --key=value).
   * @param {string} arg The argument to parse.
   * @param {number} i The current argv index.
   * @returns {number} The updated index.
   */
  const parseLong = (arg, i) => {
      // performance optimized:
      // 1) using indexOf + slice is ~10% faster than split('=')
      // 2) splitting first, then slicing is ~30% faster than slicing first, then splitting
      //let [rawKey, rawVal] = arg.split('='); // 10% slower, but 50 bytes smaller
      let j = arg.indexOf('=');
      let isNo = arg.startsWith('--no-');
      let key = arg.slice(isNo ? 5 : 2, ~j ? j : void 0);
      let val = ~j ? arg.slice(++j) : null;

      key = alias[key] || key;

      if (isNo) {
        setFlag(res, key, false);
        return i;
      }

      return setValue(key, val, i);
    };

  /**
   * Parse short CLI flags (POSIX): -a, -abc, -f value, -f=value.
   * A string flag takes the rest of the argument as its value: -nvalue, -abnvalue.
   *
   * @param {string} arg The current argument.
   * @param {number} i The current argv index.
   * @returns {number} Updated index.
   */
  const parseShort = (arg, i) => {
    for (let j = 1; j < arg.length; j++) {
      let key = alias[arg[j]] || arg[j];
      let isEq = arg[j + 1] === '=';

      // a single flag, a flag before "=" or a string flag takes a value
      if (isEq || arg.length < 3 || string.includes(key)) {
        let val = arg.slice(j + 1 + isEq);
        return setValue(key, isEq || val ? val : null, i);
      }

      // grouped flags like -abc -> -a -b -c
      setFlag(res, key, true);
    }

    return i;
  };

  // parse all flags and positional arguments before "--"
  for (let i = 0; i < raw.length; i++) {
    let arg = raw[i];

    if (arg === '--') {
      // all arguments after "--"
      res._tail = raw.slice(++i);
      break;
    }

    if (arg[0] === '-') {
      i = arg[1] === '-' ? parseLong(arg, i) : parseShort(arg, i);
    } else {
      res._.push(arg);
    }
  }

  // apply default values for missing flags
  let defs = options.default || {};
  for (let key in defs) {
    if (!(key in res.flags)) setFlag(res, key, defs[key]);
  }

  // assign named positional args
  let args = options.args || [];
  for (let i = 0; i < args.length; i++) {
    let key = args[i];
    if (key.startsWith('...')) {
      res.args[key.slice(3)] = res._.slice(i);
      break;
    }
    res.args[key] = res._[i];
  }

  return res;
};

module.exports = flaget;

// ensure default import works in ESM and TypeScript: import flaget from 'flaget'
flaget.default = flaget;

/**
 * Parse config string into key-value object
 * @param {string} s - Config string to parse
 * @returns {Record<string, any>} Parsed configuration object
 */
export function parse(s: string): Record<string, any>;
/**
 * Parse freeform value into object
 * @param {string} value - freeform string value to parse into object, array or value
 * @returns {any} Parsed value (object, array, string, number, boolean, etc.)
 */
export function parseValue(value: string): any;
/**
 * Parse string of key value options using template literal syntax
 * @param {TemplateStringsArray|string} input - Template strings array from template literal or string
 * @param {...any} substitutions - Template literal substitution values
 * @returns {Record<string, any>} Parsed configuration object
 */
export function options(input?: TemplateStringsArray | string, ...substitutions: any[]): Record<string, any>;

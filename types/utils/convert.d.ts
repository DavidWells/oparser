/**
 * Convert string value to appropriate JavaScript type
 * @param {string} value - String value to convert
 * @returns {any} Converted value (boolean, number, object, array, or string)
 */
export function convert(value: string): any;
/**
 * Check if string looks like an object
 * @param {string} str - String to check
 * @returns {boolean} True if string has object-like syntax
 */
export function isObjectLike(str: string): boolean;
/**
 * Check if string looks like an array
 * @param {string} str - String to check
 * @returns {boolean} True if string has array-like syntax
 */
export function isArrayLike(str: string): boolean;
export const COMMA: "_COMMA_";
export { parseJSON };

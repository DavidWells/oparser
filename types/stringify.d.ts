/**
 * Convert object to configuration string format
 * @param {Record<string, any>} obj - Object to stringify
 * @param {object} [opts={}] - Formatting options
 * @param {string} [opts.joiner='='] - Character to join keys and values
 * @param {boolean} [opts.asJs=true] - Convert to JavaScript object notation
 * @param {boolean} [opts.compressed=false] - Use compressed JSON format
 * @param {boolean} [opts.singleLineValues] - Format values on single lines
 * @param {boolean} [opts.expanded] - Use expanded JSON format with indentation
 * @param {string} [opts.separator='\n'] - Separator between key-value pairs
 * @returns {string} Formatted configuration string
 */
export function stringify(obj: Record<string, any>, opts?: {
    joiner?: string;
    asJs?: boolean;
    compressed?: boolean;
    singleLineValues?: boolean;
    expanded?: boolean;
    separator?: string;
}): string;

/**
 * Create regex pattern to match characters inside quoted strings
 * @param {string} [char='\\s'] - Character pattern to match
 * @param {string} [open] - Opening quote character
 * @param {string} [close] - Closing quote character
 * @param {number} [repeat=0] - Repeat count for quote pairs
 * @param {string} [flags] - Regex flags
 * @returns {RegExp} Regular expression pattern
 */
export function replaceInnerCharPattern(char?: string, open?: string, close?: string, repeat?: number, flags?: string): RegExp;

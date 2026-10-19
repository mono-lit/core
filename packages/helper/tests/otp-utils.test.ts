// mono-otp's pure helpers: character cleaning per `type`, group parsing, and the edit model
// (the value is always a contiguous prefix of the boxes).
import { describe, it, expect } from 'vitest'
import {
  backspaceOtp,
  clampCaret,
  normaliseOtpValue,
  parseOtpGroups,
  removeOtpChar,
  resolveOtpLength,
  sanitizeOtpChar,
  sanitizeOtpText,
  spliceOtpValue,
} from '../src/components/otp/otp-utils'

describe('sanitizeOtpChar / sanitizeOtpText', () => {
  it('numeric takes digits only', () => {
    expect(sanitizeOtpChar('7')).toBe('7')
    expect(sanitizeOtpChar('a')).toBe('')
    expect(sanitizeOtpText('12-34 5a6')).toBe('123456')
  })

  it('alphanumeric uppercases letters and drops symbols', () => {
    expect(sanitizeOtpChar('b', 'alphanumeric')).toBe('B')
    expect(sanitizeOtpChar('#', 'alphanumeric')).toBe('')
    expect(sanitizeOtpText('ab-12 c', 'alphanumeric')).toBe('AB12C')
  })

  it('text takes any non-space character', () => {
    expect(sanitizeOtpText('a#1 é', 'text')).toBe('a#1é')
    expect(sanitizeOtpChar(' ', 'text')).toBe('')
  })

  it('handles null / numbers', () => {
    expect(sanitizeOtpText(null)).toBe('')
    expect(sanitizeOtpText(123456)).toBe('123456')
  })
})

describe('resolveOtpLength / normaliseOtpValue', () => {
  it('falls back to 6 for junk', () => {
    expect(resolveOtpLength('4')).toBe(4)
    expect(resolveOtpLength(0)).toBe(6)
    expect(resolveOtpLength('x')).toBe(6)
  })

  it('cleans and cuts the model to the box count', () => {
    expect(normaliseOtpValue('12a34567', 4)).toBe('1234')
    expect(normaliseOtpValue('ab12', 6, 'alphanumeric')).toBe('AB12')
  })
})

describe('parseOtpGroups', () => {
  it('a single size repeats', () => {
    expect(parseOtpGroups(3, 6)).toEqual([3])
    expect(parseOtpGroups(3, 8)).toEqual([3, 6])
    expect(parseOtpGroups(2, 6)).toEqual([2, 4])
  })

  it('a list is taken as given; the rest forms a last group', () => {
    expect(parseOtpGroups([2, 4], 6)).toEqual([2])
    expect(parseOtpGroups([2, 2], 6)).toEqual([2, 4])
    expect(parseOtpGroups('3,3', 6)).toEqual([3])
    expect(parseOtpGroups('[2, 2, 2]', 6)).toEqual([2, 4])
  })

  it('nothing / junk / a group as long as the field → no separators', () => {
    expect(parseOtpGroups(undefined, 6)).toEqual([])
    expect(parseOtpGroups('', 6)).toEqual([])
    expect(parseOtpGroups('x', 6)).toEqual([])
    expect(parseOtpGroups(6, 6)).toEqual([])
  })
})

describe('edits', () => {
  it('one character replaces its box and moves on', () => {
    expect(spliceOtpValue('', 0, '1', 6)).toEqual({ value: '1', caret: 1 })
    expect(spliceOtpValue('123', 1, '9', 6)).toEqual({ value: '193', caret: 2 })
  })

  it('a rejected character changes nothing', () => {
    expect(spliceOtpValue('12', 2, 'a', 6)).toEqual({ value: '12', caret: 2 })
  })

  it('a paste fills from the box on and stops at the last one', () => {
    expect(spliceOtpValue('', 0, '123-456', 6)).toEqual({ value: '123456', caret: 5 })
    expect(spliceOtpValue('12', 2, '3456789', 6)).toEqual({ value: '123456', caret: 5 })
    expect(spliceOtpValue('1234', 1, '99', 6)).toEqual({ value: '199', caret: 3 })
  })

  it('the last box stays the caret once full', () => {
    expect(spliceOtpValue('12345', 5, '6', 6)).toEqual({ value: '123456', caret: 5 })
  })

  it('Delete removes the box and shifts the rest left', () => {
    expect(removeOtpChar('1234', 1, 6)).toEqual({ value: '134', caret: 1 })
    expect(removeOtpChar('12', 4, 6)).toEqual({ value: '12', caret: 2 })
  })

  it('Backspace clears a filled box, or steps back from an empty one', () => {
    expect(backspaceOtp('123', 1, 6)).toEqual({ value: '13', caret: 1 })
    expect(backspaceOtp('123', 3, 6)).toEqual({ value: '12', caret: 2 })
    expect(backspaceOtp('', 0, 6)).toEqual({ value: '', caret: 0 })
  })

  it('the caret never passes the first empty box', () => {
    expect(clampCaret(4, 2, 6)).toBe(2)
    expect(clampCaret(9, 6, 6)).toBe(5)
    expect(clampCaret(-1, 0, 6)).toBe(0)
  })
})

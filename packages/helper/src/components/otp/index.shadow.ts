// Shadow-DOM build of mono-otp (`@mono-lit/helper/ui/shadow/otp`): registers `mono-shadow-otp`.
export { MonoOtpShadow } from './mono-otp.shadow.js'
export { MonoOtpCore } from './otp-core.js'
export type { OtpSlotName } from './otp-core.js'

export type {
  OtpType,
  OtpSize,
  OtpColor,
  OtpVariant,
  OtpGroups,
  OtpLabelPosition,
  OtpValidationPosition,
  OtpValidationState,
  OtpCssClass,
  OtpModelEventDetail,
  OtpModelEvent,
  OtpProps,
  OtpEvents,
} from './otp-types.js'

export {
  OTP_DEFAULT_LENGTH,
  sanitizeOtpChar,
  sanitizeOtpText,
  resolveOtpLength,
  normaliseOtpValue,
  parseOtpGroups,
  spliceOtpValue,
  removeOtpChar,
  backspaceOtp,
  clampCaret,
} from './otp-utils.js'

export type { OtpEdit } from './otp-utils.js'

// Modal component exports
export { MonoModal } from './mono-modal.js'
// The programmatic dialog (`controlMonoModal().dialog`) builds <mono-button>s by
// code, so this entry registers the button too: one import, a working dialog.
import '../button/mono-button.js'
export { monoModal, controlMonoModal } from './mono-modal-controller.js'

export type {
  ModalSize,
  ModalDimensionPreset,
  ModalDimension,
  ModalColor,
  ModalSource,
  ModalCssClass,
  ModalCloseEventDetail,
  ModalCloseEvent,
  ModalProps,
  ModalEvents,
  MonoDialogButton,
  MonoDialogButtonCtx,
  MonoDialogOptions,
  MonoDialogController,
  MonoModalOptions,
  MonoModalController,
  MonoModalElementLike,
} from './modal-types.js'

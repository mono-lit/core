// Shadow-DOM / SSR build entry for modal — `@mono-lit/helper/ui/shadow/modal`.
// Registers the SAME `mono-modal` tag as the light build
// (`@mono-lit/helper/ui/modal`), so a document must import only one of the two.
export { MonoModalShadow } from './mono-modal.shadow.js'

export { MonoModalCore, type ModalSlotName } from './modal-core.js'
// The programmatic dialog builds buttons by code — register the shadow button too.
import '../button/mono-button.shadow.js'
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

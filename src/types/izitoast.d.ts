declare module 'izitoast' {
  export type IziToastPosition =
    | 'bottomRight'
    | 'bottomLeft'
    | 'topRight'
    | 'topLeft'
    | 'topCenter'
    | 'bottomCenter'
    | 'center';

  export interface IziToastSettings {
    id?: string;
    title?: string;
    titleColor?: string;
    titleSize?: string;
    titleLineHeight?: string;

    message?: string;
    messageColor?: string;
    messageSize?: string;
    messageLineHeight?: string;

    backgroundColor?: string;
    theme?: 'light' | 'dark';
    color?: string;

    icon?: string;
    iconText?: string;
    iconColor?: string;

    image?: string;
    imageWidth?: number;

    position?: IziToastPosition;
    timeout?: number;
    progressBar?: boolean;
    close?: boolean;
    closeOnEscape?: boolean;
    closeOnClick?: boolean;
    pauseOnHover?: boolean;
    resetOnHover?: boolean;

    displayMode?: number;
    transitionIn?: string;
    transitionOut?: string;
    zindex?: number;

    buttons?: unknown[];
    inputs?: unknown[];

    onOpening?: () => void;
    onOpened?: () => void;
    onClosing?: () => void;
    onClosed?: () => void;
  }

  export interface IziToast {
    show(settings: IziToastSettings): void;
    success(settings: IziToastSettings): void;
    error(settings: IziToastSettings): void;
    warning(settings: IziToastSettings): void;
    info(settings: IziToastSettings): void;

    question(settings: IziToastSettings): void;
    progress(settings: IziToastSettings): void;

    hide(
      settings?: IziToastSettings,
      toast?: HTMLElement,
      closedBy?: string,
    ): void;

    destroy(): void;
  }

  const iziToast: IziToast;

  export default iziToast;
}

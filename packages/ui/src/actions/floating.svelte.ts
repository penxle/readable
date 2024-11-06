import { arrow, autoUpdate, computePosition, flip, offset, shift } from '@floating-ui/dom';
import { on } from 'svelte/events';
import { match } from 'ts-pattern';
import type { FloatingElement, Middleware, OffsetOptions, Placement, ReferenceElement } from '@floating-ui/dom';
import type { Action } from 'svelte/action';

type ReferenceAction = Action<ReferenceElement>;
type FloatingAction = Action<FloatingElement>;
type ArrowAction = Action<HTMLElement>;
type UpdatePosition = () => Promise<void>;

type CreateFloatingActionsOptions = {
  placement: Placement;
  offset?: OffsetOptions;
  arrow?: boolean;
  middleware?: Middleware[];
  disableAutoUpdate?: boolean;
  onClickOutside?: () => void;
};

type CreateFloatingActionsReturn = {
  anchor: ReferenceAction;
  floating: FloatingAction;
  arrow: ArrowAction;
  update: UpdatePosition;
};

export function createFloatingActions(options?: CreateFloatingActionsOptions): CreateFloatingActionsReturn {
  let referenceElement: ReferenceElement | undefined;
  let floatingElement: FloatingElement | undefined;
  let arrowElement: HTMLElement | undefined;
  let cleanupAutoUpdate: (() => void) | undefined;
  let cleanupClickListener: (() => void) | undefined;

  const updatePosition: UpdatePosition = async () => {
    if (!referenceElement || !floatingElement) {
      return;
    }

    const middleware = options?.middleware ?? [shift({ padding: 8 }), flip()];

    const { x, y, placement, strategy, middlewareData } = await computePosition(referenceElement, floatingElement, {
      strategy: 'absolute',
      placement: options?.placement,
      middleware: [
        !!options?.offset && offset(options.offset),
        ...middleware,
        !!options?.arrow && arrowElement && arrow({ element: arrowElement, padding: 16 }),
      ],
    });

    if (!referenceElement || !floatingElement) {
      return;
    }

    Object.assign(floatingElement.style, {
      position: strategy,
      top: `${y}px`,
      left: `${x}px`,
    });

    if (middlewareData.hide) {
      Object.assign(floatingElement.style, {
        visibility: middlewareData.hide.referenceHidden || middlewareData.hide.escaped ? 'hidden' : 'visible',
      });
    }

    if (middlewareData.arrow && arrowElement) {
      const { x, y } = middlewareData.arrow;

      const side = match(placement)
        .with('top', 'top-start', 'top-end', () => 'bottom')
        .with('bottom', 'bottom-start', 'bottom-end', () => 'top')
        .with('left', 'left-start', 'left-end', () => 'right')
        .with('right', 'right-start', 'right-end', () => 'left')
        .exhaustive();

      const transform = match(placement)
        .with('top', 'top-start', 'top-end', () => 'rotate(-135deg)')
        .with('bottom', 'bottom-start', 'bottom-end', () => 'rotate(45deg)')
        .with('left', 'left-start', 'left-end', () => 'rotate(135deg)')
        .with('right', 'right-start', 'right-end', () => 'rotate(-45deg)')
        .exhaustive();

      Object.assign(arrowElement.style, {
        left: x === undefined ? '' : `${x}px`,
        top: y === undefined ? '' : `${y}px`,
        [side]: `${-arrowElement.offsetHeight / 2}px`,
        transform,
        visibility: middlewareData.bubble?.bubbled ? 'hidden' : 'visible',
      });
    }
  };

  const clickListener = (event: Event) => {
    if (options?.onClickOutside && !floatingElement?.contains(event.target as Node)) {
      options.onClickOutside();
    }
  };

  const mount = async () => {
    if (!referenceElement || !floatingElement) {
      return;
    }

    await updatePosition();

    if (options?.disableAutoUpdate !== true) {
      cleanupAutoUpdate?.();
      cleanupAutoUpdate = autoUpdate(referenceElement, floatingElement, updatePosition, { animationFrame: true });
    }

    setTimeout(() => {
      cleanupClickListener?.();
      cleanupClickListener = on(window, 'click', clickListener);
    }, 0);
  };

  const unmount = () => {
    if (cleanupAutoUpdate) {
      cleanupAutoUpdate();
      cleanupAutoUpdate = undefined;
    }

    cleanupClickListener?.();
    cleanupClickListener = undefined;
  };

  const referenceAction: ReferenceAction = (element) => {
    $effect(() => {
      referenceElement = element;
      mount();

      return () => {
        unmount();
        referenceElement = undefined;
      };
    });
  };

  const floatingAction: FloatingAction = (element) => {
    $effect(() => {
      // NOTE: top layer에 표시되는 조상 요소가 있다면 그 요소에 추가해서 floating element와 상호작용이 되도록 함
      const topLayerElem = element.closest('dialog, [popover]');
      if (topLayerElem) {
        topLayerElem.append(element);
      } else {
        document.body.append(element);
      }

      Object.assign(element.style, {
        position: 'absolute',
        top: '0',
        left: '0',
      });

      floatingElement = element;
      mount();

      return () => {
        unmount();
        floatingElement?.remove();
        floatingElement = undefined;
      };
    });
  };

  const arrowAction: ArrowAction = (element) => {
    $effect(() => {
      Object.assign(element.style, {
        position: 'absolute',
      });

      arrowElement = element;
      mount();

      return () => {
        unmount();
        arrowElement = undefined;
      };
    });
  };

  return {
    anchor: referenceAction,
    floating: floatingAction,
    arrow: arrowAction,
    update: updatePosition,
  };
}

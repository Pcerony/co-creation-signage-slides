const DEFAULT_EASING = 'cubic-bezier(0.16, 1, 0.3, 1)';
const STAGE_TRANSITION_DURATION = 800;

export function findCrossPageConnection(connections, fromSlideId, toSlideId) {
  for (const connection of connections || []) {
    if (connection.from.slideId === fromSlideId && connection.to.slideId === toSlideId) {
      return {
        connection,
        direction: 'forward',
        source: connection.from,
        target: connection.to
      };
    }
    if (connection.to.slideId === fromSlideId && connection.from.slideId === toSlideId) {
      return {
        connection,
        direction: 'reverse',
        source: connection.to,
        target: connection.from
      };
    }
  }
  return null;
}

export function inverseRectTransform(sourceRect, targetRect) {
  return {
    translateX: sourceRect.left - targetRect.left,
    translateY: sourceRect.top - targetRect.top,
    scaleX: targetRect.width ? sourceRect.width / targetRect.width : 1,
    scaleY: targetRect.height ? sourceRect.height / targetRect.height : 1
  };
}

export function rectTransformString({ translateX, translateY, scaleX, scaleY }) {
  return `translate(${translateX}px, ${translateY}px) scale(${scaleX}, ${scaleY})`;
}

export function pairMorphParts(sourceParts, targetParts) {
  const pairs = [];
  for (const [partId, source] of sourceParts) {
    const target = targetParts.get(partId);
    if (target) pairs.push({ partId, source, target });
  }
  return pairs;
}

function snapshotElement(element) {
  const rect = element.getBoundingClientRect();
  const style = getComputedStyle(element);
  return {
    rect: { left: rect.left, top: rect.top, width: rect.width, height: rect.height },
    style: {
      clipPath: style.clipPath,
      backgroundColor: style.backgroundColor,
      borderColor: style.borderColor,
      borderRadius: style.borderRadius,
      color: style.color
    }
  };
}

function snapshotParts(root) {
  return new Map(
    [...root.querySelectorAll('[data-morph-part]')]
      .map((element) => [element.dataset.morphPart, { element, ...snapshotElement(element) }])
  );
}

function targetDeckDelta(deck) {
  const targetMatch = deck.style.transform.match(/translate3d\(([-\d.]+)px,\s*([\d.-]+)px/i);
  if (!targetMatch) return { x: 0, y: 0 };
  const matrix = new DOMMatrixReadOnly(getComputedStyle(deck).transform);
  return {
    x: Number(targetMatch[1]) - matrix.m41,
    y: Number(targetMatch[2]) - matrix.m42
  };
}

function shiftedRect(rect, delta) {
  return {
    left: rect.left + delta.x,
    top: rect.top + delta.y,
    width: rect.width,
    height: rect.height
  };
}

function findMount(slide, instanceId, variant) {
  return slide?.querySelector(
    `[data-cross-page-instance="${CSS.escape(instanceId)}"][data-cross-page-variant="${CSS.escape(variant)}"]`
  ) || null;
}

function partKeyframes(source, target, parentScale = { x: 1, y: 1 }) {
  const transform = inverseRectTransform(source.rect, target.rect);
  return [
    {
      transform: rectTransformString({
        ...transform,
        translateX: transform.translateX / parentScale.x,
        translateY: transform.translateY / parentScale.y
      }),
      clipPath: source.style.clipPath,
      backgroundColor: source.style.backgroundColor,
      borderColor: source.style.borderColor,
      borderRadius: source.style.borderRadius,
      color: source.style.color
    },
    {
      transform: 'translate(0px, 0px) scale(1, 1)',
      clipPath: target.style.clipPath,
      backgroundColor: target.style.backgroundColor,
      borderColor: target.style.borderColor,
      borderRadius: target.style.borderRadius,
      color: target.style.color
    }
  ];
}

export function mountCrossPageComponents({
  controller,
  deck,
  slides,
  connections = [],
  layer
}) {
  let previousState = controller.getState();
  let active = null;
  let sequence = 0;

  const endpointMounts = (() => {
    const mounts = new Set();
    for (const connection of connections) {
      for (const endpoint of [connection.from, connection.to]) {
        const slide = slides.find((candidate) => candidate.dataset.slideId === endpoint.slideId);
        const mount = findMount(slide, connection.instanceId, endpoint.variant);
        if (mount) mounts.add(mount);
      }
    }
    return mounts;
  })();

  const syncOwnership = (currentSlideIndex = controller.getState().currentSlideIndex) => {
    const currentSlide = slides[currentSlideIndex];
    for (const mount of endpointMounts) {
      const ownsComponent = currentSlide?.contains(mount);
      mount.toggleAttribute('data-cross-page-inactive', !ownsComponent);
      if (ownsComponent) mount.removeAttribute('aria-hidden');
      else mount.setAttribute('aria-hidden', 'true');
    }
  };

  const cleanup = (ownerIndex = controller.getState().currentSlideIndex) => {
    if (active) {
      active.cancelled = true;
      if (active.frame) cancelAnimationFrame(active.frame);
      for (const timer of active.timers) clearTimeout(timer);
      for (const animation of active.animations) animation.cancel();
      active.overlay?.remove();
      active.sourceMount?.removeAttribute('data-cross-page-hidden');
      active.targetMount?.removeAttribute('data-cross-page-hidden');
      active = null;
    }
    syncOwnership(ownerIndex);
    controller.setNavigationLocked(false);
  };

  const begin = (match, sourceMount, targetMount) => {
    cleanup();
    const token = ++sequence;
    const sourceRoot = sourceMount.firstElementChild;
    const targetRoot = targetMount.firstElementChild;
    if (!sourceRoot || !targetRoot || !layer || typeof Element.prototype.animate !== 'function') return;

    const sourceBox = snapshotElement(sourceMount);
    const sourceParts = snapshotParts(sourceRoot);
    const overlay = document.createElement('div');
    overlay.className = 'cross-page-overlay';
    overlay.dataset.crossPageOverlay = match.connection.instanceId;
    overlay.setAttribute('aria-hidden', 'true');
    overlay.style.setProperty('--cross-page-left', `${sourceBox.rect.left}px`);
    overlay.style.setProperty('--cross-page-top', `${sourceBox.rect.top}px`);
    overlay.style.setProperty('--cross-page-width', `${sourceBox.rect.width}px`);
    overlay.style.setProperty('--cross-page-height', `${sourceBox.rect.height}px`);
    overlay.append(sourceRoot.cloneNode(true));
    layer.append(overlay);
    sourceMount.setAttribute('data-cross-page-hidden', '');
    targetMount.setAttribute('data-cross-page-hidden', '');
    sourceMount.setAttribute('aria-hidden', 'true');
    targetMount.setAttribute('aria-hidden', 'true');
    controller.setNavigationLocked(true);
    active = {
      token,
      sourceMount,
      targetMount,
      overlay,
      animations: [],
      frame: 0,
      timers: [],
      cancelled: false
    };

    active.frame = requestAnimationFrame(() => {
      if (!active || active.token !== token || active.cancelled) return;
      const delta = targetDeckDelta(deck);
      const measuredTarget = snapshotElement(targetMount);
      const targetRect = shiftedRect(measuredTarget.rect, delta);
      const targetBox = snapshotElement(targetRoot);
      overlay.style.setProperty('--cross-page-left', `${targetRect.left}px`);
      overlay.style.setProperty('--cross-page-top', `${targetRect.top}px`);
      overlay.style.setProperty('--cross-page-width', `${targetRect.width}px`);
      overlay.style.setProperty('--cross-page-height', `${targetRect.height}px`);
      overlay.replaceChildren(targetRoot.cloneNode(true));

      const options = {
        duration: match.connection.durationMs,
        easing: DEFAULT_EASING,
        fill: 'both'
      };
      const outerTransform = inverseRectTransform(sourceBox.rect, targetRect);
      active.animations.push(overlay.animate([
        {
          transform: rectTransformString(outerTransform),
          backgroundColor: sourceBox.style.backgroundColor,
          borderColor: sourceBox.style.borderColor,
          borderRadius: sourceBox.style.borderRadius
        },
        {
          transform: 'translate(0px, 0px) scale(1, 1)',
          backgroundColor: targetBox.style.backgroundColor,
          borderColor: targetBox.style.borderColor,
          borderRadius: targetBox.style.borderRadius
        }
      ], options));

      const overlayParts = snapshotParts(overlay);
      for (const { source, target } of pairMorphParts(sourceParts, overlayParts)) {
        const animation = target.element.animate(partKeyframes(source, target, {
          x: outerTransform.scaleX,
          y: outerTransform.scaleY
        }), options);
        active.animations.push(animation);
      }
      overlay.dataset.crossPageReady = 'true';

      const finish = () => {
        if (active?.token === token) cleanup();
      };
      Promise.allSettled(active.animations.map((animation) => animation.finished)).then(() => {
        const holdDuration = Math.max(0, STAGE_TRANSITION_DURATION - match.connection.durationMs);
        if (active?.token === token) active.timers.push(setTimeout(finish, holdDuration));
      });
      active.timers.push(setTimeout(finish, STAGE_TRANSITION_DURATION + 120));
    });
  };

  const unsubscribe = controller.subscribe((next, action) => {
    const previous = previousState;
    previousState = next;
    if (action.type === 'INIT') return;
    if (action.force || action.type === 'SET_LANGUAGE' || next.lowPowerMode) {
      cleanup(next.currentSlideIndex);
      return;
    }
    if (next.currentSlideIndex === previous.currentSlideIndex) return;
    const sourceSlide = slides[previous.currentSlideIndex];
    const targetSlide = slides[next.currentSlideIndex];
    const match = findCrossPageConnection(
      connections,
      sourceSlide?.dataset.slideId,
      targetSlide?.dataset.slideId
    );
    if (!match) {
      cleanup(next.currentSlideIndex);
      return;
    }
    const sourceMount = findMount(sourceSlide, match.connection.instanceId, match.source.variant);
    const targetMount = findMount(targetSlide, match.connection.instanceId, match.target.variant);
    if (!sourceMount || !targetMount) {
      cleanup(next.currentSlideIndex);
      return;
    }
    begin(match, sourceMount, targetMount);
  });

  const cancelForViewport = () => cleanup();
  window.addEventListener('resize', cancelForViewport, { passive: true });
  window.addEventListener('pagehide', cancelForViewport);
  syncOwnership(previousState.currentSlideIndex);

  return () => {
    unsubscribe();
    cleanup();
    window.removeEventListener('resize', cancelForViewport);
    window.removeEventListener('pagehide', cancelForViewport);
  };
}

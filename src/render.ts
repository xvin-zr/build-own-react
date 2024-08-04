// for compatible with Safari
const requestIdleCallback = window.requestIdleCallback ?? setTimeout;

function createDOM(fiber: Fiber) {
    // create element
    const dom =
        fiber.type === 'TEXT_ELEMENT'
            ? document.createTextNode('')
            : document.createElement(fiber.type as HTMLElementTagName);

    updateDOM(dom, { children: [] }, fiber.props);

    return dom;
}

export default function render(element: RNode, container: HTMLElement): void {
    wipRoot = {
        type: 'div',
        dom: container,
        props: {
            children: [element],
        },
        sibling: null,
        child: null,
        parent: null,
        alternate: currRoot,
    };

    deletions = [];
    nextUnitOfWork = wipRoot;
}

let nextUnitOfWork: Fiber | undefined;

// work in progress root
let wipRoot: Fiber | undefined;

// current root for diffing algorithm
let currRoot: Fiber | undefined;

// old fibers to be deleted
let deletions: Fiber[] = [];

function commitRoot(): void {
    deletions.forEach(commitWork);

    commitWork(wipRoot!.child);
    currRoot = wipRoot;
    wipRoot = undefined;
}

function commitWork(fiber: Fiber | null): void {
    if (!fiber) return;

    let domParentFiber = fiber.parent;
    while (!domParentFiber?.dom) {
        domParentFiber = domParentFiber?.parent ?? null;
    }
    const parentDOM = domParentFiber?.dom;

    if (fiber.effectTag === 'PLACEMENT' && fiber.dom) {
        parentDOM?.appendChild(fiber.dom);
    } else if (fiber.effectTag === 'DELETION' && fiber.dom) {
        commitDeletion(fiber, parentDOM);
    } else if (fiber.effectTag === 'UPDATE' && fiber.dom) {
        updateDOM(fiber.dom, fiber.alternate!.props, fiber.props);
    }

    commitWork(fiber.child);
    commitWork(fiber.sibling);
}

function commitDeletion(fiber: Fiber, parentDOM: HTMLElement | Text): void {
    if (fiber.dom) {
        parentDOM.removeChild(fiber.dom);
    } else {
        commitDeletion(fiber.child!, parentDOM);
    }
}

function updateDOM(
    dom: HTMLElement | Text,
    prevProps: Props,
    nextProps: Props,
) {
    //Remove old or changed event listeners
    Object.keys(prevProps)
        .filter(isEvent)
        .filter(
            (key) => !(key in nextProps) || isNew(prevProps, nextProps)(key),
        )
        .forEach((name) => {
            const eventType = name.toLowerCase().substring(2);
            dom.removeEventListener(eventType, (prevProps as any)[name]);
        });

    // Remove old properties
    Object.keys(prevProps)
        .filter((key) => key !== 'children' && !key.startsWith('on'))
        .filter((key) => !(key in nextProps))
        .forEach((name) => {
            (dom as any)[name] = '';
        });

    // Set new or changed properties
    Object.keys(nextProps)
        .filter((key) => key !== 'children' && !key.startsWith('on'))
        .filter(isNew(prevProps, nextProps))
        .forEach((name) => {
            (dom as any)[name] = (nextProps as any)[name];
        });

    // Add event listeners
    Object.keys(nextProps)
        .filter(isEvent)
        .filter(isNew(prevProps, nextProps))
        .forEach((name) => {
            const eventType = name.toLowerCase().substring(2);
            dom.addEventListener(eventType, (nextProps as any)[name]);
        });

    function isNew(prevProps: Props, nextProps: Props) {
        return (key: string) =>
            (nextProps as Record<string, unknown>)[key] !==
            (prevProps as Record<string, unknown>)[key];
    }
    function isEvent(key: string) {
        return key.startsWith('on');
    }
}

function workLoop(deadline: IdleDeadline) {
    // Flag to determine if the browser needs to yield control
    let shouldYield = false;

    // Continue working on units of work until we need to yield
    while (nextUnitOfWork && !shouldYield) {
        // Perform the current unit of work and get the next one
        nextUnitOfWork = performUnitOfWork(nextUnitOfWork);

        // Check if the remaining time is less than 1ms to yield control. Won't work in Safari
        shouldYield = deadline?.timeRemaining() < 1;
    }

    // Schedule the next work loop during the browser's idle periods
    requestIdleCallback(workLoop);

    // commit phase
    if (!nextUnitOfWork && wipRoot) {
        commitRoot();
    }
}

requestIdleCallback(workLoop);

function performUnitOfWork(fiber: Fiber): Fiber | undefined {
    const isFunctionComponent = fiber.type instanceof Function;
    if (isFunctionComponent) {
        updateFunctionComponent(fiber);
    } else {
        updateHostComponent(fiber);
    }

    // return next fiber
    if (fiber.child) {
        return fiber.child;
    }

    let nextFiber: Fiber | null = fiber;
    while (nextFiber) {
        if (nextFiber.sibling) {
            return nextFiber.sibling;
        }
        nextFiber = nextFiber.parent;
    }
    return undefined;
}

// non functional component
function updateHostComponent(fiber: Fiber) {
    // create dom element
    if (!fiber.dom) {
        fiber.dom = createDOM(fiber);
    }

    // create new fibers for children
    const elements = fiber.props.children;
    reconcileChildren(fiber, elements);
}

// remember the last time fiber
let wipFiber: Fiber | undefined;
let hookIndex = 0;

function updateFunctionComponent(fiber: Fiber) {
    wipFiber = fiber;
    hookIndex = 0;
    wipFiber.hooks = [];
    const children = [(fiber.type as Function)(fiber.props)];
    reconcileChildren(fiber, children);
}

export function useState<S>(init: S): [S, typeof setState] {
    const oldHook = wipFiber?.alternate?.hooks?.[hookIndex] as Hook<S>;

    const hook: Hook<S> = {
        state: oldHook ? oldHook.state : init,
        queue: [],
    };

    const actions = oldHook?.queue ?? [];
    actions.forEach((action) => {
        hook.state = action(hook.state);
    });

    function setState(action: (prevState: S) => S) {
        hook.queue!.push(action);
        wipRoot = {
            dom: currRoot!.dom,
            props: currRoot!.props,
            alternate: currRoot,
        } as Fiber;
        nextUnitOfWork = wipRoot;
        deletions = [];
    }

    wipFiber?.hooks?.push(hook as Hook<unknown>);
    hookIndex++;

    return [hook.state, setState];
}

function reconcileChildren(wipFiber: Fiber, elements: RNode[] | []) {
    let index = 0;
    let oldFiber = wipFiber.alternate?.child ?? null;
    let prevSibling: Fiber | null = null;

    while (index < elements.length || oldFiber) {
        const elem = elements[index];
        let newFiber: Fiber | null = null;

        const sameType = elem && oldFiber && elem.type === oldFiber.type;

        // if the old fiber and the new element have the same type, we can keep the DOM node and just update it with the new props
        if (sameType) {
            newFiber = {
                type: oldFiber!.type,
                props: elem.props,
                dom: oldFiber!.dom,
                parent: wipFiber,
                alternate: oldFiber!,
                effectTag: 'UPDATE',
            } as Fiber;
        }

        // if the type is different and there is a new element, it means we need to create a new DOM node
        if (elem && !sameType) {
            newFiber = {
                type: elem.type,
                props: elem.props,
                dom: null,
                parent: wipFiber,
                alternate: undefined,
                effectTag: 'PLACEMENT',
            } as Fiber;
        }

        // and if the types are different and there is an old fiber, we need to remove the old node
        if (oldFiber && !sameType) {
            oldFiber.effectTag = 'DELETION';
            deletions.push(oldFiber);
        }

        // traversal
        if (oldFiber) {
            oldFiber = oldFiber.sibling;
        }

        // be the child if it's the first element
        if (index === 0) {
            wipFiber.child = newFiber;
        } else {
            // be the sibling if it's not the first element
            prevSibling!.sibling = newFiber;
        }
        prevSibling = newFiber;

        index++;
    }
}

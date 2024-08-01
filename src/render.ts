// for compatible with Safari
const requestIdleCallback = window.requestIdleCallback ?? setTimeout;

function createDOM(fiber: Fiber) {
    // create element
    const dom =
        fiber.type === 'TEXT_ELEMENT'
            ? document.createTextNode('')
            : document.createElement(fiber.type);

    // assign props except `children`
    Object.keys(fiber.props)
        .filter((key) => key !== 'children')
        .forEach((key) => {
            // @ts-ignore
            dom[key] = fiber.props[key];
        });

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
    };

    nextUnitOfWork = wipRoot;
}

let nextUnitOfWork: Fiber | undefined;

// work in progress root
let wipRoot: Fiber | undefined;

function commitRoot(): void {
    commitWork(wipRoot?.child ?? null);
    wipRoot = undefined;
}

function commitWork(fiber: Fiber | null): void {
    if (!fiber) return;

    const parentDOM = fiber.parent?.dom;
    parentDOM?.appendChild(fiber.dom!);
    commitWork(fiber.child);
    commitWork(fiber.sibling);
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
    // create dom element
    if (!fiber.dom) {
        fiber.dom = createDOM(fiber);
    }

    // create new fibers for children
    const elements = fiber.props.children;
    let prevSibling: Fiber | null = null;

    // build Fiber Tree
    for (let i = 0; i < elements.length; i++) {
        const newFiber = {
            type: elements[i].type,
            props: elements[i].props,
            parent: fiber,
            dom: null,
            sibling: null,
            child: null,
        } as Fiber;

        // be the child if it's the first element
        if (i === 0) {
            fiber.child = newFiber;
        } else {
            // be the sibling if it's not the first element
            prevSibling!.sibling = newFiber;
        }

        prevSibling = newFiber;
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

export default function render(
    element: RNode,
    container: HTMLElement | Text,
): void {
    // create element
    const dom =
        element.type === 'TEXT_ELEMENT'
            ? document.createTextNode('')
            : document.createElement(element.type);

    // assign props except `children`
    Object.keys(element.props)
        .filter((key) => key !== 'children')
        .forEach((key) => {
            // @ts-ignore
            dom[key] = element.props[key];
        });

    // recursively render children
    element.props.children.forEach((child) => {
        render(child, dom);
    });

    // append to container
    container.appendChild(dom);
}

let nextUnitOfWork: undefined;

function workLoop(deadline: IdleDeadline) {
    // Flag to determine if the browser needs to yield control
    let shouldYield = false;

    // Continue working on units of work until we need to yield
    while (nextUnitOfWork && !shouldYield) {
        // Perform the current unit of work and get the next one
        nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
        // Check if the remaining time is less than 1ms to yield control
        shouldYield = deadline.timeRemaining() < 1;
    }

    // Schedule the next work loop during the browser's idle periods
    requestIdleCallback(workLoop);
}

requestIdleCallback(workLoop);

function performUnitOfWork(work) {}

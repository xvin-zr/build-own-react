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

/**
 *
 * @param type The type argument must be a valid React component type. For example, it could be a tag name string (such as 'div' or 'span'), or a React component (a function, a class, or a special component like Fragment).
 * @param props The props argument must either be an object or null. If you pass null, it will be treated the same as an empty object.
 * @param children Zero or more child nodes. They can be any React nodes, including React elements, strings, numbers, portals, empty nodes (null, undefined, true, and false).
 */
export default function createElement<P extends Record<string, unknown>>(
    type: HTMLElementTagName | 'TEXT_ELEMENT' | ((props: P) => RNode),
    props: P | null = null,
    ...children: Child[]
): RNode {
    return {
        type,
        props: {
            ...props,
            children: children.map((child) =>
                typeof child === 'object' && child !== null
                    ? child
                    : createTextElement(String(child)),
            ),
        },
    } as RNode;
}

function createTextElement(text: string): TextElement {
    return {
        type: 'TEXT_ELEMENT',
        props: {
            nodeValue: text,
            children: [],
        },
    };
}

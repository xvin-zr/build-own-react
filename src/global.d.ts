type HTMLElementTagName = keyof HTMLElementTagNameMap;

type Child = string | number | boolean | null | undefined | RNode | RNode[];

type RNode = ObjElement | TextElement;

type ObjElement = {
    type: HTMLElementTagName;
    props: {
        [key: string]: unknown;
        children: Child[];
    };
};

type TextElement = {
    type: 'TEXT_ELEMENT';
    props: {
        nodeValue: string;
        children: [];
    };
};

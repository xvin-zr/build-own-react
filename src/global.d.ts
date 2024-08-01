type HTMLElementTagName = keyof HTMLElementTagNameMap;

type Child = string | number | boolean | null | undefined | RNode;

type RNode = ObjElement | TextElement;

type ObjElement = {
    type: HTMLElementTagName;
    props: {
        [key: string]: unknown;
        children: RNode[];
    };
};

type TextElement = {
    type: 'TEXT_ELEMENT';
    props: {
        nodeValue: string;
        children: [];
    };
};

type Fiber = (
    | {
          type: HTMLElementTagName;
          dom: HTMLElement | null;
          props: {
              [key: string]: unknown;
              children: RNode[];
          };
      }
    | {
          type: 'TEXT_ELEMENT';
          dom: Text | null;
          props: {
              nodeValue: string;
              children: [];
          };
      }
) & {
    sibling: Fiber | null;
    child: Fiber | null;
    parent: Fiber | null;
    alternate?: Fiber; // a link to the old fiber
    effectTag?: EffectTag;
};

type Props = Fiber['props'];

type EffectTag = 'PLACEMENT' | 'UPDATE' | 'DELETION';

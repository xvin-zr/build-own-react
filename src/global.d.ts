type HTMLElementTagName = keyof HTMLElementTagNameMap;

type Child = string | number | boolean | null | undefined | RNode;

type RNode = ObjElement | TextElement | FuncElement<Record<string, unknown>>;

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

type FuncElement<P extends Record<string, unknown>> = {
    type: (props: P) => RNode;
    props: P & {
        children: RNode[];
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
    | {
          type: (props: Props) => RNode;
          dom: HTMLElement | null;
          props: {
              [key: string]: unknown;
              children: RNode[];
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

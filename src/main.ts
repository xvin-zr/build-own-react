import createElement from './create-element';
import render from './render';
import { useState } from './render';

const container = document.getElementById('root') as HTMLDivElement;

function Counter() {
    const [counter, setCounter] = useState(0);
    return createElement(
        'h2',
        null,
        counter.toString(),
        createElement(
            'button',
            { onclick: () => setCounter((c) => c + 1) },
            'Increment',
        ),
    );
}

const elem = createElement(Counter);

render(elem, container);

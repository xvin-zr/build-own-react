import createElement from './create-element';
import render from './render';

const container = document.getElementById('root') as HTMLDivElement;
function renderer(value: string = '') {
    const elem = createElement(
        'div',
        null,
        createElement('input', {
            oninput: handleInput,
        }),
        createElement('h1', null, value),
    );

    render(elem, container);
}

function handleInput(e: React.ChangeEvent<HTMLInputElement>) {
    renderer(e.target.value);
}

renderer('Type to render');

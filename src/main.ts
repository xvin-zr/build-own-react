import createElement from './create-element';
import render from './render';

const elem = createElement(
    'h1',
    { id: 'title' },
    'hello ',
    createElement('a', { href: 'https://www.apple.com.cn' }, 'Apple'),
);

const container = document.getElementById('root') as HTMLDivElement;

render(elem, container);

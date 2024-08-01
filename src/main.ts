import createElement from './create-element';
import render from './render';

function App({ name }: { name: string }) {
    return createElement('h1', null, 'Hi, ', name);
}

const container = document.getElementById('root') as HTMLDivElement;

const elem = createElement(App, { name: 'React' });

render(elem, container);

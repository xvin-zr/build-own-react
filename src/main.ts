import createElement from './create-element';

const elem = createElement('h1', { id: 'title' }, 'hello', createElement('h2', null));

console.log(elem);

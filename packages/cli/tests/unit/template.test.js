import { test } from 'node:test';
import assert from 'node:assert/strict';
import { render, mapSegment } from '../../src/core/filesystem/template.js';

test('interpola variables', () => {
  assert.equal(render('hola <%= name %>!', { name: 'mundo' }), 'hola mundo!');
});

test('falla con variables desconocidas (detecta typos en plantillas)', () => {
  assert.throws(() => render('<%= nope %>', {}), /variable desconocida "nope"/);
});

test('if / else / endif, negación y anidamiento', () => {
  const tpl = ['<%#if a%>', 'A', '<%#if !b%>', 'noB', '<%#else%>', 'B', '<%#endif%>', '<%#else%>', 'noA', '<%#endif%>'].join('\n');
  assert.equal(render(tpl, { a: true, b: false }), 'A\nnoB');
  assert.equal(render(tpl, { a: true, b: true }), 'A\nB');
  assert.equal(render(tpl, { a: false, b: true }), 'noA');
});

test('un bloque inactivo no evalúa variables internas', () => {
  assert.equal(render('<%#if a%>\n<%= desconocida %>\n<%#endif%>\nok', { a: false }), 'ok');
});

test('falla con bloques sin cerrar o flags inexistentes', () => {
  assert.throws(() => render('<%#if a%>\nx', { a: true }), /sin cerrar/);
  assert.throws(() => render('<%#if zzz%>\nx\n<%#endif%>', {}), /flag desconocido/);
  assert.throws(() => render('<%#endif%>', {}), /sin #if/);
});

test('no interfiere con llaves dobles de JSX ni de GitHub Actions', () => {
  const src = 'style={{ color: "red" }} ${{ secrets.X }}';
  assert.equal(render(src, {}), src);
});

test('normaliza CRLF', () => {
  assert.equal(render('a\r\nb', {}), 'a\nb');
});

test('dot- se convierte en punto', () => {
  assert.equal(mapSegment('dot-github'), '.github');
  assert.equal(mapSegment('src'), 'src');
});

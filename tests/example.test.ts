import { screen } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';

test('renders a button and responds to click', async () => {
  document.body.innerHTML = `<button id="btn">Click</button><div id="out"></div>`;
  const btn = screen.getByText('Click');
  btn.addEventListener('click', () => {
    const out = document.getElementById('out');
    if (out) out.textContent = 'clicked';
  });
  await userEvent.click(btn);
  expect(screen.getByText('clicked')).toBeInTheDocument();
});

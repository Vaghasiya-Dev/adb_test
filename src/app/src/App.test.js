import { fireEvent, render, screen } from '@testing-library/react';
import App from './App';

describe('App', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  test('loads existing todos and creates a new one', async () => {
    global.fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ todos: [{ description: 'Learn Docker' }, { description: 'Learn React' }] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: 'Todo created successfully' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ todos: [{ description: 'Learn Docker' }, { description: 'Learn React' }, { description: 'Ship app' }] }),
      });

    render(<App />);

    expect(await screen.findByText('Learn Docker')).toBeInTheDocument();
    expect(screen.getByText('Learn React')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/what needs your attention/i), {
      target: { value: 'Ship app' },
    });

    fireEvent.click(screen.getByRole('button', { name: /add task/i }));

    expect(global.fetch).toHaveBeenNthCalledWith(
      2,
      'http://localhost:8000/todos/',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
        }),
        body: JSON.stringify({ description: 'Ship app' }),
      })
    );

    expect(await screen.findByText('Ship app')).toBeInTheDocument();
  });
});

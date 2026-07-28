// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Home from './page';

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn());
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

function mockFetchJson(body: unknown) {
  (fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
    json: async () => body,
  });
}

describe('Home waitlist form', () => {
  it('submits the email and shows the success message', async () => {
    mockFetchJson({ success: true, message: "You're on the list!" });
    const user = userEvent.setup();
    render(<Home />);

    await user.type(screen.getByPlaceholderText('Email address'), 'chef@example.com');
    await user.click(screen.getByRole('button', { name: /join the waitlist/i }));

    await waitFor(() => {
      expect(screen.getByText("You're on the list!")).toBeInTheDocument();
    });

    const [, init] = (fetch as unknown as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(JSON.parse(init.body as string).email).toBe('chef@example.com');
  });

  it('shows the error message when the API reports failure', async () => {
    mockFetchJson({ success: false, error: 'Something went wrong' });
    const user = userEvent.setup();
    render(<Home />);

    await user.type(screen.getByPlaceholderText('Email address'), 'chef@example.com');
    await user.click(screen.getByRole('button', { name: /join the waitlist/i }));

    await waitFor(() => {
      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    });
  });
});

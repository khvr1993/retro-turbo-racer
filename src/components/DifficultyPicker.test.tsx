// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { DifficultyPicker } from './DifficultyPicker';

describe('DifficultyPicker', () => {
  it('marks the active difficulty as pressed', () => {
    render(<DifficultyPicker value="medium" onChange={() => {}} withMeta />);

    expect(screen.getByRole('button', { name: 'Medium' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
    expect(screen.getByRole('button', { name: 'Easy' })).toHaveAttribute(
      'aria-pressed',
      'false'
    );
    expect(screen.getByText('SELECT DIFFICULTY')).toBeInTheDocument();
  });

  it('calls onChange with the clicked difficulty', async () => {
    const onChange = vi.fn();
    render(<DifficultyPicker value="medium" onChange={onChange} />);

    await userEvent.click(screen.getByRole('button', { name: 'Hard' }));

    expect(onChange).toHaveBeenCalledWith('hard');
  });
});

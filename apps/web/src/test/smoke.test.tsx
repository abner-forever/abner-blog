import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';

describe('smoke', () => {
  it('renders basic jsx', () => {
    render(<div>ok</div>);
    expect(screen.getByText('ok')).toBeInTheDocument();
  });
});

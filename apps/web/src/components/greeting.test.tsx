import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Greeting } from './greeting.js';

describe('Greeting', () => {
  it('renders the name', () => {
    render(<Greeting name="World" />);
    expect(screen.getByText('Hello, World!')).toBeDefined();
  });
});

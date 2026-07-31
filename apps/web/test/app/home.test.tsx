/**
 * <!-- agent-notes: { ctx: "P0 TDD red phase, coverage veto, test strategy owner", deps: ["apps/web/src/app/page.tsx"], state: canonical, last: "tara@2026-07-31", key: ["home page tests"] } -->
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import HomePage from '../../src/app/page';

describe('Home Page', () => {
  it('should render prominent links/cards to Professor Portal, Prompt Lab, and Boss Raid Arena', () => {
    render(<HomePage />);
    
    expect(screen.getByRole('link', { name: /Professor Portal/i })).toBeDefined();
    expect(screen.getByRole('link', { name: /Prompt Lab/i })).toBeDefined();
    expect(screen.getByRole('link', { name: /Boss Raid Arena/i })).toBeDefined();
  });
});

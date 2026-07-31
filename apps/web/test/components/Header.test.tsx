/**
 * <!-- agent-notes: { ctx: "P0 TDD red phase, coverage veto, test strategy owner", deps: ["apps/web/src/components/Header.tsx"], state: canonical, last: "tara@2026-07-31", key: ["header component tests"] } -->
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Header from '../../src/components/Header';

describe('Header Component', () => {
  it('should contain links to /, /professor, /prompt-lab, and /lobby', () => {
    render(<Header />);
    
    expect(screen.getByRole('link', { name: /home|prompt royale/i }).getAttribute('href')).toBe('/');
    expect(screen.getByRole('link', { name: /professor/i }).getAttribute('href')).toBe('/professor');
    expect(screen.getByRole('link', { name: /prompt lab/i }).getAttribute('href')).toBe('/prompt-lab');
    expect(screen.getByRole('link', { name: /lobby/i }).getAttribute('href')).toBe('/lobby');
  });
});

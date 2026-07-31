/**
 * <!-- agent-notes: { ctx: "P0 TDD red phase, coverage veto, test strategy owner", deps: ["apps/web/src/app/lobby/page.tsx"], state: canonical, last: "tara@2026-07-31", key: ["lobby page tests"] } -->
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import LobbyPage from '../../src/app/lobby/page';

vi.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: vi.fn(),
    };
  },
}));

describe('Lobby Page', () => {
  it('should render a Squad Lobby placeholder', () => {
    render(<LobbyPage />);
    expect(screen.getByText(/Squad Lobby/i)).toBeDefined();
  });
});

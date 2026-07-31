/**
 * <!-- agent-notes: { ctx: "P0 TDD red phase, coverage veto, test strategy owner", deps: ["apps/web/src/app/lobby/page.tsx"], state: canonical, last: "sato@2026-07-31", key: ["lobby page tests"] } -->
 */
import React from 'react';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import LobbyPage from '../../src/app/lobby/page';

describe('Lobby Page', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('should render a Squad Lobby placeholder', () => {
    render(<LobbyPage />);
    expect(screen.getByText(/Squad Lobby/i)).toBeDefined();
  });

  it('should show error state on fetch failure', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({ ok: false } as Response);
    render(<LobbyPage />);
    
    const button = screen.getByRole('button', { name: /Create Lobby/i });
    fireEvent.click(button);
    
    await waitFor(() => {
      expect(screen.getByText(/Failed to create lobby/i)).toBeDefined();
    });
  });

  it('should show invite link and handle safe URLs on success', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ lobbyId: '123', inviteLink: 'https://discord.gg/test' })
    } as Response);
    
    render(<LobbyPage />);
    
    const button = screen.getByRole('button', { name: /Create Lobby/i });
    fireEvent.click(button);
    
    await waitFor(() => {
      expect(screen.getByText('123')).toBeDefined();
      expect(screen.getByRole('link', { name: 'https://discord.gg/test' })).toBeDefined();
    });
  });
  
  it('should catch unsafe URLs and display invalid link message', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ lobbyId: '123', inviteLink: 'javascript:alert(1)' })
    } as Response);
    
    render(<LobbyPage />);
    
    const button = screen.getByRole('button', { name: /Create Lobby/i });
    fireEvent.click(button);
    
    await waitFor(() => {
      expect(screen.getByText(/Invalid invite link provided by server/i)).toBeDefined();
    });
  });
});

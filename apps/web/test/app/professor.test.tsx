/**
 * <!-- agent-notes: { ctx: "P0 TDD red phase, coverage veto, test strategy owner", deps: ["apps/web/src/app/professor/page.tsx"], state: canonical, last: "tara@2026-07-31", key: ["professor page tests"] } -->
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import ProfessorPage from '../../src/app/professor/page';

describe('Professor Page', () => {
  it('should render the UploadForm component', () => {
    render(<ProfessorPage />);
    // Looking for a typical accessible form or heading from UploadForm
    expect(screen.getByRole('heading', { name: /upload course material/i })).toBeDefined();
  });
});

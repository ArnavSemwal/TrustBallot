import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import BallotPage from './BallotPage';
import { KioskProvider } from '../context/KioskContext';
import { expect, test } from 'vitest';

test('BallotPage renders and allows candidate selection', () => {
  render(
    <MemoryRouter>
      <KioskProvider>
        <BallotPage />
      </KioskProvider>
    </MemoryRouter>
  );

  // Check header
  expect(screen.getByText('Select Your Candidate')).toBeInTheDocument();
  
  // Candidate list
  const candidates = screen.getAllByRole('button');
  expect(candidates.length).toBeGreaterThan(0);
  
  // Click first candidate vote button
  const voteBtns = screen.getAllByText('VOTE');
  expect(voteBtns.length).toBeGreaterThan(0);
  fireEvent.click(voteBtns[0]);
  
  // Confirm modal should appear
  expect(screen.getByText('CONFIRM YOUR VOTE')).toBeInTheDocument();
  const yesBtn = screen.getByText('YES');
  expect(yesBtn).toBeEnabled();
});

import '@testing-library/jest-dom';
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
  
  // Select first candidate
  fireEvent.click(candidates[0]);
  
  // Confirm button should be enabled
  const confirmBtn = screen.getByText('Confirm Selection');
  expect(confirmBtn).toBeEnabled();
});

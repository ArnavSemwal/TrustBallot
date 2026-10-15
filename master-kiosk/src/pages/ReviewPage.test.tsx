import React, { useEffect } from 'react';
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ReviewPage from './ReviewPage';
import { KioskProvider, useKiosk } from '../context/KioskContext';
import { expect, test } from 'vitest';

function ReviewPageWithCandidate() {
  const { setSelectedCandidate, setVoterVerified } = useKiosk();
  useEffect(() => {
    setVoterVerified('1234567890');
    setSelectedCandidate({
      id: 'c1',
      name: { en: 'Rakesh Bahuguna', hi: 'राकेश बहुगुणा' },
      party: { en: 'Jan Vikas Party', hi: 'जन विकास पार्टी' },
      color: '#028090'
    });
  }, [setSelectedCandidate, setVoterVerified]);

  return <ReviewPage />;
}

test('ReviewPage renders selection and allows confirmation', () => {
  render(
    <MemoryRouter>
      <KioskProvider>
        <ReviewPageWithCandidate />
      </KioskProvider>
    </MemoryRouter>
  );

  // Review screen
  expect(screen.getByText(/Review Your Digital Slip/i)).toBeInTheDocument();
  
  // Action buttons
  expect(screen.getByText(/Yes, Confirm & Cast Vote/i)).toBeInTheDocument();
  expect(screen.getByText(/Cancel & Return/i)).toBeInTheDocument();
});

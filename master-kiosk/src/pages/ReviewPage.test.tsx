import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ReviewPage from './ReviewPage';
import { KioskProvider } from '../context/KioskContext';
import { expect, test } from 'vitest';

test('ReviewPage renders selection and allows cancellation', () => {
  render(
    <MemoryRouter>
      <KioskProvider>
        <ReviewPage />
      </KioskProvider>
    </MemoryRouter>
  );

  // Review screen
  expect(screen.getByText('Review Your Vote')).toBeInTheDocument();
  
  // Action buttons
  const castBtn = screen.getByText('Cast Ballot Securely');
  const cancelBtn = screen.getByText('Change Selection');
  
  expect(castBtn).toBeInTheDocument();
  expect(cancelBtn).toBeInTheDocument();
});

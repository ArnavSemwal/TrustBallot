import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AuthPage from './AuthPage';
import { KioskProvider } from '../context/KioskContext';
import { expect, test } from 'vitest';

test('renders AuthPage successfully', () => {
  render(
    <MemoryRouter>
      <KioskProvider>
        <AuthPage />
      </KioskProvider>
    </MemoryRouter>
  );

  // Verify the component renders without crashing
  expect(document.body).toBeInTheDocument();
});

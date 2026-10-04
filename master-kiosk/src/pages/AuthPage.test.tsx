import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AuthPage from './AuthPage';
import { KioskProvider } from '../context/KioskContext';
import { expect, test, vi } from 'vitest';

vi.mock('react-webcam', () => {
  return {
    default: () => <div data-testid="mock-webcam" />
  }
});

vi.mock('html5-qrcode', () => ({
  Html5Qrcode: vi.fn().mockImplementation(() => ({
    start: vi.fn().mockResolvedValue(undefined),
    stop: vi.fn().mockResolvedValue(undefined),
    isScanning: true
  }))
}));

test('AuthPage progresses from QR to PIN correctly', async () => {
  render(
    <MemoryRouter>
      <KioskProvider>
        <AuthPage />
      </KioskProvider>
    </MemoryRouter>
  );

  // QR Step
  expect(screen.getByText('Voter Verification')).toBeInTheDocument();
  
  // Enter EPIC manually
  fireEvent.click(screen.getByText('1'));
  fireEvent.click(screen.getByText('2'));
  fireEvent.click(screen.getByText('3'));
  fireEvent.click(screen.getByText('4'));
  fireEvent.click(screen.getByText('5'));
  fireEvent.click(screen.getByText('6'));
  fireEvent.click(screen.getByText('7'));
  fireEvent.click(screen.getByText('8'));
  fireEvent.click(screen.getByText('9'));
  fireEvent.click(screen.getByText('0'));
  
  // Verify & Proceed
  fireEvent.click(screen.getByText('Verify & Proceed'));

  // Webcam Step
  expect(screen.getByText('Verifying Biometrics…')).toBeInTheDocument();
  fireEvent.click(screen.getByText('Demo: Force Pass'));
});

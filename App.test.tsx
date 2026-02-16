import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import App from './App';

// Polyfill types for test environment
declare var jest: any;
declare var describe: any;
declare var test: any;
declare var expect: any;
declare namespace jest {
  type Mock = any;
}

// Mock the hook to control state
jest.mock('./hooks/useGameLogic', () => ({
  useGameLogic: () => ({
    gameState: {
      status: 'MENU', // Default to MENU
      indiaScore: 0,
      pakistanScore: 0,
      target: null,
      balls: [],
      winner: null,
      lastBall: null,
      venue: null,
    },
    coachTip: null,
    isAiLoading: false,
    playBall: jest.fn(),
    startGame: jest.fn(),
    startInnings2: jest.fn(),
    restartGame: jest.fn(),
    goToMenu: jest.fn(),
  }),
}));

describe('App Integration', () => {
  test('renders Menu screen initially', () => {
    render(<App />);
    expect(screen.getByText(/HAND CRICKET/i)).toBeInTheDocument();
    expect(screen.getByText(/Start Match/i)).toBeInTheDocument();
  });

  test('Start button triggers game start', () => {
    const { useGameLogic } = require('./hooks/useGameLogic');
    const startGameMock = jest.fn();
    (useGameLogic as jest.Mock).mockReturnValue({
        gameState: { status: 'MENU' },
        startGame: startGameMock
    });

    render(<App />);
    fireEvent.click(screen.getByText(/Start Match/i));
    expect(startGameMock).toHaveBeenCalledTimes(1);
  });
});
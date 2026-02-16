import React from 'react';
import { render, screen } from '@testing-library/react';
import ScoreBoard from './ScoreBoard';
import { GameStatus } from '../types';

// Polyfill types for test environment
declare var describe: any;
declare var test: any;
declare var expect: any;

describe('ScoreBoard Component', () => {
  const defaultProps = {
    indiaScore: 50,
    pakistanScore: 20,
    status: GameStatus.INNINGS_1,
    target: null,
    venue: { name: 'Eden Gardens', url: 'http://maps.google.com' }
  };

  test('renders scores correctly', () => {
    render(<ScoreBoard {...defaultProps} />);
    
    expect(screen.getByLabelText(/India Score/i)).toHaveTextContent('50');
    expect(screen.getByLabelText(/Pakistan Score/i)).toHaveTextContent('20');
  });

  test('displays venue information', () => {
    render(<ScoreBoard {...defaultProps} />);
    expect(screen.getByText(/Eden Gardens/i)).toBeInTheDocument();
  });

  test('indicates current batting team (India)', () => {
    render(<ScoreBoard {...defaultProps} />);
    // Check for "Batting" indicator on India side
    const indiaSection = screen.getByText('India').closest('div');
    expect(indiaSection).toHaveTextContent('Batting');
  });

  test('displays target in 2nd innings', () => {
    render(<ScoreBoard {...defaultProps} status={GameStatus.INNINGS_2} target={100} />);
    expect(screen.getByText(/Target: 100/i)).toBeInTheDocument();
  });
});
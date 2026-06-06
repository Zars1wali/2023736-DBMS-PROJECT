import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import IncidentsPage from '../IncidentsPage';

// Mock the API client module
vi.mock('../../api/client', () => ({
  default: {
    get: vi.fn()
  }
}));

import client from '../../api/client';

const sampleIncidents = [
  { id: 1, title: 'SQL Injection Attack', severity: 'Critical', status: 'Open' },
  { id: 2, title: 'Phishing Campaign', severity: 'High', status: 'In Progress' },
  { id: 3, title: 'Brute Force Login', severity: 'Medium', status: 'Resolved' }
];

beforeEach(() => {
  vi.clearAllMocks();
  client.get.mockResolvedValue({ data: [] });
});

describe('IncidentsPage', () => {
  describe('Rendering', () => {
    it('renders the page title', async () => {
      render(<IncidentsPage />);
      expect(screen.getByRole('heading', { name: /incidents/i })).toBeInTheDocument();
    });

    it('renders status and severity filter inputs', async () => {
      render(<IncidentsPage />);
      await waitFor(() => {
        expect(screen.getByTestId('status-input')).toBeInTheDocument();
        expect(screen.getByTestId('severity-input')).toBeInTheDocument();
      });
    });

    it('renders a Filter button', async () => {
      render(<IncidentsPage />);
      await waitFor(() => {
        expect(screen.getByTestId('filter-btn')).toBeInTheDocument();
      });
    });

    it('renders incidents output area', async () => {
      render(<IncidentsPage />);
      await waitFor(() => {
        expect(screen.getByTestId('incidents-output')).toBeInTheDocument();
      });
    });
  });

  describe('Initial data load', () => {
    it('calls the API on mount', async () => {
      render(<IncidentsPage />);
      await waitFor(() => {
        expect(client.get).toHaveBeenCalledWith('/incidents', { params: {} });
      });
    });

    it('displays loaded incidents as JSON', async () => {
      client.get.mockResolvedValue({ data: sampleIncidents });
      render(<IncidentsPage />);

      await waitFor(() => {
        const output = screen.getByTestId('incidents-output');
        expect(output.textContent).toContain('SQL Injection Attack');
        expect(output.textContent).toContain('Phishing Campaign');
      });
    });

    it('shows empty array when no incidents returned', async () => {
      client.get.mockResolvedValue({ data: [] });
      render(<IncidentsPage />);

      await waitFor(() => {
        const output = screen.getByTestId('incidents-output');
        expect(output.textContent).toBe('[]');
      });
    });
  });

  describe('Filter inputs', () => {
    it('updates status input when user types', async () => {
      const user = userEvent.setup();
      render(<IncidentsPage />);

      const statusInput = screen.getByTestId('status-input');
      await user.type(statusInput, 'Open');
      expect(statusInput).toHaveValue('Open');
    });

    it('updates severity input when user types', async () => {
      const user = userEvent.setup();
      render(<IncidentsPage />);

      const severityInput = screen.getByTestId('severity-input');
      await user.type(severityInput, 'Critical');
      expect(severityInput).toHaveValue('Critical');
    });

    it('inputs start empty', async () => {
      render(<IncidentsPage />);
      await waitFor(() => {
        expect(screen.getByTestId('status-input')).toHaveValue('');
        expect(screen.getByTestId('severity-input')).toHaveValue('');
      });
    });
  });

  describe('Filter button', () => {
    it('sends status param when status is set', async () => {
      const user = userEvent.setup();
      render(<IncidentsPage />);

      await user.type(screen.getByTestId('status-input'), 'Open');
      await user.click(screen.getByTestId('filter-btn'));

      await waitFor(() => {
        expect(client.get).toHaveBeenCalledWith('/incidents', {
          params: { status: 'Open' }
        });
      });
    });

    it('sends severity param when severity is set', async () => {
      const user = userEvent.setup();
      render(<IncidentsPage />);

      await user.type(screen.getByTestId('severity-input'), 'Critical');
      await user.click(screen.getByTestId('filter-btn'));

      await waitFor(() => {
        expect(client.get).toHaveBeenCalledWith('/incidents', {
          params: { severity: 'Critical' }
        });
      });
    });

    it('sends both params when both filters are set', async () => {
      const user = userEvent.setup();
      render(<IncidentsPage />);

      await user.type(screen.getByTestId('status-input'), 'Open');
      await user.type(screen.getByTestId('severity-input'), 'High');
      await user.click(screen.getByTestId('filter-btn'));

      await waitFor(() => {
        expect(client.get).toHaveBeenCalledWith('/incidents', {
          params: { status: 'Open', severity: 'High' }
        });
      });
    });

    it('sends empty params object when no filters are set', async () => {
      const user = userEvent.setup();
      render(<IncidentsPage />);

      // Wait for the initial auto-load call
      await waitFor(() => expect(client.get).toHaveBeenCalledTimes(1));

      await user.click(screen.getByTestId('filter-btn'));

      await waitFor(() => {
        expect(client.get).toHaveBeenLastCalledWith('/incidents', { params: {} });
      });
    });

    it('updates displayed incidents after filtering', async () => {
      const user = userEvent.setup();
      const filteredIncidents = [sampleIncidents[0]];
      client.get.mockResolvedValue({ data: [] });

      render(<IncidentsPage />);
      await waitFor(() => expect(client.get).toHaveBeenCalledTimes(1));

      client.get.mockResolvedValue({ data: filteredIncidents });
      await user.type(screen.getByTestId('status-input'), 'Open');
      await user.click(screen.getByTestId('filter-btn'));

      await waitFor(() => {
        const output = screen.getByTestId('incidents-output');
        expect(output.textContent).toContain('SQL Injection Attack');
      });
    });
  });

  describe('State management', () => {
    it('reflects updated incident list in the output after API response', async () => {
      client.get.mockResolvedValueOnce({ data: sampleIncidents });
      render(<IncidentsPage />);

      await waitFor(() => {
        const output = screen.getByTestId('incidents-output');
        const parsed = JSON.parse(output.textContent);
        expect(parsed).toHaveLength(3);
        expect(parsed[0].title).toBe('SQL Injection Attack');
      });
    });
  });
});

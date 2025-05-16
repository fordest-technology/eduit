import React from 'react';
import { render, screen } from '@testing-library/react';
import { ResultsConfigurationFormContainer } from '@/app/dashboard/results/_components/results-configuration-form-container';
import { ResultsConfigurationForm } from '@/app/dashboard/results/_components/results-configuration-form';
import { prisma, withErrorHandling } from '@/lib/prisma';

// Mock dependencies
jest.mock('@/lib/prisma', () => ({
    prisma: {
        academicSession: {
            findFirst: jest.fn(),
        },
        $queryRaw: jest.fn(),
        $executeRaw: jest.fn(),
    },
    withErrorHandling: jest.fn((fn) => fn()),
}));

jest.mock('@/app/dashboard/results/_components/results-configuration-form', () => ({
    ResultsConfigurationForm: jest.fn(() => <div data-testid="results-form">Results Form</div>),
}));

describe('ResultsConfigurationFormContainer', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should display a warning when no active academic session is found', async () => {
        // Arrange
        (prisma.academicSession.findFirst as jest.Mock).mockResolvedValue(null);

        // Act
        const { findByText } = render(
            <ResultsConfigurationFormContainer schoolId="test-school" />
        );

        // Assert
        expect(await findByText(/No active academic session found/i)).toBeInTheDocument();
    });

    it('should render the form with existing configuration', async () => {
        // Arrange
        (prisma.academicSession.findFirst as jest.Mock).mockResolvedValue({
            id: 'session1',
            name: '2023/2024',
        });

        const mockConfig = [
            {
                id: 'config1',
                schoolId: 'test-school',
                sessionId: 'session1',
                cumulativeEnabled: true,
                cumulativeMethod: 'progressive_average',
                showCumulativePerTerm: true,
                academicYear: '2023/2024',
            },
        ];

        const mockPeriods = [
            {
                id: 'period1',
                name: 'Term 1',
                weight: 1,
            },
        ];

        const mockComponents = [
            {
                id: 'comp1',
                name: 'CA',
                key: 'ca',
                maxScore: 40,
            },
        ];

        const mockGrades = [
            {
                id: 'grade1',
                minScore: 70,
                maxScore: 100,
                grade: 'A',
                remark: 'Excellent',
            },
        ];

        (prisma.$queryRaw as jest.Mock)
            .mockResolvedValueOnce(mockConfig)
            .mockResolvedValueOnce(mockPeriods)
            .mockResolvedValueOnce(mockComponents)
            .mockResolvedValueOnce(mockGrades);

        // Act
        render(<ResultsConfigurationFormContainer schoolId="test-school" />);

        // Assert
        await screen.findByTestId('results-form');
        expect(ResultsConfigurationForm).toHaveBeenCalledWith(
            expect.objectContaining({
                initialData: expect.objectContaining({
                    id: 'config1',
                    schoolId: 'test-school',
                    academicYear: '2023/2024',
                    periods: expect.arrayContaining([
                        expect.objectContaining({
                            id: 'period1',
                            name: 'Term 1',
                            weight: 1,
                        }),
                    ]),
                    assessmentComponents: expect.arrayContaining([
                        expect.objectContaining({
                            id: 'comp1',
                            name: 'CA',
                            key: 'ca',
                            maxScore: 40,
                        }),
                    ]),
                    gradingScale: expect.arrayContaining([
                        expect.objectContaining({
                            id: 'grade1',
                            minScore: 70,
                            maxScore: 100,
                            grade: 'A',
                            remark: 'Excellent',
                        }),
                    ]),
                }),
            }),
            expect.anything()
        );
    });

    it('should create a new configuration when none exists', async () => {
        // Arrange
        (prisma.academicSession.findFirst as jest.Mock).mockResolvedValue({
            id: 'session1',
            name: '2023/2024',
        });

        (prisma.$queryRaw as jest.Mock)
            .mockResolvedValueOnce([]) // No existing config
            .mockResolvedValueOnce([
                {
                    id: 'new-config',
                    schoolId: 'test-school',
                    academicYear: '2023/2024',
                },
            ]);

        // Act
        render(<ResultsConfigurationFormContainer schoolId="test-school" />);

        // Assert
        await screen.findByTestId('results-form');
        expect(prisma.$executeRaw).toHaveBeenCalled();
        expect(ResultsConfigurationForm).toHaveBeenCalledWith(
            expect.objectContaining({
                initialData: expect.objectContaining({
                    schoolId: 'test-school',
                    periods: [],
                    assessmentComponents: [],
                    gradingScale: [],
                }),
            }),
            expect.anything()
        );
    });

    it('should handle errors gracefully', async () => {
        // Arrange
        const errorMessage = 'Database connection failed';
        (withErrorHandling as jest.Mock).mockImplementation(() => {
            throw new Error(errorMessage);
        });

        // Act
        const { findByText } = render(
            <ResultsConfigurationFormContainer schoolId="test-school" />
        );

        // Assert
        expect(await findByText(/An error occurred/i)).toBeInTheDocument();
        expect(await findByText(errorMessage)).toBeInTheDocument();
    });
}); 
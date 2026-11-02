<?php

namespace App\Exports;

use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithColumnWidths;
use Maatwebsite\Excel\Concerns\WithEvents;
use Maatwebsite\Excel\Concerns\WithProperties;
use Maatwebsite\Excel\Concerns\WithTitle;
use Maatwebsite\Excel\Events\AfterSheet;
use PhpOffice\PhpSpreadsheet\Shared\Date as ExcelDate;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Worksheet\PageSetup;

class TaskReportExport implements FromCollection, WithColumnWidths, WithEvents, WithProperties, WithTitle
{
    private const TOTAL_COLUMNS = 11;

    private array $projectHeaderRows = [];

    private array $columnHeaderRows = [];

    private array $projectSummaryRows = [];

    private array $dataRows = [];

    private int $overallSummaryRow = 0;

    /**
     * @param Collection<int, array<string, mixed>> $tasks
     * @param array{
     *     team: string,
     *     employee: string,
     *     tag: string,
     *     date_from: string,
     *     date_to: string,
     *     status: string
     * } $filters
     */
    public function __construct(
        private readonly Collection $tasks,
        private readonly array $filters,
    ) {}

    public function collection(): Collection
    {
        $rows = collect([
            $this->makeRow(['TASK ACTIVITY REPORT']),
            $this->makeRow(['APPLIED FILTERS']),
            $this->makeRow([
                'Team',
                $this->filters['team'],
                'Employee',
                $this->filters['employee'],
                'Tag',
                $this->filters['tag'],
            ]),
            $this->makeRow([
                'Date From',
                $this->filters['date_from'],
                'Date To',
                $this->filters['date_to'],
                'Status',
                $this->filters['status'],
            ]),
            $this->blankRow(),
        ]);

        $projectGroups = $this->tasks->groupBy('project_id');

        foreach ($projectGroups as $projectTasks) {
            $projectTasks = $projectTasks->values();

            $firstTask = $projectTasks->first();

            $projectCode = $firstTask['project_code'] ?? null;
            $projectName = $firstTask['project_name'] ?? 'Unknown Project';

            $projectTitle = trim(
                ($projectCode ? $projectCode.' — ' : '').$projectName
            );

            // Project Header
            $rows->push(
                $this->makeRow(["PROJECT: {$projectTitle}"])
            );

            $this->projectHeaderRows[] = $rows->count();

            // Column Header
            $rows->push(
                $this->makeRow([
                    'No.',
                    'Task',
                    'Employee',
                    'Project',
                    'Team',
                    'Tags',
                    'Start Date',
                    'Due Date',
                    'Completed Date',
                    'Status',
                    'Priority',
                ])
            );

            $this->columnHeaderRows[] = $rows->count();

            // Task Rows
            foreach ($projectTasks as $index => $task) {
                $rows->push(
                    $this->makeRow([
                        $index + 1,

                        trim(
                            (($task['code'] ?? null)
                                ? $task['code'].' — '
                                : '')
                            .($task['title'] ?? '')
                        ),

                        collect($task['assignees'] ?? [])
                            ->pluck('name')
                            ->filter()
                            ->implode(', ') ?: '—',

                        $task['project_name'] ?? '—',

                        collect($task['teams'] ?? [])
                            ->implode(', ') ?: '—',

                        collect($task['tags'] ?? [])
                            ->pluck('name')
                            ->filter()
                            ->implode(', ') ?: '—',

                        $this->excelDate($task['start_date'] ?? null),
                        $this->excelDate($task['end_date'] ?? null),
                        $this->excelDate($task['completed_at'] ?? null),

                        $task['group_name']
                            ?: (($task['is_completed'] ?? false)
                                ? 'Completed'
                                : 'Open'),

                        ucfirst(strtolower($task['priority'] ?? 'NORMAL')),
                    ])
                );

                $this->dataRows[] = $rows->count();
            }

            // Project Summary
            $completedCount = $projectTasks
                ->where('is_completed', true)
                ->count();

            $overdueCount = $projectTasks
                ->filter(fn (array $task): bool => (bool) ($task['is_overdue'] ?? false))
                ->count();

            $totalCount = $projectTasks->count();

            $rows->push(
                $this->makeRow([
                    'PROJECT SUMMARY',
                    '',
                    '',
                    '',
                    '',
                    '',
                    'Tasks: '.$totalCount,
                    'Completed: '.$completedCount,
                    'Open: '.($totalCount - $completedCount),
                    'Overdue: '.$overdueCount,
                ])
            );

            $this->projectSummaryRows[] = $rows->count();

            // Explicit blank row (never use [])
            $rows->push($this->blankRow());
        }

        // Overall Summary
        $completedCount = $this->tasks
            ->where('is_completed', true)
            ->count();

        $totalCount = $this->tasks->count();

        $this->overallSummaryRow = $rows->count() + 1;

        $rows->push(
            $this->makeRow([
                'OVERALL SUMMARY',
                '',
                '',
                '',
                '',
                '',
                'Tasks: '.$totalCount,
                'Projects: '.$projectGroups->count(),
                'Completed: '.$completedCount,
                'Open: '.($totalCount - $completedCount),
                'Overdue: '.$this->tasks
                    ->filter(fn (array $task): bool => (bool) ($task['is_overdue'] ?? false))
                    ->count(),
            ])
        );

        return $rows;
    }

    private function makeRow(array $values): array
    {
        return array_pad(
            array_slice($values, 0, self::TOTAL_COLUMNS),
            self::TOTAL_COLUMNS,
            null
        );
    }

    private function blankRow(): array
    {
        return array_fill(0, self::TOTAL_COLUMNS, null);
    }

    public function columnWidths(): array
    {
        return [
            'A' => 10,
            'B' => 38,
            'C' => 25,
            'D' => 25,
            'E' => 22,
            'F' => 26,
            'G' => 16,
            'H' => 16,
            'I' => 19,
            'J' => 18,
            'K' => 14,
        ];
    }

    public function properties(): array
    {
        return [
            'creator' => config('app.name'),
            'title' => 'Task Activity Report',
            'subject' => 'Project grouped task report',
            'description' => 'Tasks matching the selected report filters and status.',
        ];
    }

    public function title(): string
    {
        return 'Task Report';
    }

    public function registerEvents(): array
    {
        return [
            AfterSheet::class => function (AfterSheet $event): void {
                $sheet = $event->sheet->getDelegate();

                $lastRow = $sheet->getHighestRow();

                // Main header
                $sheet->mergeCells('A1:K1');
                $sheet->mergeCells('A2:K2');

                // Project headers
                foreach ($this->projectHeaderRows as $row) {
                    $sheet->mergeCells("A{$row}:K{$row}");
                }

                // Project summaries
                foreach ($this->projectSummaryRows as $row) {
                    $sheet->mergeCells("A{$row}:F{$row}");
                }

                // Overall summary
                $sheet->mergeCells(
                    "A{$this->overallSummaryRow}:F{$this->overallSummaryRow}"
                );

                $sheet->getDefaultRowDimension()->setRowHeight(21);

                // Base style
                $sheet->getStyle("A1:K{$lastRow}")->applyFromArray([
                    'font' => [
                        'name' => 'Aptos',
                        'size' => 10,
                        'color' => ['rgb' => '334155'],
                    ],
                    'alignment' => [
                        'vertical' => Alignment::VERTICAL_CENTER,
                    ],
                    'borders' => [
                        'bottom' => [
                            'borderStyle' => Border::BORDER_HAIR,
                            'color' => ['rgb' => 'E2E8F0'],
                        ],
                    ],
                ]);

                // Report title
                $sheet->getStyle('A1:K1')->applyFromArray([
                    'font' => [
                        'name' => 'Aptos Display',
                        'size' => 20,
                        'bold' => true,
                        'color' => ['rgb' => 'FFFFFF'],
                    ],
                    'fill' => [
                        'fillType' => Fill::FILL_SOLID,
                        'startColor' => ['rgb' => '312E81'],
                    ],
                    'alignment' => [
                        'vertical' => Alignment::VERTICAL_CENTER,
                        'horizontal' => Alignment::HORIZONTAL_LEFT,
                    ],
                ]);

                $sheet->getRowDimension(1)->setRowHeight(40);

                // Applied filters title
                $sheet->getStyle('A2:K2')->applyFromArray([
                    'font' => [
                        'bold' => true,
                        'size' => 11,
                        'color' => ['rgb' => '312E81'],
                    ],
                    'fill' => [
                        'fillType' => Fill::FILL_SOLID,
                        'startColor' => ['rgb' => 'EEF2FF'],
                    ],
                ]);

                // Filter information
                $sheet->getStyle('A3:K4')->applyFromArray([
                    'fill' => [
                        'fillType' => Fill::FILL_SOLID,
                        'startColor' => ['rgb' => 'F8FAFC'],
                    ],
                ]);

                foreach (['A3', 'C3', 'E3', 'A4', 'C4', 'E4'] as $cell) {
                    $sheet->getStyle($cell)->getFont()
                        ->setBold(true)
                        ->getColor()
                        ->setRGB('475569');
                }

                // Project headers
                foreach ($this->projectHeaderRows as $row) {
                    $sheet->getStyle("A{$row}:K{$row}")->applyFromArray([
                        'font' => [
                            'bold' => true,
                            'size' => 12,
                            'color' => ['rgb' => 'FFFFFF'],
                        ],
                        'fill' => [
                            'fillType' => Fill::FILL_SOLID,
                            'startColor' => ['rgb' => '4338CA'],
                        ],
                        'alignment' => [
                            'vertical' => Alignment::VERTICAL_CENTER,
                        ],
                    ]);

                    $sheet->getRowDimension($row)->setRowHeight(29);
                }

                // Column headers
                foreach ($this->columnHeaderRows as $row) {
                    $sheet->getStyle("A{$row}:K{$row}")->applyFromArray([
                        'font' => [
                            'bold' => true,
                            'color' => ['rgb' => '334155'],
                        ],
                        'fill' => [
                            'fillType' => Fill::FILL_SOLID,
                            'startColor' => ['rgb' => 'E2E8F0'],
                        ],
                        'alignment' => [
                            'vertical' => Alignment::VERTICAL_CENTER,
                            'horizontal' => Alignment::HORIZONTAL_CENTER,
                        ],
                        'borders' => [
                            'bottom' => [
                                'borderStyle' => Border::BORDER_THIN,
                                'color' => ['rgb' => 'CBD5E1'],
                            ],
                        ],
                    ]);

                    $sheet->getRowDimension($row)->setRowHeight(25);
                }

                // Task rows
                foreach ($this->dataRows as $row) {
                    $sheet->getStyle("A{$row}:K{$row}")->applyFromArray([
                        'alignment' => [
                            'vertical' => Alignment::VERTICAL_CENTER,
                        ],
                    ]);

                    $sheet->getStyle("A{$row}")->getAlignment()
                        ->setHorizontal(Alignment::HORIZONTAL_CENTER);

                    $sheet->getStyle("G{$row}:I{$row}")
                        ->getNumberFormat()
                        ->setFormatCode('dd mmm yyyy');
                }

                // Project summaries
                foreach ($this->projectSummaryRows as $row) {
                    $sheet->getStyle("A{$row}:K{$row}")->applyFromArray([
                        'font' => [
                            'bold' => true,
                            'color' => ['rgb' => '0F766E'],
                        ],
                        'fill' => [
                            'fillType' => Fill::FILL_SOLID,
                            'startColor' => ['rgb' => 'CCFBF1'],
                        ],
                        'borders' => [
                            'top' => [
                                'borderStyle' => Border::BORDER_THIN,
                                'color' => ['rgb' => '99F6E4'],
                            ],
                        ],
                    ]);

                    $sheet->getRowDimension($row)->setRowHeight(24);
                }

                // Overall summary
                $sheet->getStyle(
                    "A{$this->overallSummaryRow}:K{$this->overallSummaryRow}"
                )->applyFromArray([
                    'font' => [
                        'bold' => true,
                        'size' => 11,
                        'color' => ['rgb' => 'FFFFFF'],
                    ],
                    'fill' => [
                        'fillType' => Fill::FILL_SOLID,
                        'startColor' => ['rgb' => '0F172A'],
                    ],
                    'borders' => [
                        'top' => [
                            'borderStyle' => Border::BORDER_MEDIUM,
                            'color' => ['rgb' => '334155'],
                        ],
                    ],
                ]);

                $sheet->getRowDimension($this->overallSummaryRow)
                    ->setRowHeight(28);

                // Alignment and borders
                $sheet->getStyle("A1:K{$lastRow}")
                    ->getAlignment()
                    ->setWrapText(true);

                $sheet->getStyle("A1:K{$lastRow}")
                    ->getBorders()
                    ->getAllBorders()
                    ->setBorderStyle(Border::BORDER_HAIR);

                // Print settings
                $sheet->getPageSetup()
                    ->setOrientation(PageSetup::ORIENTATION_LANDSCAPE);

                $sheet->getPageSetup()
                    ->setFitToPage(true)
                    ->setFitToWidth(1)
                    ->setFitToHeight(0);

                $sheet->getPageSetup()
                    ->setPrintArea("A1:K{$lastRow}");

                $sheet->getPageMargins()
                    ->setTop(0.5)
                    ->setRight(0.3)
                    ->setLeft(0.3)
                    ->setBottom(0.5);
            },
        ];
    }

    private function excelDate(?string $value): ?float
    {
        return $value
            ? ExcelDate::dateTimeToExcel(Carbon::parse($value))
            : null;
    }
}
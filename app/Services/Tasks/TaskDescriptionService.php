<?php

namespace App\Services\Tasks;

use App\Models\Task;
use Illuminate\Validation\ValidationException;
use Mews\Purifier\Facades\Purifier;

class TaskDescriptionService
{
    public function scalarChanges(Task $task, array $data): array
    {
        $old = [
            'title' => $task->title,
            'description' => $task->description,
            'priority' => $task->priority->value,
            'start_date' => $task->start_date?->toDateString(),
            'end_date' => $task->end_date?->toDateString(),
        ];

        $attributes = [];
        $changes = [];

        foreach ($old as $field => $before) {
            if (! array_key_exists($field, $data)) {
                continue;
            }

            $after = $data[$field];

            if ($field === 'description') {
                // HTML description ကို sanitize လုပ်ပြီးမှ ဒီ method ထဲ ပို့ထားရမယ်။
                $beforeText = $this->descriptionText($before);
                $afterText = $this->descriptionText($after);

                // Formatting ပဲပြောင်းရင်လည်း HTML ကို update လုပ်နိုင်ရမယ်။
                if ($after === $before) {
                    continue;
                }

                $attributes[$field] = $after;

                // History ထဲမှာ HTML tags မသိမ်းဘဲ plain text excerpt ပဲသိမ်းမယ်။
                $changes[$field] = [
                    'from' => $this->excerpt($beforeText),
                    'to' => $this->excerpt($afterText),
                ];

                continue;
            }

            if ($after === $before) {
                continue;
            }

            $attributes[$field] = $after;

            $changes[$field] = [
                'from' => $before,
                'to' => $after,
            ];
        }

        // ပြောင်းလဲပြီးသား date values နဲ့ validation လုပ်မယ်။
        $start = array_key_exists('start_date', $data)
            ? $data['start_date']
            : $old['start_date'];

        $end = array_key_exists('end_date', $data)
            ? $data['end_date']
            : $old['end_date'];

        if ($start && $end && $end < $start) {
            throw ValidationException::withMessages([
                'end_date' => 'The end date cannot be earlier than the start date.',
            ]);
        }

        return [$attributes, $changes];
    }

    /**
     * Rich Text HTML ကို plain text အဖြစ် ပြောင်းမယ်။
     */
    protected function descriptionText(?string $description): string
    {
        if ($description === null || trim($description) === '') {
            return '';
        }

        $text = strip_tags(
            str_replace(
                ['</p>', '</li>', '</ul>', '</ol>', '<br>', '<br/>', '<br />'],
                "\n",
                $description
            )
        );

        return trim(html_entity_decode(
            $text,
            ENT_QUOTES | ENT_HTML5,
            'UTF-8'
        ));
    }

    protected function excerpt(?string $text): ?string
    {
        if ($text === null) {
            return null;
        }

        return mb_strlen($text) > 200 ? mb_substr($text, 0, 200).'…' : $text;
    }

    /**
     * @param  int[]  $ids
     * @param  array<int, string>  $names
     * @return array<int, array{id: int, name: ?string}>
     */
    public function sanitizeDescription(?string $description): ?string
    {
        if ($description === null || trim($description) === '') {
            return null;
        }

        $clean = Purifier::clean($description, 'task_description');

        return trim($clean) === '' ? null : $clean;
    }
}

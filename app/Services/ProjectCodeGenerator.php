<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;
use RuntimeException;

class ProjectCodeGenerator
{
    private const SEQUENCE = 'project';

    public function next(): string
    {
        return DB::transaction(function () {
            $current = DB::table('sequences')
                ->where('name', self::SEQUENCE)
                ->lockForUpdate()
                ->value('value');

            if ($current === null) {
                throw new RuntimeException('Project sequence is not initialised.');
            }

            $next = $current + 1;

            DB::table('sequences')->where('name', self::SEQUENCE)->update(['value' => $next]);

            
            return 'PRJ-'.str_pad((string) $next, 3, '0', STR_PAD_LEFT);
        });
    }
}
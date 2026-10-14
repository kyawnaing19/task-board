<?php

namespace App\Enums;

enum TaskPriority: string
{
    case LOW = 'LOW';
    case NORMAL = 'NORMAL';
    case HIGH = 'HIGH';
    case URGENT = 'URGENT';
}
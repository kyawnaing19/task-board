<?php

namespace App\Enums;

enum UserRole: string
{
    case SUPER_ADMIN= 'SUPER_ADMIN';
    case EMPLOYEE= 'EMPLOYEE';
}

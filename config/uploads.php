<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Avatar Storage Disk
    |--------------------------------------------------------------------------
    |
    | Avatars should be stored on a publicly accessible disk.
    |
    */

    'avatar_disk' => env('UPLOADS_AVATAR_DISK', 'public'),

    /*
    |--------------------------------------------------------------------------
    | Attachment Storage Disk
    |--------------------------------------------------------------------------
    |
    | Attachments should use private storage by default.
    |
    */

    'attachment_disk' => env('UPLOADS_ATTACHMENT_DISK', 'private'),
];
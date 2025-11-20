<?php

namespace App\Models;

use Laravel\Sanctum\PersonalAccessToken as SanctumPersonalAccessToken;

class AuthToken extends SanctumPersonalAccessToken
{
    /**
     * La tabla asociada con el modelo.
     * 
     * * @var string
     */
    protected $table = 'auth_tokens';
}
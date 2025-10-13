<?php

declare(strict_types=1);

namespace AssurKit\Models;

use Illuminate\Database\Eloquent\Model as EloquentModel;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

abstract class Model extends EloquentModel
{
    use HasUuids;

    public $incrementing = false;
    protected $keyType = 'string';
}
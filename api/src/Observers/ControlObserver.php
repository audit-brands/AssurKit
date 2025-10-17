<?php

declare(strict_types=1);

namespace AssurKit\Observers;

use AssurKit\Models\Control;

class ControlObserver
{
    /**
     * Handle the Control "creating" event.
     * This fires before a new model is inserted into the database.
     */
    public function creating(Control $control): void
    {
        // Only generate control_id if not provided
        if (empty($control->control_id)) {
            $control->setAttribute('control_id', $this->generateControlId());
        }
    }

    /**
     * Generate the next sequential control_id.
     */
    private function generateControlId(): string
    {
        $lastControl = Control::orderBy('control_id', 'desc')->first();

        if (!$lastControl || !$lastControl->control_id) {
            return 'CTL-001';
        }

        // Extract number from control_id like CTL-001
        if (preg_match('/CTL-(\d+)/', $lastControl->control_id, $matches)) {
            $nextNumber = intval($matches[1]) + 1;

            return 'CTL-' . str_pad((string) $nextNumber, 3, '0', STR_PAD_LEFT);
        }

        return 'CTL-001';
    }
}

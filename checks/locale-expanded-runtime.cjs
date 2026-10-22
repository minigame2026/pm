// Separate batches keep each browser check within the workflow time budget.
process.env.PM_LOCALE_NEW_ONLY='1';
require('./locale-runtime.cjs');

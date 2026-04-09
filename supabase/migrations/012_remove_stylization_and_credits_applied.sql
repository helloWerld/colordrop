-- Remove unused stylization column (product has no stylization options).
ALTER TABLE saved_conversions DROP COLUMN IF EXISTS stylization;

-- Legacy: conversion credits never applied toward book price.
ALTER TABLE books DROP COLUMN IF EXISTS credits_applied_value_cents;
ALTER TABLE orders DROP COLUMN IF EXISTS credits_applied_value_cents;

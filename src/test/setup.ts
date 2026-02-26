import '@testing-library/jest-dom/vitest';
import { installDialogPolyfill } from './helpers/dialogPolyfill';

// Install HTMLDialogElement polyfill for jsdom globally.
// Individual test files no longer need their own beforeEach for showModal/close.
installDialogPolyfill();

import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import ErrorBoundary from './core/error/ErrorBoundary';

const rootEl = document.getElementById('root');
if (!rootEl) {
	// eslint-disable-next-line no-console
	console.error('Failed to find root element');
} else {
	createRoot(rootEl).render(
		<ErrorBoundary>
			<App />
		</ErrorBoundary>
	);
}

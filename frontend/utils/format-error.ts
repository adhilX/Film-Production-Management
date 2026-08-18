import { AxiosError } from 'axios';

export function formatError(err: any, defaultMsg = 'Something went wrong.'): string {
  if (!err) return defaultMsg;

  // Handle AxiosError or responses
  if (err.response) {
    const status = err.response.status;
    const data = err.response.data;
    const config = err.config;

    // Decode NestJS ValidationPipe array message or standard message
    let backendMessage: string | null = null;
    if (data) {
      const message = data.message;
      if (Array.isArray(message)) {
        backendMessage = message.join(', ');
      } else if (typeof message === 'string') {
        backendMessage = message;
      }
    }

    if (status === 400) {
      return backendMessage || 'Bad request.';
    }
    if (status === 401) {
      const url = config?.url || '';
      if (url.includes('/auth/login')) {
        return backendMessage || 'Invalid email or password. Please check your credentials.';
      }
      return 'Your session has expired. Please log in again.';
    }
    if (status === 403) {
      if (backendMessage && backendMessage !== 'Forbidden resource') {
        return backendMessage;
      }
      return "You don't have permission to perform this action.";
    }
    if (status === 404) {
      if (backendMessage && backendMessage !== 'Not Found') {
        return backendMessage;
      }
      return 'The requested resource was not found.';
    }
    if (status === 409) {
      return backendMessage || 'This record already exists.';
    }
    if (status === 422) {
      return backendMessage || 'Validation failed.';
    }
    if (status === 500) {
      return backendMessage || 'Internal server error. Please try again later.';
    }

    if (backendMessage) {
      return backendMessage;
    }
  }

  // Network error
  if (err.request) {
    return 'Unable to connect to the server. Please check your network connection.';
  }

  return err.message || defaultMsg;
}

export default formatError;

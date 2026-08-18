import { AxiosError } from 'axios';

export function formatError(err: any, defaultMsg = 'Something went wrong.'): string {
  if (!err) return defaultMsg;

  // Handle AxiosError or responses
  if (err.response) {
    const status = err.response.status;
    const data = err.response.data;

    if (status === 401) {
      return 'Your session has expired. Please log in again.';
    }
    if (status === 403) {
      return "You don't have permission to perform this action.";
    }
    if (status === 404) {
      return 'The requested resource was not found.';
    }
    if (status === 409) {
      return 'This record already exists.';
    }

    // Decode NestJS ValidationPipe array message or standard message
    if (data) {
      const message = data.message;
      if (Array.isArray(message)) {
        return message.join(', ');
      }
      if (typeof message === 'string') {
        return message;
      }
    }
  }

  // Network error
  if (err.request) {
    return 'Unable to connect to the server. Please check your network connection.';
  }

  return err.message || defaultMsg;
}

export default formatError;
